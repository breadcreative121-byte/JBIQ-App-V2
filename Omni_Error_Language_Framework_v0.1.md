# Omni — Error Language Framework
**v0.1 | May 2026 | For internal review**

A tone-and-language system for every error and recovery state in Omni. Every message in the product gets written against this. If a message can't pass the rules below, rewrite it until it can.

This is not the error-state map (that's P2 onward). This is the spine — the language the rest of the work hangs from.

---

## Why this exists

The PRD's current error copy is a placeholder, not a system. "Couldn't connect. Tap to retry." and "Something went wrong. Try again." are both technically polite and practically useless: they don't tell a Bharat user what happened in language they recognise, and they don't lead anywhere.

For our audience this matters more than usual. Three things shape how they meet errors:

1. **Lower English literacy and lower digital literacy.** Roughly 370M Indian adults can't read English fluently; tier-2/3 users in particular have weaker mental models of "the app vs the network vs my phone."
2. **Voice-first context.** A user on the metro or in a kitchen can't read a banner, can't open Settings, can't debug. If the product feels broken, they don't troubleshoot — they leave.
3. **Hinglish is how they actually talk.** Roman-script Hindi-English mixing isn't a translation choice — it's the native register. Pure English sounds corporate; pure Hindi sounds formal. The mix is the trust signal.

Everything below follows from these three.

---

## 1. Five principles

**1. Warm, not apologetic.** Omni doesn't grovel. "Sorry," "unfortunately," and "we apologise" waste time and sound like a help centre. Acknowledge what happened and move forward.

**2. Clear over clever.** No wordplay, no metaphors, no cute. The user is doing something else. They have one second of attention.

**3. Agency, never helplessness.** Every message implies *you have a move*. Even "wait 10 seconds" is a move. "Something went wrong" is not.

**4. Voice-first, screen-second.** Errors that show up in voice mode must be speakable in one breath. If it doesn't read aloud cleanly, it's wrong copy. The screen exists to enrich, not to compensate for unclear speech.

**5. Honest about scope.** If Omni can't do something, say so. Don't fake a try, don't promise next time. Users see through it.

---

## 2. The sentence shape

> **[State the thing plainly] → [What it means for you, if not obvious] → [One clear next step]**

Three parts. The middle part is optional when the consequence is self-evident. Maximum one breath when read aloud.

**Voice-mode variant:** sound cue + spoken line + on-screen subtext. The cue does the work of "something needs your attention" so the words don't have to.

**Chat-mode variant:** inline message in plain words, with the next step as a tap-target where possible (not just a sentence).

---

## 3. When NOT to surface an error

The best error message is the one the user never sees. Apply this hierarchy:

1. **Auto-retry silently** for the first failure on connection, processing, or output. The user sees nothing.
2. **Surface a soft state** ("Just a moment longer…") only after the watchdog threshold is crossed (suggested 3s for processing, 1.5s for connection).
3. **Surface a hard error** only when retry has clearly failed or the user must take action.
4. **Suggest a different path** (try typing, try a shorter phrase, try later) after the *second* failure of the same kind. Bharat users don't loop on retries — they leave.

Default mindset: every error you can hide is one fewer chance to lose the user.

---

## 4. Banned words and swaps

| Avoid | Why | Use instead |
|---|---|---|
| Error | Jargon | "didn't work," "couldn't" |
| Failed / Failure | Blame-tinged | "didn't work," "couldn't" |
| Unable to | Robotic | "can't" |
| Please try again | Vague + slightly accusatory | name the action: "Tap to retry," "Try saying it again" |
| Sorry / We apologise / Unfortunately | Wastes time | omit |
| Something went wrong | Says nothing | name the actual thing: "No internet," "Didn't catch that" |
| Please wait | Could be forever | "Wait a moment," with a visible timer if longer than 5s |
| Permission denied | Jargon | "I can't hear you," "I can't access your camera" |
| The system is busy | Deflects | "This is taking longer than usual" |
| Network timeout / Connectivity issue | Jargon | "No internet," "WiFi isn't reaching us" |
| Invalid input | Computer-speak | "That doesn't work for this. Try…" |
| Unexpected error | Meaningless | name the actual thing |
| Uh-oh / Oops | Cutesy, undercuts seriousness for transactional moments | omit |
| Server / Backend / API | Jargon | "us," "Omni," "the connection" |
| Restart the application | Heavy, last-resort | save for genuine last resort |
| Try again later | Dismissive without a reason | give the reason or a time: "Try in a minute when the network's faster" |

A simple test: would your aunt use this word? If not, it's banned.

---

## 5. Hinglish handling

**When to use which.** Default is Hinglish for the conversational layer (mid-flight states, reassurance, voice prompts). Default is English for the precise instructional layer (Settings paths, button labels, payment confirmations). Mix freely inside one message — that's the point.

**Register.** Match the PRD's existing tone: casual, direct (`bolo`, `kar`), not formal (`boliye`, `kijiye`). Omni is a friend, not a clerk. The exception is the first time a user hits a hard error in a session — go slightly warmer.

**English fragments stay English.** Don't translate `mic`, `WiFi`, `app`, `Settings`, `tap`, `retry`, `network`. These are Hinglish too. Translating them to formal Hindi (`maaikrofon`, `vaayarles`) signals that the writer doesn't speak how the user does.

**Avoid the translated-from-English trap.** The fastest tell of bad Hinglish is sentence structure copied from English. Native Hinglish is shorter, drops obvious context, ends with action.

- ❌ "Aap apna WiFi check karo kyunki internet available nahi hai"
- ✅ "Internet nahi hai. WiFi check kar."

**One register per message.** Don't switch from `aap` to `tu` mid-sentence. Pick the register on first contact and hold it.

---

## 6. Worked examples

Each example shows: bad version → English version → Hinglish version. Where voice and chat behave differently, both are shown.

### 6.1 Connection lost (initial — entering the conversation)

**Bad:** "Couldn't connect. Tap to retry."

**English (voice subtext):** "Can't reach the network. Tap to try again."
**Hinglish (voice subtext):** "Network tak nahi pahuncha. Dobara try kar."

**Chat banner:** "No internet. Tap to reconnect." / "Internet nahi hai. Tap kar reconnect ke liye."

---

### 6.2 Connection lost (mid-conversation, after auto-retry failed)

**Bad:** "Connection interrupted. Reconnecting…"

**Voice (Omni speaks):** "Network just dropped. I'll keep your last question — tap when you're back online."
**Voice subtext:** "Offline. Tap when ready."
**Hinglish (Omni speaks):** "Network gaya abhi. Sawal yaad rakha hai — wapas online ho to tap kar."

**Chat banner:** "You're offline. Your message is saved." / "Tum offline ho. Message saved hai."

The reassurance ("I'll keep your last question") matters. Bharat users don't assume their input is safe.

---

### 6.3 Mic unavailable — permission not granted

**Bad:** "Microphone permission denied. Enable in Settings > Privacy > Microphone."

**Voice subtext:** "I can't hear you. Tap to allow mic."
*(Tap deep-links to OS settings — don't make the user navigate.)*
**Hinglish subtext:** "Sun nahi sakta. Mic on karne ke liye tap kar."

**On the settings hand-off screen:**
"Tap **Microphone** and turn it on. I'll be here." / "Microphone par tap kar aur on kar de. Main yahin hoon."

---

### 6.4 Mic unavailable — claimed by another app

**Bad:** "Microphone in use by another application."

**Voice subtext:** "Your mic is busy with another app. Close that one and tap to come back."
**Hinglish subtext:** "Mic dusra app use kar raha hai. Use band kar aur wapas tap kar."

---

### 6.5 Stuck state — the watchdog message

Trigger: any state running longer than its threshold (3s for processing, 1.5s for connection, 10s for tool calls).

**Bad:** "No response from server. Please wait or try again later."

**First nudge (around 3s):** "This is taking a moment longer than usual…" / "Thoda time lag raha hai…"

**Second nudge (around 8s):** "Still working on it. You can keep waiting or tap here to try a different way." / "Abhi bhi kaam chal raha hai. Ruko ya alag tareeke se try kar."

**Third nudge (around 15s, with cancel affordance):** "This isn't working today. Want to try again, or type your question instead?" / "Aaj nahi ho raha. Dobara try kar ya type kar de?"

This three-step reveal is the single most important pattern in the framework. It's the difference between a user waiting and a user leaving.

---

### 6.6 Voice input didn't land — first failure

**Bad:** "Speech not recognized. Please speak again."

**Voice (Omni speaks, soft tone):** "Didn't quite catch that — say it again?"
**Voice subtext:** "Didn't catch it."
**Hinglish (Omni speaks):** "Sahi nahi suna — dobara bol?"

---

### 6.7 Voice input didn't land — second failure (offer the alternative)

**Voice (Omni speaks):** "Still didn't catch it. Want to type it instead?" *(keyboard icon pulses)*
**Hinglish:** "Abhi bhi nahi suna. Type karna chahta hai?"

The pulse on the keyboard icon is the affordance. Words alone don't trigger the switch; the visual does.

---

### 6.8 No results (Omni heard correctly, the answer is empty)

**Bad:** "No results found for your query."

**Voice:** "Couldn't find anything for that. Try saying it differently, or give me a hint about where to look."
**Hinglish:** "Iska kuch nahi mila. Alag se bol ya thodi detail de — kahaan dhundhna hai."

This is *not* a system failure. Don't say "try again" — that implies retrying does something. It doesn't.

---

### 6.9 Out of scope (Omni can't do this kind of thing)

**Bad:** "This request is outside my current capabilities."

**Voice:** "I can't do that one yet. I'm good with weather, news, restaurants, and writing things — what do you need?"
**Hinglish:** "Yeh abhi nahi kar sakta. Weather, news, restaurants, ya likhne mein help de sakta hoon — kya chahiye?"

Listing what Omni *can* do prevents the user spending three more turns testing the same wall.

---

### 6.10 Output failure — TTS unavailable

**Bad:** "Text-to-speech service unavailable."

**On-screen note (no audio plays):** "Voice isn't working right now — I've written it out below."
**Hinglish:** "Awaaz abhi nahi chal rahi — neeche likh diya hai."

---

### 6.11 High-stakes error — the transactional case

When money or a booking is involved, reassurance comes first.

**Bad:** "Transaction failed. Please retry."

**Voice + screen:** "Payment didn't go through. Your money is safe — nothing was charged. Tap to try again."
**Hinglish:** "Payment nahi hua. Paisa safe hai — kuch deduct nahi hua. Dobara try kar."

The PRD doesn't yet handle transactional errors at the language level. They need this specific reassurance pattern: *what happened → what is safe → next step*.

---

## 7. Governance

### The aunt test

> **Read this aloud to your aunt who just got her first smartphone. Does she know what went wrong, and what to do next, without asking you a follow-up question?**

If no, rewrite. This is the single test that overrides everything else.

### Four review questions for any new error message

1. **Is it under 15 words and speakable in one breath?**
2. **Does it name the actual problem in plain words?** (Not "something went wrong" — what specifically?)
3. **Does it end with one concrete next step the user can take right now?**
4. **In Hinglish, does it sound like a person talking, not a manual translated?**

### Workflow

- **UX writer drafts** in English first, against the sentence shape.
- **Translator/native Hinglish writer adapts** — not translates. They rewrite for the register, not word-by-word.
- **Read-aloud check** with at least one native Hinglish speaker who isn't from a tech background.
- **Voice QA**: every voice-mode message gets read by the TTS voice and listened to. If it sounds robotic, rewrite the punctuation and the syllable count.
- **Designer pairs sound + words** for voice mode. The audio cue does half the work.

---

## 8. Audit: current PRD copy against the framework

| PRD copy | Verdict | Framework version |
|---|---|---|
| "Connecting…" | Fine | keep |
| "Tap to speak" | Fine | keep |
| "Listening" | Fine | keep |
| "Couldn't connect. Tap to retry." | Misses the consequence and the reason | **EN:** "Can't reach the network. Tap to try again."  •  **HI:** "Network tak nahi pahuncha. Dobara try kar." |
| "Connection lost. Reconnecting…" | OK as a transient state, weak as a hard error | keep for transient; for hard error use 6.2 above |
| "Something went wrong. Try again." | Fails every test | Replace per 6.5/6.8/6.9 depending on what actually broke |
| "Couldn't get a response. Tap to retry." | Slightly better but still vague | "I'm not getting through right now. Tap to try again." / "Abhi reach nahi ho raha. Dobara tap kar." |
| "Clearly nahi suna — sahi karo ya dobara bolo." | On-brand, good register, but two actions in one line | Split: first failure = "Sahi nahi suna — dobara bol?" Second failure = "Abhi bhi nahi suna. Type karna chahta hai?" |

---

## Appendix A — Research findings that shaped this framework

- **ASR fails on Indian accents.** When voice fails, users don't retry — they abandon the task entirely. This is why §6.7 forces an alternative path after the second failure.
- **Generic 'something went wrong' is the default in PhonePe, Google Pay, Paytm — and users hate it.** This is why §4 bans the phrase outright.
- **Hinglish in product copy works for reassurance and conversation; pure English is fine for instructional steps.** This is why §5 splits register by layer.
- **Voice-first users don't read screens.** This is why §1 principle 4 and §2's voice variant put the audio cue and spoken line first.
- **First-time-internet users have no mental model for "the network broke."** This is why §6.11 (transactional) leads with reassurance, not the failure.

## Appendix B — Implementation checklist

- [ ] All error copy under 15 words
- [ ] No words from the §4 banned list
- [ ] English (Indian register) and Hinglish versions both written
- [ ] Hinglish written by a native speaker, not translated
- [ ] Voice variant tested through the actual TTS voice
- [ ] Audio cue paired with each voice-mode error
- [ ] Settings hand-offs use deep-links, not navigation instructions
- [ ] Three-step watchdog reveal applied to every long-running state
- [ ] After-second-failure alternative path defined for every voice flow
- [ ] Transactional errors lead with reassurance
- [ ] Aunt test passed by someone outside the design team

---

*Next: apply this framework to specific error flows starting with P2 (connection loss mid-conversation) and P3 (mic permission failures). Track new error copy in a shared sheet against the §7 review questions.*
