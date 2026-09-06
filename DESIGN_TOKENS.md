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
| success / success-surface | #15803D / #F0FDF4 | Successful business status |
| warning / warning-surface | #B45309 / #FFFBEB | Pending/warning feedback |
| danger / danger-surface | #B91C1C / #FEF2F2 | Blocked/destructive feedback |
| info / info-surface | #1D4ED8 / #EFF6FF | Information/in-progress status |

Additional primary shades in the source support the existing range of utilities: 950 #042F2E, 900 #134E4A, 800 #115E59, 500 #14B8A6, 400 #2DD4BF, 300 #5EEAD4, 200 #99F6E4. Base control-border fallback is #94A3B8. Existing explicit error/focus utilities retain precedence.

Primary buttons use primary-700 for readable white text; do not use primary-500 as a small white-text action. Shared integration/prototype badges have dashed borders and retain separate text/code. No lifecycle status values were changed.

## Typography

Local Vazirmatn Arabic and Latin WOFF2 files remain at `/fonts/`. Document language/direction remain Persian/RTL. Individual technical values may use `bdi dir="ltr"`.

| Role | Desktop | Mobile/tablet below 1024px |
|---|---|---|
| Body | 14px | 16px |
| Existing text-xs operational text | 13px | 16px |
| text-sm / standard controls | 14px | 16px |
| Field label token | 14px | 14px |
| Caption/helper/badge | 12px | 12px |
| App header page title | 24px | 20px |
| Main section heading h2 | 20px | 20px |
| Main subsection h3 | 18px | 18px |
| Dialog title | 18px | 18px |
| Desktop table | 13px minimum inherited scale | Card presentation |

Body/standard utility line height 1.6; captions/descriptions 1.7; native desktop table fallback 1.45. SVG field-route labels now use 14px and a scrollable 650px diagram so phone-width shrinking cannot make them microscopic. No arbitrary 8/9/10/11px text classes remain. Computed text size at zoom still needs browser verification.

## Dimensions, spacing and surfaces

- Base spacing unit: 4px. Preferred steps 4, 8, 12, 16, 20, 24, 32, 40, 48px.
- Common 6/10/14px gap/padding utilities migrated to 8/12/16px. Some legacy small adornment offsets remain; these are not business logic.
- Small controls: 6px radius; standard inputs/buttons: 8px; cards: 12px; dialogs: 16px; full radius for badges/avatars/pills.
- Desktop standard control: 44px; compact button: 40px; icon target: 40px.
- Mobile input/button: 48px; general icon target: 44px; bottom-nav item: 48px minimum; bar: 64px plus bottom safe area.
- Table row token: 48px; cell padding/content can increase row height.
- Main content maximum: 1280px. Modal/form widths remain bounded by the existing sm/md/lg/xl/2xl/full choices.
- Sidebar expanded: 288px; collapsed: 72px. It is removed from layout below 1024px; the mobile drawer uses the full width available up to 384px.
- Standard floating shadow: `0 12px 32px rgb(15 23 42 / 14%)`; panel/card shadows removed in the general migration. Floating menus, dialogs and banners retain elevation. Some legacy floating-menu utilities remain.
- Overlay: `rgb(15 23 42 / 60%)`.
- z-index intent: header 20, sidebar 30, navigation 40, overlays 50; native dialogs use the browser top layer.
- Safe areas use `env(safe-area-inset-*)`; dialogs use `100dvh`, bounded bodies and reachable headers/footers.

## Breakpoints and interaction

Existing Tailwind breakpoints remain: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px. The application shell and adaptive table/card system use **1024px** as the desktop boundary; existing content grids may use sm/md. Narrow dialog form grids collapse below 640px.

Shared buttons define hover, active, disabled, busy and focus states. Busy buttons retain their text. Native dialogs provide focus containment/inert background; the shared modal stack guards browser Back while a form is open. Escape and explicit close still cancel. Reduced-motion rules remain; decorative shimmer, status pulsing and zoom entrances were removed. Real-device keyboard, focus and zoom behavior remain unverified due to blocked browser access.
