# JBIQ — Resumption & Repair Implementation Brief

> Engineering brief for Claude Code. Companion to `JBIQ-Voice-Resumption-and-Repair-Spec.docx` (the design spec). This file translates that spec into concrete work items targeted at this codebase.
>
> **Scope:** Add (a) interrupted-task resumption and (b) turn-level edit (user input + assistant response) to the existing voice chat in `index.html`. No backend changes required for V1 — all state lives client-side in `localStorage`.
>
> **Out of scope:** Cross-device resume, JioID-bound state, server-side persistence, multi-profile devices.

---

## 0. Codebase context

Before you start, read these to ground yourself:

- `index.html` — single-file frontend (~6600 lines). Contains all CSS, HTML and JS. Voice overlay, chat messages, mute, listening, speaking states all live here.
- `server.js` — thin Express proxy to Anthropic. No persistence today. Don't change it for V1 unless a task below explicitly says so.
- `discovery.js` / `discovery.css` — DiscoveryView (Compare / Place / Catalog patterns). Edit-affordances on DiscoveryView responses live here.
- `JBIQ-Voice-Plan-v2.docx` — strategic plan; this work closes two named gaps in the appendix.
- `JBIQ-Voice-Resumption-and-Repair-Spec.docx` — design spec. Authoritative on UX behaviour and copy. Read §3 (resumption), §4 (editing), §5 (copy) before coding.

**Key existing state to be aware of:**

- `conversationHistory` (declared around line 3592 of `index.html`) — `[{role: 'user', content}, {role: 'assistant', content}]`. This is the source of truth for the chat; resumption persists it, editing mutates it.
- `USER_PROFILE` is already `localStorage`-backed with the `jbiq_*` namespace. Reuse that pattern for new keys.
- Voice overlay state classes on `.voice-overlay`: `chat-active`, `agent-speaking`, `user-speaking`, `muted`, `editing-active`, `action-sheet-open`. Resumption and editing add new state classes — keep the convention.
- The home `Speak` CTA and tooltip are already gated by `localStorage`. The Resume strip sits in the same region; reuse the layout containers where possible.

---

## 1. Acceptance criteria (overall)

The implementation is done when **all** of these are true:

1. After a `visibilitychange` to `hidden` mid-turn, the next `visibilitychange` to `visible` (or app reload) within 24 hours surfaces a Resume strip on the home screen with a one-line summary and **Resume** / **Discard** buttons.
2. Tapping **Resume** restores `conversationHistory`, scrolls the chat to the last turn, restores any open DiscoveryView, and re-enters listening state without re-speaking the prior assistant turn.
3. Every turn rendered in `.chat-messages` has an edit pencil affordance (≥ 32 px touch target). Tapping it opens an inline edit field for that turn's text.
4. Submitting an edit on a **user** turn truncates `conversationHistory` at that point, re-appends the edited text, and triggers a fresh `/api/chat` call. Superseded turns remain visible but collapsed.
5. Submitting an edit on an **assistant** turn (via "Try again" / "Not what I meant") regenerates from the same upstream user turn. The prior assistant turn is collapsed and labelled.
6. Saying a recognised repair phrase (`"no I said …"`, `"actually …"`, `"I meant …"`, `"scratch that"`) is routed through the edit pipeline rather than appended as a new turn.
7. If the user edits any turn that fed into a pending Confirm & Pay, the payment is voided in the UI and a "Payment cancelled — re-confirm after edit" notice is shown until they resubmit.
8. State writes do not exceed one `localStorage.setItem` per turn boundary. The persisted record is capped at 200 KB and oldest-first evicted when over cap.
9. All copy matches §5 of the spec exactly. No improvised wording.
10. Telemetry hooks (console events for V1, named per §6 below) fire for every resume, every edit, every Confirm & Pay revoke.

---

## 2. Implementation order

Work the phases in this order. Each phase is independently shippable and testable. Don't merge phases.

### Phase A — State persistence foundation
The plumbing that everything else depends on.

### Phase B — Resume strip + recovery flow
The user-visible resumption UX.

### Phase C — Edit pencil on past turns
Inline editing for both user and assistant turns.

### Phase D — Voice repair phrases
"No I said", "actually", "scratch that" routed through the edit pipeline.

### Phase E — Confirm & Pay re-confirmation rule
Edits void pending payments and re-prompt.

### Phase F — Telemetry + cleanup
Console events, eviction, cap enforcement, expiry.

---

## 3. Phase A — State persistence foundation

### A.1 Define the persisted session record

Add a single `sessionState` module near the top of the JS section in `index.html`. Shape:

```js
// Persisted session record (one per device, V1)
// Stored at localStorage['jbiq_session_state']
{
  version: 1,
  updatedAt: 1714521600000,        // ms epoch, used for "Paused 4 min ago"
  status: 'in_flight',             // 'in_flight' | 'completed' | 'discarded'
  summary: 'Finding a plumber in Andheri',  // ≤ 60 chars, generated, see A.4
  conversationHistory: [...],      // exact shape used in memory today
  uiState: {
    discoveryView: null,           // {type, payload} or null
    selectedItemId: null,
    scrollPosition: 0,
  },
  pendingPayment: null,            // {token, amountInr, label, issuedAt} or null
  audioBuffer: null,               // V1: not stored. Reserved for V2.
}
```

### A.2 Read / write API

Add three functions. Keep them small.

```js
function loadSession() { /* returns the record or null; null on parse error */ }
function saveSession(partial) { /* shallow-merge into existing, set updatedAt */ }
function clearSession() { /* removes the key */ }
```

Acceptance:
- `saveSession` is called from exactly five places: (i) on every `conversationHistory.push`, (ii) on DiscoveryView open / close, (iii) on Confirm & Pay issuance, (iv) on `visibilitychange` to `hidden`, (v) on `beforeunload`.
- Writes are debounced to no more than one per 250 ms.
- Total stored record size is capped at 200 KB. If a write would exceed cap, oldest turns in `conversationHistory` are dropped first (keep the last 20 turns at minimum). Log the eviction.

### A.3 Expiry

Add `SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000`. On load, if `Date.now() - updatedAt > SESSION_EXPIRY_MS`, treat the record as absent and clear it.

### A.4 Summary line generation

Generate the summary from the most recent **user** turn:

- If turn is < 50 chars, use it verbatim with a leading verb-cleanup pass (strip "find me a", "tell me about", etc. → "Plumber in Andheri").
- If ≥ 50 chars, truncate to 50 chars at a word boundary and append "…".
- If the turn is in Hindi or a regional language, do not translate. Pass through.
- If `pendingPayment` is non-null, prefer that as the summary: `"₹{amount} {label} — payment pending"`.

---

## 4. Phase B — Resume strip + recovery flow

### B.1 Markup

Add the strip directly under the home Speak CTA in `index.html`. Hidden by default; shown via a state class on the parent.

```html
<!-- Resume strip — hidden by default, shown when window.__jbiqHasResumableSession -->
<div class="resume-strip" id="resumeStrip" hidden>
  <div class="resume-strip__copy">
    <div class="resume-strip__header">Pick up where you left off</div>
    <div class="resume-strip__summary">
      <span id="resumeSummary"></span>
      <span class="resume-strip__sep">·</span>
      <span id="resumeAge"></span>
    </div>
  </div>
  <div class="resume-strip__actions">
    <button class="resume-strip__btn resume-strip__btn--primary" id="resumeBtn">Resume</button>
    <button class="resume-strip__btn resume-strip__btn--secondary" id="discardBtn">Discard</button>
  </div>
</div>
```

### B.2 Styling

Match the existing home tooltip / Speak CTA visual language. Border radius, font weight, button heights. Strip height: ~72 px. Don't push the Speak CTA below the fold on a JioPhone-class viewport (≤ 360 × 640).

### B.3 Surface logic

On home render:
1. Call `loadSession()`.
2. If non-null and `status === 'in_flight'`, populate `#resumeSummary` and `#resumeAge` (e.g. `"Paused 4 min ago"`, `"Paused yesterday"`), unhide the strip.
3. If null or expired, leave hidden.

### B.4 Resume action

`#resumeBtn` click handler:
1. Restore `conversationHistory` from the record.
2. Re-render the chat into `.chat-messages`.
3. If `uiState.discoveryView` is set, re-mount it via the existing DiscoveryView APIs in `discovery.js`.
4. Scroll `.chat-messages` to `uiState.scrollPosition`.
5. Append a system "recap" line directly above the listening hint: `"Last time: {summary}. Continue?"`. This is a plain text element, not a `conversationHistory` entry.
6. Enter `chat-active` state and start listening (as if the user had tapped the Speak CTA).
7. Do **not** re-speak the prior assistant turn. The recap is text-only.
8. Fire telemetry: `jbiq.resume.success`.

### B.5 Discard action

`#discardBtn` click handler:
1. `clearSession()`.
2. Hide the strip.
3. Fire telemetry: `jbiq.resume.discard`.

### B.6 Visibility / interrupt detection

Add listeners early in app boot:

```js
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveSession({ status: 'in_flight' });   // checkpoint
  } else {
    // foregrounded — re-render Resume strip if applicable
    refreshResumeStrip();
  }
});
window.addEventListener('beforeunload', () => saveSession({ status: 'in_flight' }));
```

Network drop and incoming-call cases are handled implicitly by `visibilitychange` on mobile browsers. Don't add OS-specific code paths.

### B.7 Edge: start-new collision

If the user opens the app and immediately taps the Speak CTA (or starts speaking) without tapping Resume, treat it as start-new:
1. Move the in-flight session to a `jbiq_session_history` array (cap 5, FIFO).
2. `clearSession()`.
3. Hide the Resume strip.
4. Proceed with the new turn.

### B.8 Edge: completed Confirm & Pay before interrupt

If `pendingPayment` was confirmed and resolved before the interrupt, the in-flight record's `status` should be `'completed'` and the Resume strip must **not** surface. The chat history is still in `jbiq_session_history` for the user to revisit.

---

## 5. Phase C — Edit pencil on past turns

### C.1 Markup

Modify the existing chat-message render path to append an edit affordance to every turn:

```html
<button class="chat-msg__edit" aria-label="Edit this turn" data-turn-index="{i}">
  <!-- pencil SVG -->
</button>
```

Touch target ≥ 32 × 32 px. Trailing edge of the bubble. Slightly recessed (60% opacity) on non-most-recent turns.

### C.2 Edit field

On click, replace the bubble text with an editable `<textarea>` and two buttons: **Update & retry** / **Cancel**. The voice overlay enters `editing-active` state (the existing class), which already suppresses the listening hint and avatar.

### C.3 User-turn edit submission

On **Update & retry** for a user turn at index `i`:
1. Truncate `conversationHistory` to length `i` (drops the edited turn and everything after).
2. Push the edited text as `{role: 'user', content: editedText}`.
3. Mark all dropped turns as `superseded: true` and append them to a `supersededTurns` array on the session record (for collapsed display — see C.5).
4. Trigger the standard `/api/chat` call to regenerate.
5. Fire `jbiq.edit.user` telemetry: `{turnIndex, originalLength, editedLength}`.
6. Apply the **Re-confirmation rule** (Phase E) if any superseded turn fed a pending payment.

### C.4 Assistant-turn edit submission

Assistant turns get two affordances instead of an editable text field: **Try again** and **Not what I meant**.

- **Try again**: re-issues the `/api/chat` request from the prior user turn unchanged. Marks the prior assistant turn superseded.
- **Not what I meant**: appends an automatic clarifier user turn (`"That wasn't what I meant — ask me one question to clarify"`) and triggers a regen.

Fire `jbiq.edit.assistant` telemetry: `{turnIndex, mode: 'try_again' | 'clarifier'}`.

### C.5 Superseded turn rendering

Superseded turns collapse to a single line with the copy: `"Earlier reply, replaced after edit. Tap to expand."` Tapping expands inline. Maintain reading order. Cap visible superseded turns at 3; older are hidden behind a "+ N more" affordance.

### C.6 Edit deep in history — cap

If the user edits a turn more than 10 turns from the most recent, show a `confirm()`-style modal first:
> **This will redo a lot of the conversation. Continue?**

Use the existing modal pattern (DiscoveryView confirms one already). Do not use the native `window.confirm`.

### C.7 Edited inline marker

After an edit submits, the chat-message bubble for the new user turn carries `(edited)` in the system text colour, sized one step smaller than body, trailing the content. Do not use red.

---

## 6. Phase D — Voice repair phrases

### D.1 Detection

Wrap the existing transcript-finalisation path. Before pushing a finalised utterance into `conversationHistory` as a new user turn, run it through `detectRepairIntent(utterance)`:

```js
function detectRepairIntent(utterance) {
  // Returns { kind: 'correction' | 'undo' | null, payload?: string }
  // 'correction' — user is correcting the most recent user turn
  // 'undo' — user wants to scrap the last turn (scratch-that family)
}
```

Recognised triggers (V1, English + Hinglish; Hindi/regional in V2):
- **Correction**: turn-initial `"no I said …"`, `"actually …"`, `"I meant …"`, `"sorry I meant …"`, `"nahi maine kaha …"`. Must be turn-initial AND followed by content. Bare `"actually"` does not count.
- **Undo**: `"scratch that"`, `"forget that"`, `"wapas le lo"`. Standalone or turn-initial. Wipes the most recent user + assistant turn.

### D.2 Wiring

- If `detectRepairIntent` returns `'correction'`, route through the same code path as a user-turn edit submission (Phase C.3) targeting the most recent user turn, with `payload` as the new text.
- If `'undo'`, pop the last user + assistant pair from `conversationHistory`, re-render, fire `jbiq.repair.undo` telemetry. Do not regenerate.

### D.3 Voice acknowledgement

When a correction edit changes a recognised value (price, item, location), the assistant's regenerated response should open with a one-clause acknowledgement matching §5 copy: `"OK, switching to ₹399."` / `"Got it, LPG refill not water."`

This is enforced **prompt-side**, not client-side. Add a system-prompt fragment in `server.js` that activates only when the request body carries `{repair: true}`. Keep the fragment small:

```
If the user just corrected a previous turn (the request carries repair: true),
open your response with a single short clause acknowledging what changed
("OK, switching to ₹399.", "Got it, LPG not water.") and then answer.
Never apologise.
```

Pass `repair: true` from the client when the regen was triggered by `detectRepairIntent`.

---

## 7. Phase E — Confirm & Pay re-confirmation rule

### E.1 Detect "feeding turns"

A turn "feeds" a pending payment if its index is `≤ pendingPayment.issuedAtTurnIndex`. Track `issuedAtTurnIndex` when the payment is issued.

### E.2 Void on edit

When **any** edit submits (user-turn edit, assistant-turn regen, voice repair), check if a pending payment exists and if the edit touches a feeding turn. If yes:
1. Set `pendingPayment = null` on the session record.
2. Render a passive notice at the foot of the chat: `"Payment cancelled. Re-confirm after edit."` Sticky until the user re-issues a payment or dismisses.
3. Disable the existing Confirm & Pay tap target until a fresh payment is issued by the assistant flow.
4. Fire `jbiq.payment.revoked_by_edit` telemetry.

### E.3 No silent re-execute

If a session is resumed (Phase B) with a `pendingPayment` whose `issuedAt` is older than 5 minutes, treat the payment as expired and clear it. Show the same passive notice. The user must trigger a fresh confirmation via the assistant flow.

---

## 8. Phase F — Telemetry + cleanup

### F.1 Telemetry events (V1: console)

Emit via `console.info('[jbiq.telemetry]', eventName, payload)`. We'll wire to a real sink later.

| Event | Payload | When |
| --- | --- | --- |
| `jbiq.session.checkpoint` | `{turnCount, sizeBytes}` | Every `saveSession` |
| `jbiq.session.evicted` | `{turnsDropped}` | When cap eviction runs |
| `jbiq.resume.surfaced` | `{ageMs}` | Resume strip rendered |
| `jbiq.resume.success` | `{ageMs, turnCount}` | Resume tap |
| `jbiq.resume.discard` | `{ageMs}` | Discard tap |
| `jbiq.resume.ignored` | `{ageMs}` | Strip surfaced but user started new |
| `jbiq.edit.user` | `{turnIndex, originalLength, editedLength}` | User turn edit submit |
| `jbiq.edit.assistant` | `{turnIndex, mode}` | Try again / clarifier |
| `jbiq.repair.correction` | `{trigger, turnIndex}` | Voice correction routed |
| `jbiq.repair.undo` | `{turnIndex}` | Scratch-that |
| `jbiq.payment.revoked_by_edit` | `{amountInr, ageMs}` | Payment voided |

### F.2 Eviction & expiry housekeeping

On every `loadSession`:
1. If expired, `clearSession()`.
2. If `jbiq_session_history` exceeds 5 entries, drop oldest.
3. If total `localStorage` usage attributed to JBIQ exceeds 1 MB, drop oldest history entries until under cap.

### F.3 Discoverability

Do **not** add a coachmark to the edit pencil in V1. Listed as an open question in §8 of the spec; pending team decision. Leave the affordance discoverable via visual hierarchy only.

---

## 9. Testing

### 9.1 Manual test script

Run these in order against a local `npm run dev`. All must pass.

1. Have a 3-turn conversation. Switch tabs. Wait 30 sec. Return → Resume strip with correct summary and age.
2. Tap Resume → chat restored, recap line visible above listening hint, no audio replay of prior assistant turn.
3. Tap edit pencil on the second user turn → editable field appears, two buttons. Edit text and submit → third turn collapses with "Earlier reply, replaced after edit", new assistant turn streams in.
4. Issue a Confirm & Pay (use the existing demo flow). Edit the user turn that triggered it → payment notice appears, Confirm & Pay tap target disabled.
5. Say `"actually make it ₹399"` after a recharge utterance → no new turn appended; the prior turn updates; assistant response opens with "OK, switching to ₹399."
6. Say `"scratch that"` → most recent user + assistant pair vanish. Listening resumes.
7. Force-quit Safari. Reopen within 24 h → Resume strip surfaces. Reopen after 24 h (or manipulate `updatedAt` in DevTools) → strip absent.
8. Edit a turn 12 turns deep → modal appears. Confirm → regen runs. Cancel → no change.
9. Open DiscoveryView (Place), switch tabs, return, Resume → DiscoveryView re-mounts with same selection.
10. Pile up 6 sessions in `jbiq_session_history` → oldest is dropped, count stays at 5.

### 9.2 Cross-cutting checks

- No `localStorage` write fires more than once per 250 ms during rapid typing.
- The serialised session record never exceeds 200 KB. Test with a 50-turn conversation + a Catalog DiscoveryView.
- `editing-active` state class is correctly added/removed on edit start/cancel/submit. Listening hint and avatar are suppressed during editing as today.
- Mute state is preserved across resume. A muted session resumes muted.

### 9.3 Smoke test for regressions

The existing voice flow (Speak CTA → listen → speak → assistant response → DiscoveryView) must work unchanged when no in-flight session exists and no edits are made. Resume strip absent, edit pencils present but not invoked, no telemetry beyond standard.

---

## 10. Copy reference (do not improvise)

Pulled verbatim from §5 of the spec.

| Surface | Copy |
| --- | --- |
| Resume strip — header | Pick up where you left off |
| Resume strip — summary template | `{summary} · paused {age}` |
| Resume on call interrupt (V2) | You were speaking when a call came in. Continue? |
| Network drop banner (V2) | Offline — your words are being saved. |
| Reconnect indicator (V2) | Caught up. |
| Edit pencil tooltip / aria-label | Edit this turn |
| Edited inline marker | (edited) |
| Superseded turn label | Earlier reply, replaced after edit. Tap to expand. |
| Confirm & Pay voided notice | Payment cancelled. Re-confirm after edit. |
| Voice ack — value changed | OK, switching to {new value}. |
| Voice ack — intent changed | Got it, {new intent} not {old intent}. |
| Edit-deep modal | This will undo a lot of the conversation. Continue? |

---

## 11. Things to leave alone

- The mute redesign. Don't touch the muted state. It was finalised in the prior cycle.
- The home Speak CTA position. The Resume strip sits **under** it, not in place of it.
- Server-side session storage. V1 is client-only.
- Cross-device. Out of scope.
- The system prompt's existing rules (no markdown, no greetings, transactional pillars). The only addition is the `repair: true` fragment in Phase D.3.

---

## 12. Done means

- All Phase A–F acceptance criteria green.
- Manual test script in §9.1 fully passes.
- No regressions on the existing voice flow.
- Copy in §10 is exact.
- Telemetry events visible in console.
- A short PR description listing every event name introduced and every new `localStorage` key.
