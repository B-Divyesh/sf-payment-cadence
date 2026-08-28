# Gentle Nudge — visual thesis

## Direction: surreal editorial scenery

Late-payment follow-up feels heavier than the task itself. Gentle Nudge makes that weight visible as a quiet paper landscape: an oversized cream envelope rests between coral stepping stones while a tiny blue moon marks time. The scene is strange but calm, editorial rather than cartoonish. It frames reminders as measured steps across a landscape—not an aggressive collections machine.

The application itself is a single-mode light workspace. This is deliberate: it resembles a considerate letter laid out on warm stock and avoids the “financial dashboard” feeling. Dark ink and generous negative space keep the working surface clear; the generated landscape is reserved for the welcome/empty state so decoration always explains the product world.

## Tokens

- `paper` #F5F0E6 — warm canvas, softer than invoice white.
- `paper-raised` #FFFCF5 — drafting surface.
- `ink` #172A3A — blue-black copy (12.9:1 on paper).
- `ink-soft` #52616B — secondary copy (5.4:1 on paper).
- `coral` #C94F3D — stepping stones and decorative nudge markers.
- `coral-deep` #8E3025 — primary actions, danger, and emphasized links; white control text reaches AA contrast.
- `sky` #A9CCE0 — schedule markers and quiet focus layers.
- `moss` #456B52 — successful/paid state.
- `ochre` #A66518 — waiting/warning state.
- Focus ring: #145D78 against a 3px paper halo.

Contrast is designed to exceed WCAG AA. Statuses always have an icon or text label in addition to color.

## Type and rhythm

The display face uses self-hosted **Fraunces**, a soft editorial serif whose irregularity makes the product human without becoming whimsical. Working copy uses the system sans stack for fast loading and crisp form controls. Only one WOFF2 font file is shipped (`font-display: swap`). The scale is 16, 18, 22, 30, and clamp(38–64) px. Text measures stay below 70 characters. Spacing follows an 8px base with 4px for tight label relationships; major sections use 32–64px.

## Layout and interaction grammar

The shell uses an offset editorial masthead, a hairline “cadence track,” and mostly unboxed groups. Independent invoices become paper slips with a clipped top-right corner; the drafting pane is a raised sheet. Primary actions are coral lozenges, secondary actions are ink-outline controls. All controls are at least 44px. The 390px layout drops the decorative sidebar, stacks the queue and editor, and turns the top navigation into a compact tab row.

State changes use plain, relational language: “Ready to prepare,” “Paused,” “Copied,” and “Marked sent.” Destructive choices name their target and require confirmation. The editor stays fully editable immediately before copy or email draft; nothing is sent automatically.

## Motion

Paper slips enter with 180ms opacity + 6px vertical settling; dialogs scale from 98% over 180ms; the cadence marker advances with a 220ms transform. There is no ambient or looping animation. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling are removed and all states change instantly.

## Original asset plan and provenance

Hero/empty-state illustration: a surreal paper-cut landscape with an oversized unsealed envelope, three coral stepping stones, and a tiny blue moon. It contains no people, brands, lettering, coins, or threatening imagery. The image is explanatory: patient, staged follow-up with a human-held final step.

Prompt sheet: “Surreal editorial still life, tactile cut-paper landscape on warm cream paper, one oversized unsealed ivory envelope resting gently among three rounded coral stepping stones, a tiny powder-blue moon showing phases, long soft morning shadows, restrained screenprint texture, sophisticated independent magazine illustration, muted navy coral cream powder-blue palette, straight-on three-quarter view, ample negative space, no people, no hands, no money, no charts, no text, no letters, no watermark, no logo, no border.”

Generated with the factory Azure image model (`factory-image`) on 2026-08-28. Original commissioned output for this product. The chosen source and prompt sidecar live in `assets/src/`; production WebP lives in `public/assets/`. The logo and PWA icons are hand-authored SVG/PNG assets built from the same envelope-and-moon geometry.
