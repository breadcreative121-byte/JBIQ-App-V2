# Omni — Mid-Conversation Connection Loss Spec
**v0.1 | May 2026 | For internal review**

P2 of the Omni error-states programme. This applies the Error Language Framework (v0.1) to the single highest-frequency failure mode for Bharat users: the network drops *several turns into* a conversation, while the user is in flow.

The PRD covers initial-connection failure. It does not cover what happens when a user is mid-utterance, mid-tool-call, mid-payment, or mid-stream when the network blips. That's this document.

---

## Why this is the hardest case

For the audience we're designing for, mid-conversation drops are not edge cases — they're the dominant network experience. Drops happen in metro stations, basements, near walls, on the move between cell towers, on patchy 4G in tier-2/3, and on shared Wi-Fi that gets crowded. Most drops recover in under 2 seconds; some take 10–30; some are permanent until the user moves.

Three things make this case harder than initial connection failure:

1. **There's in-flight work to protect.** A half-spoken utterance, a tool call that's already hit the API, a payment that may or may not have processed. Losing this silently is the fastest way to lose trust — Indian users have been burned by UPI outages and assume the worst.
2. **The user has context they don't want to lose.** They've already had three turns. Restarting the conversation feels like a punishment for the network's failure.
3. **They can't see what's happening server-side.** Did my message land? Is Omni still thinking? Did the booking go through? The product has to answer these without asking them.

Get this right and Bharat users will forgive a flaky network. Get it wrong and they leave.

---

## 1. Operating principles for this flow

**1. The cheapest drop is the one the user never sees.** Recover silently for anything under 2 seconds. Don't show a banner just because the network blinked.

**2. Reassurance comes before explanation.** When stakes are high — money, bookings, anything in-flight — the first words name what's *safe*, not what's broken.

**3. Never lose the user's input.** Voice utterances buffer. Typed messages persist in the input bar. Messages already sent stay visibly "with us." If the user spoke or typed something, it survives the drop.

**4. Offer the alternative path; never auto-switch modes silently.** Mid-utterance is the worst possible moment to silently change how the product behaves. The user must always *choose* the switch.

**5. Detect bad networks early, not late.** If we know the connection is shaky *before* the user starts speaking, we tell them and let them choose chat. Catching this on entry is better than catching it on the third dropped turn.

---

## 2. The four duration tiers

Every state below uses the same four tiers. Thresholds are starting points; tune from telemetry.

| Tier | Duration | What happens |
|---|---|---|
| **Blip** | < 2s | Silent auto-recover. No UI change. |
| **Dip** | 2–15s | Soft visible nudge. System still trying. User can keep working where it makes sense. |
| **Sustained** | 15–30s | Hard error state. Alternative path offered. In-flight work preserved and visible. |
| **Permanent** | > 30s, or LiveKit gives up | End-of-line. Save state, summarise what survived, route the user somewhere they can act. |

Transactional flows extend the dip tier to 30s and the sustained tier to 60s — the cost of a wrong move is too high to rush.

---

## 3. State-by-state spec

For each sub-case: what's in flight, what the user sees and hears at each tier, the framework copy in English and Hinglish, and what happens on reconnect.

### 3.1 Drop while user is speaking

In flight: live audio stream, partial STT transcript.

**Blip (<2s)** — Mic stays pulsing. Audio buffers on device. On recovery, buffered audio sends and STT resumes. User notices nothing.

**Dip (2–15s)** — Mic pulse softens; small offline indicator appears next to the agent UX. A single soft tone plays once at 3s. No spoken cue (silence and the tone do the work). User can continue speaking — audio buffers locally up to 10 seconds. On recovery, buffered audio sends.

- *Subtext (EN):* "Reconnecting…"
- *Subtext (HI):* "Connect kar raha hoon…"

**Sustained (>15s)** — Agent UX shifts to a disconnected animation. Mic disables. Buffered audio retained; if buffer reached its 10s ceiling, oldest audio is dropped first. Two affordances appear: try again, or switch to chat.

- *Spoken (EN):* "Network's not reaching us. Tap to try again, or switch to chat."
- *Spoken (HI):* "Network nahi mil raha. Dobara try kar, ya chat pe likh."
- *Subtext:* "Offline. Tap to retry."

**Permanent (>30s or LiveKit dead)** — Voice mode unavailable. Hard error card. Conversation thread preserved. Reassurance leads.

- *Spoken/Card (EN):* "Voice can't reach us right now. What you said is saved. Switch to chat to keep going."
- *Spoken/Card (HI):* "Voice abhi nahi mil raha. Jo bola woh saved hai. Chat pe baat aage badha."

---

### 3.2 Drop while Omni is processing

In flight: user input received, response not yet streaming.

**Blip** — Processing state continues. Thinking message keeps cycling per PRD §5. Recovery silent.

**Dip** — Processing state continues with a small offline indicator added next to the rotating thinking message. No copy change.

**Sustained** — Thinking state replaced with a soft retry card. The user's message stays visible above it (per PRD §7.2 it's already in the thread). Cancel + Resend affordances.

- *EN:* "Still waiting on this one. Tap to try again, or cancel."
- *HI:* "Iska reply abhi nahi aaya. Dobara try kar ya cancel kar."

**Permanent** — Hard error card. User's message preserved. No automatic resend (see §8 Decision 2).

- *EN:* "Couldn't get a response this time. Your question's still here — tap to ask again."
- *HI:* "Iska jawab nahi aaya. Tera sawal yahin hai — tap karke dobara puch."

---

### 3.3 Drop during a tool / skill call

The hardest sub-case. The tool may have already executed server-side (flight booked, payment initiated) even though the user never saw the result.

**Blip** — Tool-specific enriched message keeps cycling per PRD §5. Recovery silent.

**Dip** — Tool message keeps cycling, offline indicator added. No copy change for tool calls under 15s — the user is already in a known wait.

**Sustained (>15s for non-transactional)** — Soft retry card with tool-specific framing. Critically: on reconnect, **query tool state first** before offering retry. If the tool already returned, deliver the result; only offer retry if state confirms the call didn't complete.

- *EN:* "Looking up flights is taking longer than usual. Want to keep waiting, or cancel?"
- *HI:* "Flights dhundhne mein time lag raha hai. Ruk ya cancel kar?"

**Permanent** — Save the request, surface it explicitly, never silently retry.

- *EN:* "Couldn't finish the search. Your question's saved — try again in a moment."
- *HI:* "Search puri nahi ho payi. Tera sawal saved hai — thoda ruk ke phir try kar."

For transactional tool calls (payment, booking), see §6.

---

### 3.4 Drop while Omni is speaking

In flight: TTS audio playing and/or response text streaming.

**Blip** — Streaming continues seamlessly (TTS audio is buffered ahead). User notices nothing.

**Dip** — Streaming pauses. The partial response stays on screen, marked as in-progress (not as truncated — there's a distinction). Subtle offline indicator appears next to the agent UX. No spoken cue mid-response — silence is the cue.

**Sustained** — The partial response is marked as truncated per PRD §7.2 (interrupted response bubble pattern). Two actions on the bubble: replay what came through, or ask again.

- *Card / spoken on reconnect (EN):* "That answer got cut off. Tap to hear what came through, or ask me again."
- *HI:* "Jawab beech mein cut ho gaya. Jo aaya woh sun, ya dobara puch."

**Permanent** — Truncated bubble persists. User can ask again.

---

### 3.5 Drop while user is typing in chat (not yet sent)

In flight: a draft in the input bar.

**Blip** — Nothing changes. Draft is local.

**Dip** — Send button greys out. Small inline note under the input bar.

- *EN:* "Network just dipped. Keep typing — we'll send when you're back."
- *HI:* "Network thoda gaya. Likhta reh — wapas aate hi bhej denge."

**Sustained / Permanent** — Send stays disabled. Draft persists. Inline banner above the conversation thread, not blocking the input.

- *EN:* "You're offline. Your message is saved — send when you're back online."
- *HI:* "Tum offline ho. Message saved hai — wapas online ho ke bhej."

On reconnect: send button re-enables; draft remains. The user sends manually. (See §8 Decision 4 — we recommend against auto-send.)

---

### 3.6 Drop after Send in chat (waiting for response)

In flight: message delivered to backend, response not yet returned.

Same UX as §3.2 (drop while processing) — the user's message is already visibly in the thread, marked as sent. Treatment of the response delay is identical.

---

### 3.7 Drop during transactional flow

Covered in detail in §6. The duration tiers are extended (Dip extends to 30s; Sustained extends to 60s) and reassurance-first copy applies throughout.

---

### 3.8 Drop while rich content is loading

In flight: cards, images, or rich card data being fetched for screen display.

Per PRD §5 "Rich content rule," the screen has one job at a time. When rich content fails to load:

**Blip / Dip** — Skeleton state continues. No alarm.

**Sustained / Permanent** — Card replaced with a single retry tile. The voice summary that Omni already gave still applies — the user has the answer in audio, the screen just couldn't enrich.

- *EN:* "Couldn't load the cards this time. Tap to try, or ask in a different way."
- *HI:* "Cards load nahi hue. Tap kar ke phir try kar, ya alag se puch."

---

## 4. Reconnect and resume rules

1. **Auto-retry is silent for under 2s.** Exponential backoff: 1s → 2s → 4s → 8s. No UI change during this window.

2. **In-flight voice utterance:** audio buffers locally up to 10s. On reconnect within the buffer window, buffered audio is sent automatically and STT continues from where it stopped. Beyond 10s, the buffer is dropped and the user is asked to start the utterance again ("Didn't catch all of that — say it again?").

3. **In-flight tool call:** on reconnect, query tool state *before* offering retry. If the call already returned server-side, deliver the result. If the tool genuinely didn't run, retry is offered. **Never blind-retry a tool call** — risk of duplicate bookings, double-charges, etc.

4. **Streaming response:** if the response was mid-stream when the drop happened, on reconnect the system tries to resume the stream from where it left. If resumption fails, the partial response is marked truncated and the user can ask again.

5. **Chat draft and sent messages:** drafts persist in the input bar; sent messages stay in the thread visibly with a "sent" indicator. Neither is ever cleared by a network event.

6. **Voice → chat fallback is never silent.** The user always taps to switch. Mid-utterance auto-switching breaks trust — they may not realise the modality changed.

7. **Conversation thread gap.** After a sustained or permanent drop, a low-key inline marker appears in the thread — a thin divider with a soft caption like *"Reconnected"* or *"Network came back"*. Don't use clinical timestamps; use the same language the rest of the product uses.

8. **Reconnection confirmation.** After sustained or permanent loss, when the network returns the user gets one explicit confirmation: a soft toast or an inline note saying "Back online." This is one of the few cases where silent recovery is wrong — the user has been waiting and needs to *see* the recovery, not infer it.

---

## 5. What the user can do while offline

**Can:**
- Read the conversation thread and scroll history
- Tap any rich content already loaded before the drop
- Continue typing in chat (draft persists, send is disabled)
- Cancel an in-flight request
- Manually tap retry, or tap to switch from voice to chat

**Cannot:**
- Send a new message (Send disabled)
- Start a new voice turn (Mic disabled)
- Initiate a tool call
- Tap a card whose data wasn't fully loaded

The principle: read and prepare are always available. Send and act require connection.

---

## 6. The transactional case

Stakes are highest when money or a booking is involved. Apply these rules on top of the standard tiers:

**Extended thresholds.** Dip extends to 30s (with reassurance copy throughout), Sustained extends to 60s (with the reference number visible from the start of the dip).

**Reference number is visible from second one.** As soon as a transactional request is initiated, generate and display a reference. If the network drops, the user can see *something tangible* that proves the transaction is in the system.

**Copy structure inverts.** Standard structure is *state plainly → consequence → next step*. Transactional structure is *what is safe → what's pending → next step*.

**Worked example — payment in progress, sustained drop:**

- *Bad:* "Payment failed. Please retry."
- *Framework EN:* "Your payment is in our system. We're confirming it — give it a moment, or check your account in a few minutes. Reference: [code]."
- *Framework HI:* "Tera payment system mein hai. Confirm kar raha hoon — thoda ruk, ya account check kar do minute mein. Reference: [code]."

**On reconnect, auto-poll first.** Don't ask the user to tap "check status" if we can check ourselves. If the transaction completed server-side, auto-update the screen to confirmed. Only ask the user to act if backend state is genuinely unknown.

**Email or SMS fallback.** If permanent loss is confirmed and the transaction state is still unknown, send the user a confirmation by email/SMS with the reference. Tell them on screen that we've done so. Don't make them wonder.

---

## 7. Audit against the existing PRD

| PRD reference | Current treatment | What changes |
|---|---|---|
| §9.1 Connection error (voice) | "Connection lost. Reconnecting…" then "Couldn't connect. Tap to retry." | Keep the dip-tier copy ("Reconnecting…" / "Connect kar raha hoon…"). Replace the sustained-tier copy with §3.1 above — names what survived, offers the alternative path. |
| §9.1 Connection error (chat) | Inline banner with the same copy | Same — soften dip tier, sharpen sustained tier per §3.5. |
| §9.2 Processing error | "Something went wrong. Try again." | Replaced per §3.2. The new copy distinguishes "still waiting" from "couldn't get a response," neither of which is "something went wrong." |
| §7.2 Interrupted response bubble | "Partial text remains with a subtle visual marker indicating truncation." | Adopted as-is for §3.4. Truncation marker is design decision #4 in the PRD's open list. |
| §5 Rich content rule | "The screen has one job at a time." | Honoured — when cards fail, voice summary still applies (§3.8). |
| §7.2 Transactional bubble | "Permanent, non-deletable. Distinct visual treatment. Survives conversation clear." | Strengthened per §6. The reference number is now visible *during* the in-flight state, not just on success. |

No PRD copy is broken by this spec. Several pieces are made more honest about what they're doing.

---

## 8. Open product decisions

### Decision 1 — Pre-conversation network check

Should we measure connection quality before the user enters voice mode and steer them to chat if the network looks shaky?

**Recommendation: yes, soft steer.** On a connection that's measurably degraded (high latency or packet loss > a tunable threshold), the home screen replaces the "Tap to speak" affordance with a one-line note: *"Network's slow — voice will struggle. Tap to type instead."* User can override and still tap to speak. Catches the bad-experience early; doesn't take agency away.

### Decision 2 — Auto-resend after sustained loss

Should the system automatically resend the user's last message on reconnect, or wait for a manual tap?

**Recommendation: never auto-resend.** Especially for tool calls (booking, payment, search) where a duplicate is worse than nothing. The user always taps to retry. The single line of friction is worth the protection. Exception: voice utterances inside the 10s buffer window are auto-completed on reconnect — the user has not "submitted" a turn yet, they're still speaking it.

### Decision 3 — Voice → chat fallback timing

After how many seconds of sustained loss in voice mode do we surface the "switch to chat" option?

**Recommendation: 15s.** Aligned with the sustained-tier threshold. Earlier feels panicked. Later loses the user. Always offered as a tap, never auto-switched.

### Decision 4 — Auto-send queued chat draft on reconnect

If the user typed during offline, when network returns, do we send for them or wait for tap?

**Recommendation: wait for tap.** Two reasons. First, the user might have moved on — they may have typed something, then changed their mind, then waited. Second, auto-send violates the principle that the user always controls the modality. Send button re-enabling on reconnect is enough cue.

### Decision 5 — Conversation thread gap visibility

Do we mark the gap in the thread after a sustained drop?

**Recommendation: yes, in the product's own voice.** A thin inline divider with a single phrase like *"Reconnected"* / *"Wapas aaye"*. Not a timestamp, not "Connection restored at 2:14 PM." The thread is a conversation; the recovery is part of it.

### Decision 6 — Voice mode persistence after a manual switch to chat

If the user manually switched to chat during a drop, should the next turn default back to voice (because connection is now good) or stay in chat (because that's the last thing they chose)?

**Recommendation: stay in chat.** Honour the user's last explicit choice. The keyboard icon is one tap away. Defaulting back to voice silently feels like the product has overridden them.

---

## Appendix A — Research findings that shaped this spec

- **WhatsApp queues messages while offline; voice notes drop.** Users have a working mental model for "typed message will arrive later" but not for "voice will be preserved." We're explicitly building voice buffering and signposting it as a guarantee.
- **ChatGPT loses input on network drops; users have to start over.** This is the failure mode we're explicitly avoiding. Every input — voice and text — survives.
- **PhonePe/Paytm reassurance language is the differentiator in payment errors.** The copy structure in §6 is modelled on this insight: lead with what's safe, name the pending thing second, give the next step third.
- **Tier-2/3 users distrust silent auto-recovery because UPI outages have burned them.** Hence §4 rule 8 — recovery from sustained or permanent drops is always confirmed, never silent.
- **Voice → text fallback mid-utterance breaks trust because users may not realise the switch happened.** Hence §1 principle 4 and Decision 3 — the switch is always offered and tapped, never automatic.
- **Pre-conversation signal detection works; mid-conversation signal detection is unreliable.** Hence Decision 1 — we steer at entry, we don't try to switch the user mid-flow.

## Appendix B — Implementation notes for engineering

1. **State machine extensions.** Add four sub-states to every long-running state: blip (auto-recover), dip (soft nudge), sustained (hard error), permanent. Each long-running state has its own duration thresholds — connection loss thresholds (this doc) are different from processing thresholds (P1 doc) by design.
2. **Audio buffer.** A circular 10-second audio buffer for in-flight voice utterances, flushed on successful send.
3. **Tool state query.** Every tool call needs a state-query endpoint that the client polls on reconnect before showing retry. No blind retries on tools.
4. **Persistent draft.** Chat input bar draft persists in local storage across the entire app lifecycle, not just the session.
5. **Reference number generation.** Transactional flows generate a client-side reference at request initiation, sent with the request, displayed immediately. Server returns the canonical reference on confirmation; client reconciles.
6. **Reconnection telemetry.** Track every drop with: duration, tier reached, in-flight state at drop, recovery method (silent / user-tapped retry / mode switch / abandoned). This is the data we'll use to tune thresholds.
7. **Pre-flight network check.** A lightweight ping at the home screen on entry to voice mode, with a configurable threshold for steering the user to chat.

## Appendix C — What this surfaced for the P1 framework

Working through P2 stress-tested the P1 framework and turned up three things to tighten in v0.2:

1. **The transactional copy structure deserves to be a first-class pattern in P1, not a single worked example.** Move it into §2 (sentence shape) as a documented variant: *"What is safe → What is pending → Next step"*.
2. **The "after-second-failure offer alternative" rule generalises.** It applies to connection drops too: after the second sustained drop in a session, default the next turn to chat rather than voice.
3. **The watchdog thresholds in P1 (3s / 8s / 15s) are processing-specific.** Connection-loss thresholds (2s / 15s / 30s) are different. P1 should explicitly say thresholds are context-tuned, not universal.

These will go into P1 v0.2 once we apply the framework to one more flow (P3 — mic permissions) and confirm the patterns hold.
