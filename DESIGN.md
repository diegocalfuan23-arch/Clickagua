# Design

<!-- impeccable:design-schema 1 -->

## Scope

This file documents **one surface only**: the public committee site (`src/components/sitio/*`, served at `apr-<slug>.facilagua.com`). It does not describe the admin panel (`src/components/panel/*`) or the marketing site (`src/components/site/*`), which keep their own pre-existing indigo-on-white, card-based visual language, untouched by this redesign.

## World

**Community bulletin, real-reference-led.** Built directly from a real Chilean APR site the user pointed to (Comité APR Caburgua — see `PRODUCT.md` § Evidence on Hand), not from an abstract concept exercise. Soft sky-blue hero section closed by a wave-shaped divider, a warm italic serif for the committee's welcome message, white content cards with soft shadows (not hard borders), indigo used as an accent (button, icons, links) rather than as a dominant page-scale block.

This replaced an earlier attempt ("señalética vial rural" — solid indigo/lime/black blocks, thick borders, all-caps display type) that the user rejected on sight as looking amateurish ("como hecho por un niño de básica"). That attempt was technically clean (contrast, structure, responsiveness all passed) but read as a generic "bold AI design" cliché with no craft behind it. This version corrects course by anchoring to a real, lived-in reference instead of an invented cultural world.

## Palette

- `#3607F2` (primary/indigo, existing product token) — WhatsApp CTA button, icon accents, links. Used sparingly, never as a full-section fill.
- Soft sky-blue gradient (`#e4f1f8` → `#d6ebf3`) — the hero band background. Never saturated; this is the palette's most identifying move, taken directly from the reference site.
- `#1c2340` (near-navy, new) — body text and headings on this surface, softer than pure black, warmer against the blue.
- White — card fill, page background outside the hero.
- `#f4f8fa` — footer band, barely-there contrast from white.
- Notice-type colors (`CORTE` destructive-red, `MANTENCION` tertiary-amber, `NOTICIA` primary-indigo) kept from the prior version, now at very low fill opacity (`/[0.04]`–`/[0.06]`) with soft borders instead of solid-tinted card backgrounds — matches this surface's gentler contrast register.
- Lime (`#C3F207`) is **not used anywhere on this surface**. It was evaluated in the rejected attempt and dropped; do not reintroduce it here without a specific, considered reason and the user's sign-off — see `PRODUCT.md` § Brand Commitments.

## Type

- **Warm display**: Newsreader, italic, weights 500/600, loaded in `src/app/sitio/layout.tsx` as `--font-sitio-calida`. Used only for the committee's welcome sentence in the hero — the one place on the page meant to feel handwritten-warm rather than administrative. A serif italic, not a script/handwriting face, to avoid reading as childish.
- Everything else stays on the product's existing sans stack (inherited from the root layout) — headings, labels, body copy, numbers. This surface does not need a second structural typeface; the italic serif is a single accented voice, not a new system.

## Structure

- **Header**: simple white bar, circular indigo-tinted icon badge, committee name + comuna. Unchanged in structure from the prior version, restyled only in color.
- **Hero band**: sky-blue gradient, the warm italic welcome sentence, then the WhatsApp CTA as a full pill button with a soft indigo drop shadow (`shadow-[0_8px_20px_-6px_rgba(54,7,242,0.45)]`) — depth communicated through shadow, not a border.
- **Wave divider**: an inline SVG path (`viewBox 1440×60`) closing the hero band into the white content area below. This is the surface's one authored, non-generic motif — deliberately not a straight edge or a diagonal, both of which read as generic template dividers.
- **Avisos**: white-ish tinted cards (per notice type) with soft 1px borders and a barely-there shadow (`shadow-[0_1px_2px_rgba(28,35,64,0.04)]`), rounded `2xl`.
- **Contacto / Tarifas y pago**: two white cards with soft borders and shadow (`shadow-[0_1px_3px_rgba(28,35,64,0.06)]`), asymmetric content, no forced equal heights or icon+heading+text sameness.
- **Footer**: flat off-white band, quiet.
- The floating WhatsApp assistant widget (`asistente-comite.tsx`) was left in its prior shadcn-default styling (rounded-full trigger, rounded-2xl panel, soft shadow) — it already matched this gentler register without needing changes, unlike the previous redesign attempt which had forced it into thick borders.

## Rules for future work on this surface

- Every field on this page is optional at the data layer (a new committee may have only a name and comuna); sections must keep degrading gracefully — do not assume `telefono`, tarifas, or avisos exist.
- Depth on this surface comes from soft shadows and low-opacity tints, never from thick uniform borders — that was the specific failure mode of the rejected attempt.
- The wave divider is this surface's signature motif; do not replace it with a generic straight or diagonal section break.
- The italic warm serif is reserved for the committee's own welcome copy — do not extend it to labels, numbers, or UI chrome, or it stops feeling like an accent and starts feeling like a costume.
- Lime stays out of this surface unless there is a specific, considered reason to bring it back — see `PRODUCT.md`.
- Any new imagery must either be real (sourced from an actual committee, when that becomes available) or the layout must work gracefully without it — do not fabricate stock-style "rural water committee" photography to fill space.

## Open items

- No real committee has published content through this design yet; only the test tenant "APR jose fleto" (Pucón, placeholder copy) has been verified end-to-end, desktop and mobile.
- The `MANTENCION` and `NOTICIA` notice-type stylings were built and pass contrast checks but only `CORTE` was visually inspected with real content in the finish round.
- The reference site (Comité APR Caburgua) uses real photography extensively; this redesign intentionally does not, since FacilAgua has no real committee photos yet. If/when committees start uploading real photos, this surface's structure (hero, notice cards, contact cards) should be revisited to make room for them rather than bolting a photo section on top.
