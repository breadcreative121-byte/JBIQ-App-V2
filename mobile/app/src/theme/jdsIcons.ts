/* JDS icon glyphs — inlined from the design system's local SVGs
   (repo `assets/icons/svg/`). The JDS icon CDN (per the jds MCP) is currently
   unreachable, so we bundle the subset that exists locally. Each glyph is a
   24×24 stroke icon whose colour token `#1A1A1A` is swapped for the render
   colour by JdsIcon. Only the icons we actually use are included; extend from
   `assets/icons/svg/` as more are needed. */

export const JDS_ICONS = {
  ic_pay_bill:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5h12v19l-2.5-1.6-2.5 1.6-1-0.9-1 0.9-2.5-1.6L6 21.5Z"/><path d="M9 7.5h6M9 11h6M9 14.5h3"/></svg>',
  ic_health_conditions:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.3 5.7a5 5 0 0 0-7.1 0l-1.2 1.2-1.2-1.2a5 5 0 0 0-7.1 7.1l1.2 1.2 7.1 7.1 7.1-7.1 1.2-1.2a5 5 0 0 0 0-7.1Z"/><path d="M3.5 12.5h4l1.5-3 2.5 6 1.5-3h4"/></svg>',
  ic_favorite:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5 4.2 12.9a4.6 4.6 0 0 1 0-6.6 4.6 4.6 0 0 1 6.5 0l1.3 1.3 1.3-1.3a4.6 4.6 0 0 1 6.5 0 4.6 4.6 0 0 1 0 6.6Z"/></svg>',
  ic_language:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z"/></svg>',
  ic_widgets:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/></svg>',
  ic_document:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5h7l5 5V21a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 21V4A1.5 1.5 0 0 1 6 2.5Z"/><path d="M13 2.5V8h5"/><path d="M8 13h8M8 17h5"/></svg>',
  ic_brain:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5a3 3 0 0 0-5.7-1.3A2.8 2.8 0 0 0 3.5 6a2.8 2.8 0 0 0-.8 4.4A3 3 0 0 0 4 15.5a2.8 2.8 0 0 0 2.4 3.9A2.8 2.8 0 0 0 12 19Z"/><path d="M12 4.5a3 3 0 0 1 5.7-1.3A2.8 2.8 0 0 1 20.5 6a2.8 2.8 0 0 1 .8 4.4A3 3 0 0 1 20 15.5a2.8 2.8 0 0 1-2.4 3.9A2.8 2.8 0 0 1 12 19Z"/></svg>',
  ic_new_chat:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 12.5a8 8 0 0 1-11.4 7.2L3.5 21l1.3-5.1A8 8 0 1 1 20.5 12.5Z"/><path d="M12 8.5v6M9 11.5h6"/></svg>',
  ic_call_video:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10 6-3.2v10.4l-6-3.2Z"/></svg>',
  ic_chevron_left:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
} as const;

export type JdsName = keyof typeof JDS_ICONS;
