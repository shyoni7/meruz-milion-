# המירוץ ל־70 — Design Philosophy

## Three Stylistic Approaches

### 1. Cinematic Broadcast (Probability: 0.07)
Dark Navy base with Metallic Gold accents, glassmorphism cards, and cinematic typography. Inspired by The Amazing Race, Netflix Documentary, and Apple product launches. Feels like a live TV broadcast.

### 2. Luxury Print (Probability: 0.02)
Deep charcoal with cream and copper tones, editorial serif typography, and fine-line ornamental details. Feels like a premium anniversary magazine spread.

### 3. Architectural Minimalism (Probability: 0.01)
Pure black with single-weight white type and precise geometric gold lines. Inspired by high-end architectural portfolios. Feels cold, precise, and monumental.

---

## ✅ Chosen Approach: Cinematic Broadcast

### Design Movement
Premium TV Broadcast / Cinematic Documentary — the visual language of high-production reality TV meets luxury brand identity.

### Core Principles
1. **One screen, one moment** — every screen commands full attention, no competing elements
2. **Gold as a signal** — gold is used exclusively for interactive elements and key information, never decorative noise
3. **Depth through glass** — glassmorphism cards float above dark navy backgrounds, creating cinematic depth
4. **Motion tells the story** — every transition feels like a TV cut, not a web page load

### Color Philosophy
The dark navy (`#0a0f1e`) is the "studio darkness" — it makes gold pop and creates a premium, focused atmosphere. Gold (`#c9a84c`) is reserved for CTAs, highlights, and success states. White typography at varying opacities creates hierarchy without introducing new colors.

| Token | Value | Usage |
|---|---|---|
| `--navy` | `#0a0f1e` | Primary background |
| `--navy-mid` | `#111827` | Card backgrounds |
| `--navy-light` | `#1e2a3a` | Elevated surfaces |
| `--gold` | `#c9a84c` | Primary accent, CTAs |
| `--gold-light` | `#f0d080` | Highlights, hover states |
| `--gold-dim` | `rgba(201,168,76,0.15)` | Subtle gold tints |
| `--glass-bg` | `rgba(255,255,255,0.04)` | Glass card fill |
| `--glass-border` | `rgba(201,168,76,0.2)` | Glass card border |

### Layout Paradigm
Full-viewport single screens. Each screen takes 100dvh. Content is vertically centered with generous padding. No scrolling within a screen — everything fits. The layout is portrait-first (mobile), with a max-width of 480px on desktop to maintain the "phone app" feel.

### Signature Elements
1. **Gold rule lines** — thin 1px gold horizontal lines used as section dividers and decorative accents
2. **Glass cards** — `backdrop-blur(16px)` cards with subtle gold borders that float above the navy background
3. **Station number badge** — a circular gold badge showing the current station number, present on every screen

### Interaction Philosophy
Buttons respond instantly with a scale-down on press. Screens transition with a directional slide + fade (always forward, never back). Hints reveal with a staggered fade-in. Success states trigger confetti + a gold pulse animation.

### Animation
- Screen transitions: `x: 40px → 0, opacity: 0 → 1`, duration 280ms, ease-out
- Button press: `scale: 0.97`, 160ms ease-out
- Hint reveal: `opacity: 0 → 1, y: 8px → 0`, staggered 120ms per hint
- Confetti: canvas-confetti with gold/white particles, 3 second burst
- Gold pulse on success: `box-shadow` keyframe animation, 2 cycles
- All animations respect `prefers-reduced-motion`

### Typography System
- **Display / Titles**: Playfair Display (serif) — weight 700, used for station names and major headings
- **Body / Instructions**: Heebo (Hebrew-optimized sans-serif) — weight 400/600, used for all body text
- **Numbers / Badges**: Playfair Display Italic — for station numbers and countdown elements
- **Hierarchy**: 2.5rem title → 1.125rem subtitle → 1rem body → 0.875rem caption

### Brand Essence
**"המירוץ ל־70"** — חוויית טלוויזיה פרטית לאיש אחד מיוחד. יוקרתי, קולנועי, אישי.
Personality adjectives: **Cinematic · Intimate · Celebratory**

### Brand Voice
Direct, warm, and dramatic. Headlines feel like TV announcer copy.
- Example headline: "תחנה 3 — הטכניון"
- Example CTA: "המשך למשימה"
- Banned phrases: "ברוכים הבאים", "לחץ כאן", "התחל"

### Wordmark & Logo
A bold "70" numeral in Playfair Display Italic, enclosed in a thin gold circle. The circle is slightly broken at the top — suggesting motion and progress. Used as favicon and header mark.

### Signature Brand Color
Metallic Gold `#c9a84c` — unmistakably this brand's.

---

## Style Decisions
- All screens are full-viewport (100dvh), portrait-first, max-width 480px centered on desktop
- RTL layout throughout (Hebrew)
- No navigation bars, no menus, no back buttons
- Dark theme only — no light mode
- Confetti colors: gold (#c9a84c), white (#ffffff), light gold (#f0d080)
