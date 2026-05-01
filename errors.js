/**
 * Omni Error Language Framework — scenario copy bank.
 *
 * Source: Omni_Error_Language_Framework_v0.1.md §6 (worked examples).
 * All copy is verbatim from the framework; do not edit here unless the
 * framework doc changes first.
 *
 * Each scenario carries:
 *   surface    — 'voice' | 'chat' | 'both' (drives which surface the runtime renders)
 *   en / hi    — copy bank, keyed by slot (voiceSubtext, spoken, chatBanner, …)
 *   handler    — id used by index.html's renderErrorScenario() dispatcher
 */
(function (root) {
  'use strict';

  const ERROR_SCENARIOS = {
    'connection-initial': {                              // §6.1
      label: 'Connection lost — initial',
      ref: '6.1',
      surface: 'both',
      handler: 'connection-initial',
      en: {
        voiceSubtext: "Can't reach the network. Tap to try again.",
        chatBanner: 'No internet. Tap to reconnect.',
      },
      hi: {
        voiceSubtext: 'Network tak nahi pahuncha. Dobara try kar.',
        chatBanner: 'Internet nahi hai. Tap kar reconnect ke liye.',
      },
    },

    'connection-mid': {                                  // §6.2
      label: 'Connection lost — mid-conversation',
      ref: '6.2',
      surface: 'both',
      handler: 'connection-mid',
      en: {
        spoken: "Network just dropped. I'll keep your last question — tap when you're back online.",
        voiceSubtext: 'Offline. Tap when ready.',
        chatBanner: "You're offline. Your message is saved.",
      },
      hi: {
        spoken: 'Network gaya abhi. Sawal yaad rakha hai — wapas online ho to tap kar.',
        voiceSubtext: 'Offline. Tap when ready.',
        chatBanner: 'Tum offline ho. Message saved hai.',
      },
    },

    'mic-permission': {                                  // §6.3
      label: 'Mic unavailable — permission not granted',
      ref: '6.3',
      surface: 'voice',
      handler: 'mic-permission',
      en: {
        voiceSubtext: "I can't hear you. Tap to allow mic.",
        settingsHandoff: "Tap **Microphone** and turn it on. I'll be here.",
      },
      hi: {
        voiceSubtext: 'Sun nahi sakta. Mic on karne ke liye tap kar.',
        settingsHandoff: 'Microphone par tap kar aur on kar de. Main yahin hoon.',
      },
    },

    'mic-busy': {                                        // §6.4
      label: 'Mic unavailable — claimed by another app',
      ref: '6.4',
      surface: 'voice',
      handler: 'mic-busy',
      en: {
        voiceSubtext: 'Your mic is busy with another app. Close that one and tap to come back.',
      },
      hi: {
        voiceSubtext: 'Mic dusra app use kar raha hai. Use band kar aur wapas tap kar.',
      },
    },

    'watchdog': {                                        // §6.5
      label: 'Stuck state — watchdog reveal',
      ref: '6.5',
      surface: 'voice',
      handler: 'watchdog',
      en: {
        step1: 'This is taking a moment longer than usual…',
        step2: 'Still working on it. You can keep waiting or tap here to try a different way.',
        step3: "This isn't working today. Want to try again, or type your question instead?",
      },
      hi: {
        step1: 'Thoda time lag raha hai…',
        step2: 'Abhi bhi kaam chal raha hai. Ruko ya alag tareeke se try kar.',
        step3: 'Aaj nahi ho raha. Dobara try kar ya type kar de?',
      },
    },

    'voice-miss-1': {                                    // §6.6
      label: "Voice didn't land — first failure",
      ref: '6.6',
      surface: 'voice',
      handler: 'voice-miss-1',
      en: {
        spoken: "Didn't quite catch that — say it again?",
        voiceSubtext: "Didn't catch it.",
      },
      hi: {
        spoken: 'Sahi nahi suna — dobara bol?',
        voiceSubtext: 'Sahi nahi suna.',
      },
    },

    'voice-miss-2': {                                    // §6.7
      label: "Voice didn't land — second failure",
      ref: '6.7',
      surface: 'voice',
      handler: 'voice-miss-2',
      en: {
        spoken: "Still didn't catch it. Want to type it instead?",
        voiceSubtext: 'Type instead?',
      },
      hi: {
        spoken: 'Abhi bhi nahi suna. Type karna chahta hai?',
        voiceSubtext: 'Type karna chahta hai?',
      },
    },

    'no-results': {                                      // §6.8
      label: 'No results — empty answer',
      ref: '6.8',
      surface: 'chat',
      handler: 'no-results',
      en: {
        spoken: "Couldn't find anything for that. Try saying it differently, or give me a hint about where to look.",
      },
      hi: {
        spoken: 'Iska kuch nahi mila. Alag se bol ya thodi detail de — kahaan dhundhna hai.',
      },
    },

    'out-of-scope': {                                    // §6.9
      label: 'Out of scope — Omni can\'t do this',
      ref: '6.9',
      surface: 'chat',
      handler: 'out-of-scope',
      en: {
        spoken: "I can't do that one yet. I'm good with weather, news, restaurants, and writing things — what do you need?",
      },
      hi: {
        spoken: 'Yeh abhi nahi kar sakta. Weather, news, restaurants, ya likhne mein help de sakta hoon — kya chahiye?',
      },
    },

    'tts-down': {                                        // §6.10
      label: 'Output failure — TTS unavailable',
      ref: '6.10',
      surface: 'voice',
      handler: 'tts-down',
      en: {
        note: "Voice isn't working right now — I've written it out below.",
        bodyExample: "Here's the weather: 28°C, mostly clear, light breeze through the evening.",
      },
      hi: {
        note: 'Awaaz abhi nahi chal rahi — neeche likh diya hai.',
        bodyExample: 'Mausam: 28°C, saaf, halki hawa shaam tak.',
      },
    },

    'transactional': {                                   // §6.11
      label: 'High-stakes — transactional failure',
      ref: '6.11',
      surface: 'chat',
      handler: 'transactional',
      en: {
        body: 'Payment didn\'t go through. Your money is safe — nothing was charged. Tap to try again.',
      },
      hi: {
        body: 'Payment nahi hua. Paisa safe hai — kuch deduct nahi hua. Dobara try kar.',
      },
    },

    // ============================================================
    // P2 — Mid-Conversation Connection Loss Spec v0.1
    // Source: Omni_Mid_Conversation_Connection_Loss_Spec_v0.1.md
    // Copy taken verbatim from §3, §4, §6 of the spec.
    // Tier is encoded in the key: <sub-case>.<tier>.
    // The blip tier is intentionally absent — by design it has no UI;
    // the `mid-loss.about-blip` meta-entry explains this to reviewers.
    // ============================================================

    // §3.1 — Drop while user is speaking
    'mid-loss.speaking.dip': {
      label: 'Dip (2–15s)',
      ref: '3.1.dip',
      surface: 'voice',
      handler: 'mid-loss.speaking.dip',
      en: { voiceSubtext: 'Reconnecting…' },
      hi: { voiceSubtext: 'Connect kar raha hoon…' },
    },
    'mid-loss.speaking.sustained': {
      label: 'Sustained (15–30s)',
      ref: '3.1.sustained',
      surface: 'voice',
      handler: 'mid-loss.speaking.sustained',
      en: {
        spoken: "Network's not reaching us. Tap to try again, or switch to chat.",
        voiceSubtext: 'Offline. Tap to retry.',
        retryLabel: 'Try again',
        switchLabel: 'Switch to chat',
      },
      hi: {
        spoken: 'Network nahi mil raha. Dobara try kar, ya chat pe likh.',
        voiceSubtext: 'Offline. Tap kar.',
        retryLabel: 'Dobara try',
        switchLabel: 'Chat pe likh',
      },
    },
    'mid-loss.speaking.permanent': {
      label: 'Permanent (>30s)',
      ref: '3.1.permanent',
      surface: 'voice',
      handler: 'mid-loss.speaking.permanent',
      en: {
        spoken: "Voice can't reach us right now. What you said is saved. Switch to chat to keep going.",
        voiceSubtext: 'Voice unavailable.',
        switchLabel: 'Switch to chat',
      },
      hi: {
        spoken: 'Voice abhi nahi mil raha. Jo bola woh saved hai. Chat pe baat aage badha.',
        voiceSubtext: 'Voice abhi nahi.',
        switchLabel: 'Chat pe likh',
      },
    },

    // §3.2 — Drop while Omni is processing
    'mid-loss.processing.dip': {
      label: 'Dip (2–15s)',
      ref: '3.2.dip',
      surface: 'chat',
      handler: 'mid-loss.processing.dip',
      en: {
        userTurn: 'How long is the train from Andheri to Bandra?',
        thinkingLine: 'Thinking…',
      },
      hi: {
        userTurn: 'Andheri se Bandra train mein kitna time?',
        thinkingLine: 'Soch raha hoon…',
      },
    },
    'mid-loss.processing.sustained': {
      label: 'Sustained (15–30s)',
      ref: '3.2.sustained',
      surface: 'chat',
      handler: 'mid-loss.processing.sustained',
      en: {
        userTurn: 'How long is the train from Andheri to Bandra?',
        body: 'Still waiting on this one. Tap to try again, or cancel.',
        primaryLabel: 'Try again',
        secondaryLabel: 'Cancel',
      },
      hi: {
        userTurn: 'Andheri se Bandra train mein kitna time?',
        body: 'Iska reply abhi nahi aaya. Dobara try kar ya cancel kar.',
        primaryLabel: 'Dobara try',
        secondaryLabel: 'Cancel',
      },
    },
    'mid-loss.processing.permanent': {
      label: 'Permanent (>30s)',
      ref: '3.2.permanent',
      surface: 'chat',
      handler: 'mid-loss.processing.permanent',
      en: {
        userTurn: 'How long is the train from Andheri to Bandra?',
        body: "Couldn't get a response this time. Your question's still here — tap to ask again.",
        primaryLabel: 'Ask again',
      },
      hi: {
        userTurn: 'Andheri se Bandra train mein kitna time?',
        body: 'Iska jawab nahi aaya. Tera sawal yahin hai — tap karke dobara puch.',
        primaryLabel: 'Dobara puch',
      },
    },

    // §3.3 — Drop during a tool / skill call
    'mid-loss.tool.dip': {
      label: 'Dip (2–15s)',
      ref: '3.3.dip',
      surface: 'chat',
      handler: 'mid-loss.tool.dip',
      en: {
        userTurn: 'Find me a flight from Mumbai to Delhi tomorrow morning.',
        thinkingLine: 'Looking up flights…',
      },
      hi: {
        userTurn: 'Mumbai se Delhi kal subah ki flight dhundh.',
        thinkingLine: 'Flights dhundh raha hoon…',
      },
    },
    'mid-loss.tool.sustained': {
      label: 'Sustained (>15s, non-txn)',
      ref: '3.3.sustained',
      surface: 'chat',
      handler: 'mid-loss.tool.sustained',
      en: {
        userTurn: 'Find me a flight from Mumbai to Delhi tomorrow morning.',
        body: 'Looking up flights is taking longer than usual. Want to keep waiting, or cancel?',
        primaryLabel: 'Keep waiting',
        secondaryLabel: 'Cancel',
        caption: 'On reconnect, the client queries tool state before showing retry — never blind-retry a tool call.',
      },
      hi: {
        userTurn: 'Mumbai se Delhi kal subah ki flight dhundh.',
        body: 'Flights dhundhne mein time lag raha hai. Ruk ya cancel kar?',
        primaryLabel: 'Ruk',
        secondaryLabel: 'Cancel',
        caption: 'Reconnect pe client pehle tool ka state check karta hai — blind retry kabhi nahi.',
      },
    },
    'mid-loss.tool.permanent': {
      label: 'Permanent (>30s)',
      ref: '3.3.permanent',
      surface: 'chat',
      handler: 'mid-loss.tool.permanent',
      en: {
        userTurn: 'Find me a flight from Mumbai to Delhi tomorrow morning.',
        body: "Couldn't finish the search. Your question's saved — try again in a moment.",
        primaryLabel: 'Try again',
      },
      hi: {
        userTurn: 'Mumbai se Delhi kal subah ki flight dhundh.',
        body: 'Search puri nahi ho payi. Tera sawal saved hai — thoda ruk ke phir try kar.',
        primaryLabel: 'Dobara try',
      },
    },

    // §3.4 — Drop while Omni is speaking
    'mid-loss.speakingback.dip': {
      label: 'Dip (2–15s)',
      ref: '3.4.dip',
      surface: 'chat',
      handler: 'mid-loss.speakingback.dip',
      en: {
        userTurn: "What's the weather in Pune today?",
        partialResponse: "It's 28°C in Pune right now, mostly clear with a light breeze. Through the afternoon you can expect",
      },
      hi: {
        userTurn: 'Pune mein aaj mausam kaisa hai?',
        partialResponse: 'Pune mein abhi 28°C hai, mostly saaf, halki hawa. Dopahar tak',
      },
    },
    'mid-loss.speakingback.sustained': {
      label: 'Sustained (15–30s)',
      ref: '3.4.sustained',
      surface: 'chat',
      handler: 'mid-loss.speakingback.sustained',
      en: {
        userTurn: "What's the weather in Pune today?",
        partialResponse: "It's 28°C in Pune right now, mostly clear with a light breeze. Through the afternoon you can expect",
        truncationCard: 'That answer got cut off. Tap to hear what came through, or ask me again.',
        replayLabel: 'Replay',
        askAgainLabel: 'Ask again',
      },
      hi: {
        userTurn: 'Pune mein aaj mausam kaisa hai?',
        partialResponse: 'Pune mein abhi 28°C hai, mostly saaf, halki hawa. Dopahar tak',
        truncationCard: 'Jawab beech mein cut ho gaya. Jo aaya woh sun, ya dobara puch.',
        replayLabel: 'Sun',
        askAgainLabel: 'Dobara puch',
      },
    },
    'mid-loss.speakingback.permanent': {
      label: 'Permanent (>30s)',
      ref: '3.4.permanent',
      surface: 'chat',
      handler: 'mid-loss.speakingback.permanent',
      en: {
        userTurn: "What's the weather in Pune today?",
        partialResponse: "It's 28°C in Pune right now, mostly clear with a light breeze. Through the afternoon you can expect",
        askAgainLabel: 'Ask again',
      },
      hi: {
        userTurn: 'Pune mein aaj mausam kaisa hai?',
        partialResponse: 'Pune mein abhi 28°C hai, mostly saaf, halki hawa. Dopahar tak',
        askAgainLabel: 'Dobara puch',
      },
    },

    // §3.5 — Drop while user is typing in chat (not yet sent)
    'mid-loss.typing.dip': {
      label: 'Dip (2–15s)',
      ref: '3.5.dip',
      surface: 'chat',
      handler: 'mid-loss.typing.dip',
      en: {
        draft: 'Book me a table at Bombay Canteen for two at 8',
        inlineNote: "Network just dipped. Keep typing — we'll send when you're back.",
      },
      hi: {
        draft: 'Bombay Canteen mein 8 baje do logon ke liye table book kar',
        inlineNote: 'Network thoda gaya. Likhta reh — wapas aate hi bhej denge.',
      },
    },
    'mid-loss.typing.sustained': {
      label: 'Sustained / Permanent',
      ref: '3.5.sustained',
      surface: 'chat',
      handler: 'mid-loss.typing.sustained',
      en: {
        draft: 'Book me a table at Bombay Canteen for two at 8',
        bannerNote: "You're offline. Your message is saved — send when you're back online.",
      },
      hi: {
        draft: 'Bombay Canteen mein 8 baje do logon ke liye table book kar',
        bannerNote: 'Tum offline ho. Message saved hai — wapas online ho ke bhej.',
      },
    },

    // §3.8 — Drop while rich content is loading
    'mid-loss.richcontent.sustained': {
      label: 'Sustained / Permanent',
      ref: '3.8.sustained',
      surface: 'chat',
      handler: 'mid-loss.richcontent.sustained',
      en: {
        userTurn: 'Show me restaurants near me with outdoor seating.',
        voiceSummary: 'Found six places near you with outdoor seating — Olive, Bastian, The Bar Stock Exchange, and three more.',
        body: "Couldn't load the cards this time. Tap to try, or ask in a different way.",
        retryLabel: 'Try again',
        askDifferentLabel: 'Ask differently',
      },
      hi: {
        userTurn: 'Mere paas outdoor seating wale restaurants dikha.',
        voiceSummary: 'Tere paas chhe jagah mil gayi outdoor seating ke saath — Olive, Bastian, The Bar Stock Exchange, aur teen aur.',
        body: 'Cards load nahi hue. Tap kar ke phir try kar, ya alag se puch.',
        retryLabel: 'Dobara try',
        askDifferentLabel: 'Alag se puch',
      },
    },

    // §6 — Transactional flow
    'mid-loss.txn.dip': {
      label: 'Dip (extended to 30s)',
      ref: '6.dip',
      surface: 'chat',
      handler: 'mid-loss.txn.dip',
      en: {
        userTurn: 'Pay ₹499 for the recharge.',
        amount: '₹499',
        purpose: 'Jio recharge',
        refCode: 'JBQ-7K3M-209A',
        body: "Your payment is in our system. We're confirming it — give it a moment, or check your account in a few minutes.",
        statusChip: 'Confirming',
      },
      hi: {
        userTurn: '₹499 ka recharge kar de.',
        amount: '₹499',
        purpose: 'Jio recharge',
        refCode: 'JBQ-7K3M-209A',
        body: 'Tera payment system mein hai. Confirm kar raha hoon — thoda ruk, ya account check kar do minute mein.',
        statusChip: 'Confirm ho raha',
      },
    },
    'mid-loss.txn.sustained': {
      label: 'Sustained (extended to 60s)',
      ref: '6.sustained',
      surface: 'chat',
      handler: 'mid-loss.txn.sustained',
      en: {
        userTurn: 'Pay ₹499 for the recharge.',
        amount: '₹499',
        purpose: 'Jio recharge',
        refCode: 'JBQ-7K3M-209A',
        body: "Still confirming your payment. Nothing extra has been charged. Hold on — or check your account in a couple of minutes.",
        statusChip: 'Still confirming',
      },
      hi: {
        userTurn: '₹499 ka recharge kar de.',
        amount: '₹499',
        purpose: 'Jio recharge',
        refCode: 'JBQ-7K3M-209A',
        body: 'Abhi bhi confirm kar raha hoon. Kuch extra nahi cut hua. Ruk — ya do minute mein account check kar.',
        statusChip: 'Abhi confirm kar raha',
      },
    },
    'mid-loss.txn.permanent': {
      label: 'Permanent (state unknown)',
      ref: '6.permanent',
      surface: 'chat',
      handler: 'mid-loss.txn.permanent',
      en: {
        userTurn: 'Pay ₹499 for the recharge.',
        amount: '₹499',
        purpose: 'Jio recharge',
        refCode: 'JBQ-7K3M-209A',
        body: "Couldn't confirm right now. We've sent the reference to your phone — check your bank in a few minutes, or tap below to retry.",
        statusChip: 'Sent to your phone',
        retryLabel: 'Retry payment',
      },
      hi: {
        userTurn: '₹499 ka recharge kar de.',
        amount: '₹499',
        purpose: 'Jio recharge',
        refCode: 'JBQ-7K3M-209A',
        body: 'Abhi confirm nahi hua. Reference tere phone pe bhej diya — kuch minute mein bank check kar, ya neeche tap kar dobara try ke liye.',
        statusChip: 'Phone pe bhej diya',
        retryLabel: 'Dobara try',
      },
    },
    'mid-loss.txn.confirmed-on-reconnect': {
      label: 'Confirmed on reconnect (auto-poll)',
      ref: '6.confirmed',
      surface: 'chat',
      handler: 'mid-loss.txn.confirmed-on-reconnect',
      en: {
        userTurn: 'Pay ₹499 for the recharge.',
        amount: '₹499',
        purpose: 'Jio recharge',
        refCode: 'JBQ-7K3M-209A',
        body: "Payment went through. Your recharge is active.",
        statusChip: 'Confirmed',
      },
      hi: {
        userTurn: '₹499 ka recharge kar de.',
        amount: '₹499',
        purpose: 'Jio recharge',
        refCode: 'JBQ-7K3M-209A',
        body: 'Payment ho gaya. Recharge active hai.',
        statusChip: 'Confirmed',
      },
    },

    // §4 — Reconnect & resume affordances
    'mid-loss.reconnect.toast': {
      label: '"Back online" toast',
      ref: '4.8',
      surface: 'voice',
      handler: 'mid-loss.reconnect.toast',
      en: { toast: 'Back online.' },
      hi: { toast: 'Wapas online.' },
    },
    'mid-loss.reconnect.divider': {
      label: 'Thread gap divider',
      ref: '4.7',
      surface: 'chat',
      handler: 'mid-loss.reconnect.divider',
      en: {
        userTurn: 'Find me a chai place open now near Bandra.',
        assistantBefore: 'Found a couple — Koinonia is open till 11 and Suzette till 10:30.',
        divider: 'Reconnected',
        assistantAfter: 'Picking up — want directions to Koinonia, or shall I look further out?',
      },
      hi: {
        userTurn: 'Bandra ke paas abhi khula chai ka jagah dhundh.',
        assistantBefore: 'Do mil gaye — Koinonia 11 baje tak khula hai aur Suzette 10:30 tak.',
        divider: 'Wapas aaye',
        assistantAfter: 'Aage badhte hain — Koinonia ka rasta chahiye, ya thoda door dhundhu?',
      },
    },
    'mid-loss.reconnect.voicebuffer': {
      label: 'Voice buffer overflow (>10s)',
      ref: '4.2',
      surface: 'voice',
      handler: 'mid-loss.reconnect.voicebuffer',
      en: {
        voiceSubtext: "Didn't catch all of that — say it again?",
        spoken: "Didn't catch all of that — say it again?",
      },
      hi: {
        voiceSubtext: 'Sahi se nahi suna — phir bol?',
        spoken: 'Sahi se nahi suna — phir bol?',
      },
    },

    // Decision 1 — Pre-flight network steer
    'mid-loss.preflight.steer': {
      label: 'Network steer on home',
      ref: 'D1',
      surface: 'voice',
      handler: 'mid-loss.preflight.steer',
      en: {
        steerNote: "Network's slow — voice will struggle. Tap to type instead.",
        primaryLabel: 'Type instead',
        overrideLabel: 'Speak anyway',
      },
      hi: {
        steerNote: 'Network slow hai — voice mushkil hogi. Type kar de.',
        primaryLabel: 'Type kar',
        overrideLabel: 'Phir bhi bol',
      },
    },

    // Pinned info entry — explains why blip has no UI
    'mid-loss.about-blip': {
      label: 'About blip recovery (<2s)',
      ref: 'P2.info',
      surface: 'voice',
      handler: 'mid-loss.about-blip',
      en: {
        caption: 'Blip recovery (<2s) is silent by design. No UI changes during a blip — the user shouldn\'t even notice the network blinked.',
      },
      hi: {
        caption: 'Blip (<2s) chup-chap recover hota hai. Koi UI change nahi — user ko pata bhi nahi chalna chahiye.',
      },
    },
  };

  const ERROR_SCENARIO_GROUPS = [
    { group: 'Connection',  items: ['connection-initial', 'connection-mid'] },
    { group: 'Microphone',  items: ['mic-permission', 'mic-busy'] },
    { group: 'Watchdog',    items: ['watchdog'] },
    { group: 'Voice input', items: ['voice-miss-1', 'voice-miss-2'] },
    { group: 'Response',    items: ['no-results', 'out-of-scope', 'tts-down'] },
    { group: 'Transaction', items: ['transactional'] },

    // P2 — Mid-Conversation Connection Loss Spec v0.1
    { group: 'P2 · Drop while user is speaking (§3.1)',
      items: ['mid-loss.speaking.dip', 'mid-loss.speaking.sustained', 'mid-loss.speaking.permanent'] },
    { group: 'P2 · Drop while Omni is processing (§3.2)',
      items: ['mid-loss.processing.dip', 'mid-loss.processing.sustained', 'mid-loss.processing.permanent'] },
    { group: 'P2 · Drop during tool / skill call (§3.3)',
      items: ['mid-loss.tool.dip', 'mid-loss.tool.sustained', 'mid-loss.tool.permanent'] },
    { group: 'P2 · Drop while Omni is speaking (§3.4)',
      items: ['mid-loss.speakingback.dip', 'mid-loss.speakingback.sustained', 'mid-loss.speakingback.permanent'] },
    { group: 'P2 · Drop while typing in chat (§3.5)',
      items: ['mid-loss.typing.dip', 'mid-loss.typing.sustained'] },
    { group: 'P2 · Drop while rich content loading (§3.8)',
      items: ['mid-loss.richcontent.sustained'] },
    { group: 'P2 · Transactional flow (§6)',
      items: ['mid-loss.txn.dip', 'mid-loss.txn.sustained', 'mid-loss.txn.permanent', 'mid-loss.txn.confirmed-on-reconnect'] },
    { group: 'P2 · Reconnect & resume (§4)',
      items: ['mid-loss.reconnect.toast', 'mid-loss.reconnect.divider', 'mid-loss.reconnect.voicebuffer'] },
    { group: 'P2 · Pre-flight (Decision 1)',
      items: ['mid-loss.preflight.steer'] },
    { group: 'P2 · About',
      items: ['mid-loss.about-blip'] },
  ];

  root.ERROR_SCENARIOS = ERROR_SCENARIOS;
  root.ERROR_SCENARIO_GROUPS = ERROR_SCENARIO_GROUPS;
})(typeof window !== 'undefined' ? window : globalThis);
