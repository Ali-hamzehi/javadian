# Javadian design tokens

Canonical implementation: `src/index.css`, with Tailwind 4 `@theme` tokens and shared component classes. This is a controlled evolution of the navy/light prototype. The supplied PWA emblem and icon assets are preserved; they are not a new corporate identity.

## Palette

| Token | Value | Use |
|---|---|---|
| brand-950 | #0F172A | Navy foundation |
| brand-900 | #172033 | Alternate dark foundation |
| primary-700 | #0F766E | Primary actions; white text |
| primary-600 | #0D9488 | Supporting teal, not white small-text buttons |
| primary-100 | #CCFBF1 | Selected/action surface |
| primary-50 | #F0FDFA | Quiet action surface |
| canvas | #F8FAFC | Page background |
| surface | #FFFFFF | Panels |
| surface-muted | #F1F5F9 | Secondary surface |
| border | #E2E8F0 | Panel separators |
| border-strong | #CBD5E1 | Strong separators |
| text | #0F172A | Primary content |
| text-secondary | #475569 | Secondary content |
| text-muted | #64748B | Non-critical text on suitable light surfaces |
| text-inverse | #FFFFFF | Dark surfaces |
| success / success-surface | #0F766E / #F0FDFA | Successful business status (Teal) |
| warning / warning-surface | #B45309 / #FFFBEB | Pending/warning feedback (Amber) |
| danger / danger-surface | #B91C1C / #FEF2F2 | Blocked/destructive feedback (Red/Rose) |
| info / info-surface | #1D4ED8 / #EFF6FF | Information/in-progress status (Blue) |

Additional primary shades in the source support the existing range of utilities: 950 #042F2E, 900 #134E4A, 800 #115E59, 500 #14B8A6, 400 #2DD4BF, 300 #5EEAD4, 200 #99F6E4. Base control-border fallback is #CBD5E1. Existing explicit error/focus utilities retain precedence.

Primary buttons use primary-700 for readable white text; do not use primary-500 as a small white-text action. Shared integration/prototype badges have dashed borders and retain separate text/code. No lifecycle status values were changed.

## Typography

Local Vazirmatn Arabic and Latin WOFF2 files remain at `/fonts/`. Document language/direction remain Persian/RTL. Individual technical values may use `bdi dir="ltr"`.

| Role | Desktop | Mobile/tablet below 1024px |
|---|---|---|
| Body | 15px | 15–16px (0.96875rem) |
| Operational critical text | 15–16px | 15–16px |
| Button & Input controls | 14–15px (inputs: 15px) | Buttons: 15px, Inputs/Selects: 16px (no iOS auto-zoom) |
| Field label token | 14px | 14px |
| Caption / Metadata / Badge | 13px (0.8125rem min) | 13–14px |
| Page title (h1 / .page-title) | 24–26px (1.5625rem) | 21–22px (1.34375rem) |
| Section heading (h2 / .section-title) | 19–20px (1.25rem) | 18–19px (1.15625rem) |
| Card title (h3 / .card-title) | 16–18px (1.0625rem) | 16–17px (1.0625rem) |
| Dialog title | 18px | 18px |
| Desktop table | 14px (0.875rem) | Card presentation (12px card gap) |

Persian text line height: 1.6 minimum across body and controls. In the mobile breakpoint, `text-xs` and `text-sm` are NOT globally overridden to 16px; typography strictly adheres to text roles (metadata remains 13–14px, inputs 16px, buttons 15px). No arbitrary 8/9/10/11/12px text classes remain in primary operational content.

## Dimensions, spacing and surfaces

- Base spacing unit: 4px. Preferred steps 4, 8, 12, 16, 20, 24, 32, 40, 48px.
- Desktop page padding: 24px (1.5rem); Mobile page padding: 16px (1rem).
- Mobile card gap: 12px (space-y-3 / gap-3); Section spacing: 24–32px (space-y-6 to space-y-8).
- Small controls: 6px radius; standard inputs/buttons: 8px (radius-lg); cards: 12px (radius-xl); dialogs: 16px (radius-2xl); full radius for badges/avatars/pills.
- Desktop standard control: 44px (2.75rem); compact button: 40px; icon target: 40px.
- Mobile input/button: 48px (3rem); minimum mobile touch target: 44×44px (2.75rem); bottom-nav bar: 64px plus bottom safe area.
- Table row token: 48px; cell padding/content can increase row height.
- Main content maximum: 1280px (80rem). Modal/form widths remain bounded by sm/md/lg/xl/2xl/full choices.
- Sidebar expanded: 260px (16.25rem); collapsed: 72px (4.5rem). Reduced from 288px to avoid cramped main content on 1366px screens.
- Standard floating shadow: `0 8px 24px -4px rgb(15 23 42 / 12%)`; panel/card shadows restrained and soft.
- Overlay: `rgb(15 23 42 / 60%)`.
- z-index intent: header 20, sidebar 30, navigation 40, overlays 50; native dialogs use the browser top layer.
- Safe areas use `env(safe-area-inset-*)`; dialogs use `100dvh`, bounded bodies and reachable headers/footers.

## Breakpoints and interaction

Existing Tailwind breakpoints remain: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px. The application shell and adaptive table/card system use **1024px** as the desktop boundary; existing content grids may use sm/md. Narrow dialog form grids collapse below 640px.

Shared buttons define hover, active, disabled, busy and focus states. Busy buttons retain their text. Native dialogs provide focus containment/inert background; the shared modal stack guards browser Back while a form is open. Escape and explicit close still cancel. Reduced-motion rules remain; decorative shimmer, status pulsing and zoom entrances were removed. Real-device keyboard, focus and zoom behavior remain unverified due to blocked browser access.
