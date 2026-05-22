# Little Bit of Luxe — Brand & Design System

> A travel journal for the kind of places worth going slowly.

Single source of truth for the **Little Bit of Luxe** visual identity. Hand this file to any AI system (or designer/developer) so the output matches the brand — colors, fonts, components, voice.

All tokens below are verbatim from `colors_and_type-2.css`. When in doubt, that file wins.

---

## 1. Brand essence

| | |
| --- | --- |
| **Name** | Little Bit of Luxe |
| **Category** | Editorial luxury travel blog — hotel reviews, dispatches, curated edits, guides |
| **Tagline** | *A travel journal for the kind of places worth going slowly.* |
| **Promise** | Considered, slow, quiet luxury. Trusted recommendations, never breathless promotion. |
| **Visual identity in one line** | High-contrast serif display + clean geometric sans for body. Deep navy on warm cream. |
| **Tone** | Editorial, restrained, warm. Closer to *Cereal* or *Condé Nast Traveler* long-form than to a deals blog. |
| **Voice cues** | Em-dashes, balanced sentences, italic emphasis on one chosen word. First-person plural ("we", "our editors") is welcome. No hype, no exclamation marks, no emoji. |
| **Sections** | Reviews · Dispatches · The Edit · Guides |
| **Sign-off** | "Made carefully · London & Lisbon" |

### Writing rules of thumb
- Headlines: 4–10 words; italicize the most evocative word (e.g. *A weekend at the Splendido that lived up to its **name***.).
- Deks/sub-heads: one sentence, serif italic, sets the scene.
- Body: complete sentences, no bullet-spam. Bullets are for verdict rows, not arguments.
- Numbers: "9.4 / 10" — never "9.4!" or "★★★★★".

---

## 2. Logo

Three variants ship with the brand:

| Variant | File | Use on |
| --- | --- | --- |
| **Midnight** (primary) | `Littlebitofluxe dark blue.png` | Paper, sand, white, or light photography |
| **Sand** | `littlebitofluxesand.png` | Midnight backgrounds (footer, "The Edit" rail, verdicts) |
| **White** | `littlebitofluxe white.png` | Dark photography overlays |

**Construction.** The wordmark sets *LITTLE BIT / OF LUXE* in two stacked lines of a high-contrast serif. "BIT" and "LUXE" are italicized for rhythm. A thin vertical rule separates the wordmark from the descriptor "TRAVEL BLOG", set in clean sans-serif uppercase.

**Sizing.**
- Nav: 32–36 px tall.
- Footer: 48 px tall.
- Never below 24 px on screen, 18 mm in print.

**Clear space.** Reserve clear space equal to the cap-height of the "L" on all sides.

**Don'ts.**
- Never recolor outside the three approved variants.
- Never stretch, rotate, skew, or apply drop-shadows.
- Never place the wordmark on busy imagery without a scrim.
- Never substitute a typographic mock-up for the supplied PNGs.

---

## 3. Color palette

The palette is intentionally small: one deep navy ("midnight"), one warm cream ("sand"), a paper background, three editorial accents (bordeaux, sage, terracotta), and an aged gold reserved for ratings.

### Brand core

| Token | Hex | Role |
| --- | --- | --- |
| `--lbl-midnight` | `#0D152D` | Primary brand. Deep navy. Logo, ink, footer, "Edit" rail. |
| `--lbl-sand` | `#F4F1D3` | Primary accent. Pale, subtly desaturated cream. On-dark text, callouts. |

### Backgrounds

| Token | Hex | Role |
| --- | --- | --- |
| `--lbl-paper` | `#FAF8F2` | Default page background — warm off-white |
| `--lbl-paper-2` | `#F0ECE0` | Slightly deeper paper for section bands |
| `--lbl-ivory` | `#FFFFFF` | Pure white. Used sparingly (cards on paper, input fields). |

### Ink / foreground

| Token | Hex | Role |
| --- | --- | --- |
| `--lbl-ink` | `#0D152D` | Primary text (same as midnight) |
| `--lbl-ink-2` | `#2A3550` | Secondary text — body copy, deks |
| `--lbl-ink-3` | `#5C6480` | Tertiary — meta, eyebrows, captions |
| `--lbl-ink-4` | `#9098AE` | Disabled, placeholder, strong hairlines |

### Lines & hairlines

| Token | Value | Role |
| --- | --- | --- |
| `--lbl-rule` | `#0D152D` | Full-strength editorial rule |
| `--lbl-rule-soft` | `rgba(13, 21, 45, 0.18)` | Soft rule between meta rows |
| `--lbl-rule-hair` | `rgba(13, 21, 45, 0.10)` | Hairline — card bases, faint separation |

### Accent / rating / support

| Token | Hex | Role |
| --- | --- | --- |
| `--lbl-gold` | `#B08442` | Aged gold — star ratings, awards (only) |
| `--lbl-gold-soft` | `#D9B97A` | Lighter gold tints when needed |
| `--lbl-bordeaux` | `#6B1F2A` | Deep wine — featured tags, link hover, accent eyebrow |
| `--lbl-sage` | `#6F7A5C` | Muted sage — destination tags, nature |
| `--lbl-terracotta` | `#B96A4A` | Warm terracotta — dining tags |

### Semantic aliases (use these in components)

| Alias | Maps to |
| --- | --- |
| `--lbl-fg-1` | `--lbl-ink` |
| `--lbl-fg-2` | `--lbl-ink-2` |
| `--lbl-fg-3` | `--lbl-ink-3` |
| `--lbl-fg-on-dark` | `--lbl-sand` |
| `--lbl-bg-page` | `--lbl-paper` |
| `--lbl-bg-card` | `--lbl-ivory` |
| `--lbl-bg-inverse` | `--lbl-midnight` |
| `--lbl-bg-accent` | `--lbl-sand` |
| `--lbl-link` | `--lbl-midnight` |
| `--lbl-link-hover` | `--lbl-bordeaux` |

### The three signature pairings

| Pairing | Use for |
| --- | --- |
| **Paper × Midnight ink** | Editorial default. Page background + body. |
| **Midnight × Sand** | The signature. Hero, verdict box, footer, "The Edit" rail. |
| **Sand × Midnight ink** | Callouts, at-a-glance cards, pull-quote bands, newsletter. |

### On-midnight opacities of sand (`#F4F1D3`)
When sand sits on midnight, scale alpha — don't introduce a new color:
- `0.92` — pills and rating chips on imagery
- `0.85` — body copy on dark
- `0.70` — eyebrows
- `0.55` — micro-meta and de-emphasized labels
- `0.35` — divider lines

### Combinations to avoid
- Bordeaux on midnight (collapses).
- Gold on paper for anything other than star ratings.
- Pure black `#000` or any off-palette gray — always prefer midnight, paper, sand.

### Selection color
`::selection { background: var(--lbl-sand); color: var(--lbl-ink); }`

---

## 4. Typography

Two families. The **serif** carries everything expressive (display, headlines, deks, prose, italic emphasis). The **sans** carries everything functional (body by default, eyebrows, meta, navigation, buttons, forms).

### Families

| Token | Family | Source | Substitutes for |
| --- | --- | --- | --- |
| `--lbl-serif` | **Cormorant Garamond** | Google Fonts | PP Pangaia |
| `--lbl-sans` | **Manrope** | Google Fonts | CircularXX TT |

**Stacks (verbatim from `colors_and_type-2.css`):**
```
--lbl-serif: 'Cormorant Garamond', 'Times New Roman', Georgia, serif;
--lbl-sans:  'Manrope', 'Helvetica Neue', Arial, sans-serif;
```

**Weights to load:**
- Cormorant Garamond — `300, 400, 500, 600, 700` (roman + italic)
- Manrope — `300, 400, 500, 600, 700`

**Google Fonts link (drop into `<head>`):**
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Type scale (tokens)

| Token | Value | Use |
| --- | --- | --- |
| `--lbl-fs-display` | `clamp(56px, 9vw, 132px)` | Hero masthead |
| `--lbl-fs-h1` | `clamp(40px, 5.5vw, 72px)` | Page / article H1 |
| `--lbl-fs-h2` | `clamp(32px, 3.6vw, 48px)` | Section H2 |
| `--lbl-fs-h3` | `28px` | Sub-heads within prose |
| `--lbl-fs-h4` | `22px` | H4 (sans, weight 600) |
| `--lbl-fs-lede` | `22px` | Article lede / dek (serif italic) |
| `--lbl-fs-body` | `17px` | Body default (sans) |
| `--lbl-fs-small` | `14px` | Small / meta |
| `--lbl-fs-eyebrow` | `12px` | Eyebrows / kickers |
| `--lbl-fs-caption` | `13px` | Photo captions |

### Line-height tokens

| Token | Value | Use |
| --- | --- | --- |
| `--lbl-lh-display` | `0.95` | Display only |
| `--lbl-lh-tight` | `1.05` | H1 / display headlines |
| `--lbl-lh-snug` | `1.2` | H2, H3, H4 |
| `--lbl-lh-body` | `1.6` | Default body |
| `--lbl-lh-relaxed` | `1.75` | Long-form prose |

### Letter-spacing tokens

| Token | Value | Use |
| --- | --- | --- |
| `--lbl-tracking-eyebrow` | `0.22em` | Heavily tracked UPPERCASE labels |
| `--lbl-tracking-button` | `0.18em` | Button labels |
| `--lbl-tracking-caps` | `0.08em` | Light caps tracking on meta |
| `--lbl-tracking-tight` | `-0.02em` | Display & headings |

### Element defaults

| Class / element | Family | Weight | Size | Line-height | Tracking | Color |
| --- | --- | --- | --- | --- | --- | --- |
| `body` | sans | 400 | `--lbl-fs-body` (17) | `--lbl-lh-body` (1.6) | — | `--lbl-ink` |
| `.lbl-display` | serif | 400 | `--lbl-fs-display` | `0.95` | `-0.02em` | `--lbl-ink` |
| `h1` / `.lbl-h1` | serif | 400 | `--lbl-fs-h1` | `1.05` | `-0.02em` | `--lbl-ink` |
| `h2` / `.lbl-h2` | serif | 400 | `--lbl-fs-h2` | `1.2` | `-0.02em` | `--lbl-ink` |
| `h3` / `.lbl-h3` | serif | 500 | `28px` | `1.2` | — | `--lbl-ink` |
| `h4` / `.lbl-h4` | **sans** | 600 | `22px` | `1.2` | — | `--lbl-ink` |
| `p` / `.lbl-body` | sans | 400 | `17px` | `1.75` | — | `--lbl-ink-2` |
| `.lbl-lede` | serif italic | 400 | `22px` | `1.6` | — | `--lbl-ink` |
| `.lbl-prose` | serif | 400 | `20px` | `1.75` | — | `--lbl-ink` |
| `.lbl-eyebrow` | sans | 600 | `12px` | — | `0.22em` UPPER | `--lbl-ink-3` |
| `.lbl-eyebrow--accent` | sans | 600 | `12px` | — | `0.22em` UPPER | `--lbl-bordeaux` |
| `.lbl-meta` | sans | 500 | `14px` | — | `0.08em` UPPER | `--lbl-ink-3` |
| `.lbl-caption` | sans italic | 400 | `13px` | `1.4` | — | `--lbl-ink-3` |
| `.lbl-byline` | serif italic | 400 | `16px` | — | — | `--lbl-ink-2` |
| `.lbl-pullquote` | serif italic | 400 | `clamp(28px, 3vw, 40px)` | `1.25` | — | `--lbl-ink` |

### Italic emphasis rule (the brand signature)

Headlines almost always italicize **one word** — the most evocative noun or verb. Inside `<em>` the weight bumps to `600`.

Examples:
- *Latest **dispatches***
- *The **Edit***
- *One **email** a week. Worth opening.*
- *A weekend at the Splendido that lived up to its **name**.*

### Long-form prose

`.lbl-prose` overrides the default sans body with serif at `20px / 1.75` for long-form reading. Use it for article body copy. Plain `p` stays sans.

Links inside `.lbl-prose`:
- Color: `--lbl-midnight`
- `text-underline-offset: 4px`
- `text-decoration-thickness: 1px`
- Hover: `--lbl-bordeaux`

### Numbers

Verdict scores split the decimal in italic — `9.<em>4</em>` — paired with a tiny uppercase sans denominator (`/ 10`).

---

## 5. Spacing — 4pt grid

| Token | Value |
| --- | --- |
| `--lbl-sp-1` | `4px` |
| `--lbl-sp-2` | `8px` |
| `--lbl-sp-3` | `12px` |
| `--lbl-sp-4` | `16px` |
| `--lbl-sp-5` | `24px` |
| `--lbl-sp-6` | `32px` |
| `--lbl-sp-7` | `48px` |
| `--lbl-sp-8` | `64px` |
| `--lbl-sp-9` | `96px` |
| `--lbl-sp-10` | `128px` |

Use only these values. No `15px`, no `27px`.

---

## 6. Layout

| Token | Value | Use |
| --- | --- | --- |
| `--lbl-container` | `1280px` | Default content max-width |
| `--lbl-container-narrow` | `720px` | Article body |
| `--lbl-gutter` | `clamp(20px, 4vw, 56px)` | Container side padding |

**Aspect ratios.**
- Article card media: `4 / 3`
- Featured media: `5 / 4`
- Article hero: `16 / 9`

**Grids in practice.**
- 3-column grid (latest, related): `repeat(3, 1fr)` with `gap: 56px 40px`.
- 4-column grid ("The Edit" rail): `repeat(4, 1fr)` with `gap: 48px 32px`.
- Featured (home hero): `1.4fr 1fr` with `gap: 56px`, `align-items: end`.

---

## 7. Corners — sharp editorial

The brand is **square**. The only allowed radii:

| Token | Value | Use |
| --- | --- | --- |
| `--lbl-radius-0` | `0px` | Default. Cards, sections, media, pull-quotes. |
| `--lbl-radius-1` | `2px` | Near-sharp inputs |
| `--lbl-radius-btn` | `3px` | Buttons, filled tags |
| `--lbl-radius-pill` | `999px` | **Rare.** Only pill tags overlaid on imagery. |

---

## 8. Shadows — used sparingly

| Token | Value | Use |
| --- | --- | --- |
| `--lbl-shadow-none` | `none` | Default — most UI |
| `--lbl-shadow-card` | `0 1px 0 var(--lbl-rule-hair)` | A whisper under a card |
| `--lbl-shadow-lift` | `0 12px 32px -16px rgba(13, 21, 45, 0.18)` | Hover lift on interactive surfaces |
| `--lbl-shadow-image` | `0 24px 48px -24px rgba(13, 21, 45, 0.35)` | Featured imagery only |

No glow, no inset shadows, no colored shadows.

---

## 9. Motion

| Token | Value |
| --- | --- |
| `--lbl-ease` | `cubic-bezier(0.2, 0.6, 0.2, 1)` |
| `--lbl-dur-fast` | `180ms` — color, hover, state changes |
| `--lbl-dur-base` | `280ms` — opacity & small transforms |
| `--lbl-dur-slow` | `520ms` — image zoom on card hover |

No bounces, no springs, no rotating loaders. Motion is restrained.

---

## 10. Components

### Buttons (4 styles)

All buttons share these base properties:

```css
font-family: var(--lbl-sans);
font-weight: 600;
font-size: 12px;
letter-spacing: 0.18em;
text-transform: uppercase;
padding: 14px 22px;
border: 1px solid var(--lbl-midnight);
border-radius: 3px;       /* --lbl-radius-btn */
transition: all 180ms var(--lbl-ease);
cursor: pointer;
```

| Style | Background | Text | Border |
| --- | --- | --- | --- |
| **Primary** (`.btn--primary`) | `--lbl-midnight` | `--lbl-sand` | midnight |
| **Ghost** (`.btn--ghost`) | transparent | `--lbl-midnight` | midnight |
| **Sand** (`.btn--sand`) | `--lbl-sand` | `--lbl-midnight` | midnight |
| **Link** (`.btn--link`) | transparent (no border, `border-radius: 0`) | `--lbl-midnight` with `1px` bottom border | — |

Primary is the default CTA. Sand is the secondary CTA on paper. Ghost lives on photography or sand bands. Link is the inline "Read more →".

### Form inputs

**Newsletter / boxed input.**
- Wrapper: `1px solid var(--lbl-midnight)`, `border-radius: 3px`, `background: #fff`.
- Input: sans, `15px`, padding `14px 16px`, transparent.
- Placeholder color: `--lbl-ink-4`.
- Joined button: midnight fill, sand text, uppercase sans 11px, `0.22em` tracking.

**Search input (no box).**
- Bottom border only: `1px solid var(--lbl-midnight)`, `padding-bottom: 8px`.
- Input: **serif italic**, `22px`, color `--lbl-ink`.
- Placeholder: `--lbl-ink-3`.
- Search icon left of input.

### Tags & categories

Editorial tags are sharp uppercase chips. Sans, 10px, `0.22em` tracking, `padding: 8px 14px`, `1px solid currentColor`, `border-radius: 3px`.

| Variant | Color | Use |
| --- | --- | --- |
| Default | `--lbl-midnight` outline | Hotel Review, Guides, generic categories |
| `.tag--filled` | midnight fill, sand text | Active filter / selected |
| `.tag--bordeaux` | `--lbl-bordeaux` outline | Featured, editor's pick |
| `.tag--sage` | `--lbl-sage` outline | Destinations / nature |
| `.tag--terracotta` | `--lbl-terracotta` outline | Dining, food |
| `.tag--pill` (the exception) | `rgba(245, 242, 205, 0.92)` fill, midnight text, `border-radius: 999px`, `backdrop-filter: blur(8px)` | **Only** overlaid on imagery |

### Eyebrow / kicker

Sans 12px, weight 600, `0.22em` tracking, UPPERCASE, color `--lbl-ink-3`. Accent variant uses `--lbl-bordeaux`. On dark backgrounds use `rgba(244, 241, 211, 0.70)`.

### Article card

- Media on top, `aspect-ratio: 4 / 3`.
- Hover: image scales to `1.04` over `520ms` (`--lbl-dur-slow`).
- Rating chip top-right: sand pill, midnight text, gold star, `backdrop-filter: blur(8px)`.
- Below image: eyebrow → serif card title (24px, italicized word) → italic byline → uppercase meta.
- Hover: title color shifts to `--lbl-bordeaux`.

### Verdict box ("The Verdict") — the brand signature card

```css
background: var(--lbl-midnight);
color: var(--lbl-sand);
padding: var(--lbl-sp-5) var(--lbl-sp-6);    /* or 40px 44px in long form */
display: grid;
grid-template-columns: 1fr auto;
gap: var(--lbl-sp-5);
align-items: end;
```

- Eyebrow above headline: sand at 70% opacity, `0.28em` tracking, bottom border `rgba(244,241,211,0.35)`.
- Headline: serif 30–36px with one italicized word.
- Key/value rows: `grid-template-columns: 1fr 2fr`, sand at 85% for values, sand at 55% for uppercase keys.
- Score on the right: serif 64–96px, decimal digit italic, sans 11px denominator beneath at 60% sand opacity.

### Pull-quote

- 1px midnight rule top and bottom.
- Serif italic, `clamp(28px, 3vw, 40px)`, `line-height: 1.25`, color `--lbl-ink`.
- `padding: 32px 0`.
- Attribution beneath: sans uppercase eyebrow style.

### Nav

- Sticky top, `height: 80px`.
- Background `rgba(250, 248, 242, 0.88)` + `backdrop-filter: saturate(140%) blur(14px)`.
- Bottom border: `1px solid var(--lbl-midnight)`.
- 3-column grid: links · centered logo · icons + Subscribe button.
- Links: sans 11–12px, `0.22em` tracking, UPPERCASE. Hover → `--lbl-bordeaux`. Active link gets a 1px bordeaux underline.

### Subscribe button (signature nav CTA)

Hybrid sans/serif treatment:
- Sand face, midnight ink, `1px solid midnight`, `border-radius: 4px`, `padding: 11px 22px 12px`.
- Label: **serif italic**, weight 600, `20px`, paired with a serif italic arrow "→".
- Hover: inverts to midnight face / sand ink; arrow nudges `translateX(4px)`.
- Active: `scale(0.98)`.

### Footer

- Midnight background, sand text, `padding: 80px 0 32px`.
- 4-column grid: brand block (sand logo + italic serif tagline 20px) · 3 link columns.
- Column heads: sand at 55%, sans uppercase 11px, `0.22em` tracking.
- Column links: serif 17px sand → `#fff` on hover.
- Bottom row: sand at 60%, sans uppercase, `1px solid rgba(244,241,211,0.18)` rule above.

### Newsletter band

- Sand background, midnight ink, `padding: 96px 0`.
- Headline: serif 56px with one italicized word.
- One-line form: transparent input + midnight submit button with sand uppercase label, all inside a `1px solid midnight` frame.

---

## 11. Imagery

- **Subject matter:** atmospheric travel photography — quiet harbours, soft light, interiors with patina, food in situ. No people facing the camera. No drone-tourism clichés.
- **Treatment:** unfiltered or lightly graded; warm shadows, true whites. Avoid heavy presets, HDR, or vignettes.
- **Crop:** generous negative space; subjects rarely centered.
- **Captions:** sans italic 13px, `--lbl-ink-3`, signed "— Author Name".
- **Overlay pills:** sand at 92% opacity with `blur(8px)` backdrop; uppercase sans label.

---

## 12. Iconography

- **Library:** Lucide (or Lucide-style hand-rolled SVGs).
- **Stroke:** `1.5px`, `stroke-linecap: round`, `stroke-linejoin: round`.
- **Size:** 16, 18, 20, 22 px.
- **Color:** `currentColor` (inherits from parent text).
- Used sparingly: search, bookmark, arrow-right, clock. No filled glyphs, no colored icons.

---

## 13. CSS — drop-in tokens

Paste this `:root` block (verbatim from `colors_and_type-2.css`) into any new project:

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Manrope:wght@300;400;500;600;700&display=swap');

:root {
  /* BRAND CORE */
  --lbl-midnight:    #0D152D;
  --lbl-sand:        #F4F1D3;

  /* BACKGROUNDS */
  --lbl-paper:       #FAF8F2;
  --lbl-paper-2:     #F0ECE0;
  --lbl-ivory:       #FFFFFF;

  /* INK / FOREGROUND */
  --lbl-ink:         #0D152D;
  --lbl-ink-2:       #2A3550;
  --lbl-ink-3:       #5C6480;
  --lbl-ink-4:       #9098AE;

  /* LINES */
  --lbl-rule:        #0D152D;
  --lbl-rule-soft:   rgba(13, 21, 45, 0.18);
  --lbl-rule-hair:   rgba(13, 21, 45, 0.10);

  /* ACCENTS */
  --lbl-gold:        #B08442;
  --lbl-gold-soft:   #D9B97A;
  --lbl-bordeaux:    #6B1F2A;
  --lbl-sage:        #6F7A5C;
  --lbl-terracotta:  #B96A4A;

  /* SEMANTIC */
  --lbl-fg-1:        var(--lbl-ink);
  --lbl-fg-2:        var(--lbl-ink-2);
  --lbl-fg-3:        var(--lbl-ink-3);
  --lbl-fg-on-dark:  var(--lbl-sand);
  --lbl-bg-page:     var(--lbl-paper);
  --lbl-bg-card:     var(--lbl-ivory);
  --lbl-bg-inverse:  var(--lbl-midnight);
  --lbl-bg-accent:   var(--lbl-sand);
  --lbl-link:        var(--lbl-midnight);
  --lbl-link-hover:  var(--lbl-bordeaux);

  /* TYPE FAMILIES */
  --lbl-serif: 'Cormorant Garamond', 'Times New Roman', Georgia, serif;
  --lbl-sans:  'Manrope', 'Helvetica Neue', Arial, sans-serif;

  /* TYPE SCALE */
  --lbl-fs-display:  clamp(56px, 9vw, 132px);
  --lbl-fs-h1:       clamp(40px, 5.5vw, 72px);
  --lbl-fs-h2:       clamp(32px, 3.6vw, 48px);
  --lbl-fs-h3:       28px;
  --lbl-fs-h4:       22px;
  --lbl-fs-lede:     22px;
  --lbl-fs-body:     17px;
  --lbl-fs-small:    14px;
  --lbl-fs-eyebrow:  12px;
  --lbl-fs-caption:  13px;

  /* LINE HEIGHT */
  --lbl-lh-display:  0.95;
  --lbl-lh-tight:    1.05;
  --lbl-lh-snug:     1.2;
  --lbl-lh-body:     1.6;
  --lbl-lh-relaxed:  1.75;

  /* TRACKING */
  --lbl-tracking-eyebrow:  0.22em;
  --lbl-tracking-button:   0.18em;
  --lbl-tracking-caps:     0.08em;
  --lbl-tracking-tight:    -0.02em;

  /* SPACING (4pt grid) */
  --lbl-sp-1: 4px;  --lbl-sp-2: 8px;  --lbl-sp-3: 12px; --lbl-sp-4: 16px;
  --lbl-sp-5: 24px; --lbl-sp-6: 32px; --lbl-sp-7: 48px; --lbl-sp-8: 64px;
  --lbl-sp-9: 96px; --lbl-sp-10: 128px;

  /* CORNERS */
  --lbl-radius-0:    0px;
  --lbl-radius-1:    2px;
  --lbl-radius-btn:  3px;
  --lbl-radius-pill: 999px;

  /* SHADOWS */
  --lbl-shadow-none:  none;
  --lbl-shadow-card:  0 1px 0 var(--lbl-rule-hair);
  --lbl-shadow-lift:  0 12px 32px -16px rgba(13, 21, 45, 0.18);
  --lbl-shadow-image: 0 24px 48px -24px rgba(13, 21, 45, 0.35);

  /* LAYOUT */
  --lbl-container:        1280px;
  --lbl-container-narrow: 720px;
  --lbl-gutter:           clamp(20px, 4vw, 56px);

  /* MOTION */
  --lbl-ease:     cubic-bezier(0.2, 0.6, 0.2, 1);
  --lbl-dur-fast: 180ms;
  --lbl-dur-base: 280ms;
  --lbl-dur-slow: 520ms;
}

html, body {
  background: var(--lbl-bg-page);
  color: var(--lbl-fg-1);
  font-family: var(--lbl-sans);
  font-size: var(--lbl-fs-body);
  line-height: var(--lbl-lh-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

::selection { background: var(--lbl-sand); color: var(--lbl-ink); }
```

---

## 14. Do / Don't quick reference

**Do**
- Italicize one word per headline.
- Pair sand on midnight, midnight on paper or sand.
- Default body copy is **sans** (Manrope); switch to serif (Cormorant Garamond) for long-form `.lbl-prose`.
- Keep cards, media, and section blocks square (`border-radius: 0`).
- Use the gold only for star ratings.
- Stick to the 4pt spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).
- Use accent colors as outlines and small fills only — never as page backgrounds.

**Don't**
- Don't use emoji, exclamation marks, or all-caps body copy.
- Don't introduce a third typeface, gradient, or display script.
- Don't use bordeaux, sage, or terracotta for large fills — they're accents, not backgrounds.
- Don't put gold on light backgrounds outside the rating context.
- Don't round corners on cards, inputs, chips, or imagery.
- Don't apply shadows to UI chrome — only to featured imagery (and only `--lbl-shadow-image`).
- Don't pick a color value that isn't in this file.

---

## 15. Asset checklist for AI handoff

When briefing an AI to produce on-brand work, attach:

1. This file (`BRAND.md`) in full.
2. The three logo PNGs (midnight, sand, white).
3. `colors_and_type-2.css` for direct CSS import.
4. The instruction: *"Match the Little Bit of Luxe brand exactly — see BRAND.md. If a choice is ambiguous, lean restrained, editorial, and quiet."*

— End of document.
