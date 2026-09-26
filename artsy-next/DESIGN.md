---
name: Editorial Production
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e8bdb3'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ae887f'
  outline-variant: '#5e3f38'
  surface-tint: '#ffb4a2'
  primary: '#ffb4a2'
  on-primary: '#621100'
  primary-container: '#ff562c'
  on-primary-container: '#560e00'
  inverse-primary: '#b42800'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#c7c6c6'
  on-tertiary: '#303031'
  tertiary-container: '#919090'
  on-tertiary-container: '#292a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0700'
  on-primary-fixed-variant: '#8a1d00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 112px
    fontWeight: '800'
    lineHeight: 96px
    letterSpacing: -0.06em
  display-xl-mobile:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.05em
  display-lg:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 68px
    letterSpacing: -0.05em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.04em
  headline-editorial:
    fontFamily: Playfair Display
    fontSize: 44px
    fontWeight: '400'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-editorial-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  technical-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  caption-mono:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.08em
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 3rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 2rem
  space-xl: 4rem
---

## Brand & Style

This design system translates the stark, visceral language of avant-garde print editorial and cinematic post-production into a dynamic digital canvas. Built for high-end arts and media production, the interface rejects decorative tech tropes in favor of structural tension, brutalist grid discipline, and typographic scale contrast.

The emotional resonance is authoritative, urgent, and culturally sharp. It evokes the feeling of late-night cutting rooms, gallery manifests, and premium printed monographs. Visual anchors include extreme tracking compression, razor-wire 1px architectural lines, technical data readouts, bracketed indices `[00]`, and sudden jolts of high-chroma vermillion against deep photographic blacks.

## Colors

The palette operates under rigorous high-contrast constraints:

- **Neutral Canvas (`#0A0A0A`):** The foundational void. Not an absolute pitch black, but a deep, filmic matte obsidian that holds deep shadows and subtle noise overlays.
- **Surface Elevation (`#1A1A1A`):** Used for muted panels, modular table rows, and interactive hover states.
- **Divider System (`#262626`):** Structural 1px boundary lines that organize viewports into print-like editorial columns and rows.
- **Primary Text (`#FAFAFA`):** An incandescent warm white providing maximum contrast without cold blue-light glare.
- **Secondary & Muted (`#737373`):** Neutral gray dedicated to technical labels, secondary metadata, and structural guides.
- **Kinetic Accent (`#FF3D00`):** An unapologetic vermillion red-orange. Used sparingly for status indicators, cursor underlines, active playheads, and urgent editorial focal points. Accent text is paired strictly with `#0A0A0A` when inverted.

## Typography

The typographic hierarchy is built on a tri-font framework:

1. **Inter:** Driven to sculptural limits. Large display titles utilize negative letter spacing (`-0.04em` to `-0.06em`) with compressed line heights, allowing characters almost to collide like woodblock typography.
2. **Playfair Display:** Introduced exclusively for pull-quotes, artistic manifesto statements, and long-form editorial reflections, establishing an intentional tension against the brutal sans-serif framework.
3. **JetBrains Mono:** The voice of production infrastructure. Applied to bracketed numeric markers (`[01]`), video timecodes (`00:14:28:02`), color spaces (`REC.709`), and metadata keys. Set consistently in uppercase or tabular numerals.

## Layout & Spacing

Layout follows a strict, razor-edge 12-column modular grid divided by visible 1px borders (`#262626`). Rather than relying on floating islands of cards, content is locked into structured cells reminiscent of broadsheet newspapers and video editing track headers.

- **Desktop Grid (1024px+):** 12 columns, 48px canvas margin, 24px column gutters. Full-bleed marquee ribbons break the canvas horizontally.
- **Tablet Grid (768px - 1023px):** 6 columns, 32px margins, 16px gutters.
- **Mobile Grid (up to 767px):** 2 or 4 columns, 16px margins, 12px gutters. Display titles scale down via dedicated mobile tokens to maintain immediate viewport legibility without overflowing cell constraints.

## Elevation & Depth

This design system completely eliminates drop shadows, blurs, and soft atmospheric lighting. The surface is deliberately graphic, planar, and screen-printed.

- **Planar Hierarchy:** Depth is created through surface contrast and crisp 1px borders (`#262626`). An elevated element is expressed by shifting the background tone from `#0A0A0A` to `#1A1A1A`.
- **Texture:** A procedural CSS/SVG noise filter (opacity 0.035, mix-blend-mode `overlay`) sits fixed over the background to break up digital banding and mimic 35mm film stock.
- **Overlays:** Menus, contextual sidebars, and full-screen drawers do not use frosted blurs; they snap into position with solid `#0A0A0A` surfaces bordered by razor 1px dividers.

## Shapes

The geometric rule is absolute: **0px border radius across all elements**.

No soft corners exist in buttons, form controls, media containers, modal sheets, or tags. Every component terminates in a sharp, 90-degree vector point. This hyper-geometric discipline reinforces the technical precision of video editing suites, timeline tracks, and poster design.

## Components

### Buttons
- **Primary:** Full fill `#FAFAFA` with `#0A0A0A` text, 0px radius, uppercase JetBrains Mono. On hover, background shifts to `#FF3D00` with instant 0ms transitions.
- **Ghost / Editorial Link:** Transparent background with white typography. Positioned over a persistent, animated 2px Vermillion underline (`#FF3D00`) that extends from 0% to 100% width on hover.

### Video Marquee Band
- Continuous, hardware-accelerated infinite horizontal scrolling ticker. Contains post-production service lines (e.g., `COLOR GRADING // SOUND DESIGN // VFX // CONFORM`) separated by vermillion diamond or asterisk glyphs. Styled in `technical-data` JetBrains Mono or scaled `headline-md`.

### Metadata Chips & Badges
- Sharp `#1A1A1A` rectangles outlined in 1px `#262626`. Content is bracketed mono text: `[4K RAW]`, `[LOG-C]`, `[01/12]`. Foreground set to `#737373`, turning `#FAFAFA` on active state.

### Lists & Accordions
- Full-width architectural table rows separated by top and bottom 1px `#262626` lines. Each item features a bracketed index (`[01]`, `[02]`) on the left, a large Inter headline in the center, and technical role/specs on the right. Hovering triggers a background wash to `#1A1A1A`.

### Form Controls
- **Inputs:** Minimalist bottom-bordered or fully bounded `#1A1A1A` boxes with 0px radius. Input text uses `body-md` in `#FAFAFA`; placeholders use `#737373`. Focus state swaps border color from `#262626` directly to `#FF3D00`.
- **Checkboxes & Radios:** Unrounded 16x16px boxes. Checked state fills with `#FF3D00` with a solid `#0A0A0A` square center marker instead of a curved checkmark.

### Media & Production Cards
- Media containers are flush, sharp rectangles without card padding. Video stills sit inside 1px `#262626` frames, overlaid with JetBrains Mono timecode tags positioned at `top: 8px; left: 8px`. Hovering displays a full `#FF3D00` corner tick or active frame indicator.