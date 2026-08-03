# Design

<!-- impeccable:design-schema 1 -->

## Scope

This file documents **one surface only**: the public committee site (`src/components/sitio/*`, served at `apr-<slug>.facilagua.com`). It does not describe the admin panel (`src/components/panel/*`) or the marketing site (`src/components/site/*`), which keep their own pre-existing indigo-on-white, card-based visual language, untouched by this redesign.

## World

**Señalética Vial Rural** — the page as a Chilean rural road sign: solid color blocks carrying authority, wide high-contrast type built to be read at a glance, thick-stroke iconography, zero ambiguity. Chosen by the direction roll (candidate 4/7, seed `f9bb32f6`) from a set of directions grounded in Chilean rural civic institutions (committee minutes, official gazettes, utility bills, road signage, field logbooks, community certificates).

Why this world: the audience is a rural water-committee member, often older, checking a phone for a yes/no fact (is there an outage) under real daylight, not browsing. A road sign is built for exactly that reading condition — legible fast, at a distance, without interpretation — and it is a register no generic SaaS landing page reaches for.

## Palette

Committed strategy: indigo carries whole regions (header, service-status band), not just accents.

- `#3607F2` (primary/indigo) — identity block (header) and interactive accents (icons, links). Matches the existing product-wide `--primary` token; this surface inherits it rather than inventing a new brand color.
- `#1a1a1a` (near-black) — body text, card borders, footer, and the "no active notice" fallback is `forest` green while an active `CORTE` notice recolors the status band to black.
- `#C3F207` (lime) — first application anywhere in the product. Used only as: a background with dark text on top (WhatsApp CTA, active-notice badges), or as text/stroke laid over indigo or black. **Never** as text on a white background — verified contrast is 1.31:1 there, unusable. Verified contrast: lime-on-indigo 6.49:1, black-on-lime 13.28:1.
- `forest` (existing token, green) — "service normal" status band.
- White — page background, card fill.

No gradients, no drop shadows as depth (borders carry structure instead), no gray scale beyond the black/white opacity ramps already listed.

## Type

- **Display**: Space Grotesk, weights 500/700, loaded via `next/font/google` in `src/app/sitio/layout.tsx` as `--font-sitio-display`. Wide, geometric, has the density of stenciled road-sign lettering. Deliberately different from Geist (the font everywhere else in the product) — this surface is its own world, not a themed section of the app.
- Headings and labels: uppercase, bold, tracked wide (`tracking-[0.08em]` for eyebrow-style section labels, which here function as sign-panel category tags rather than the banned marketing "kicker" — they label a distinct visual block, not a heading that already carries its own weight).
- Body copy stays sentence case at `1.05–1.1rem`, generous line-height, for actual reading comfort — the road-sign register applies to structure and labels, not to the paragraph the visitor has to read and understand.

## Structure

- **Identity band** (indigo, full width): committee name as if it were a route name, comuna/región below it, house-mark icon in a bordered box.
- **Service-status band** (green or black): the single largest, first-read fact on the page — is there an outage or not. This is intentionally the loudest element after the identity band; everything else is quieter than it.
- **Hero**: one sentence of description, then the WhatsApp CTA as a lime block with a thick dark border — the page's one real conversion action, never competing with anything else for attention.
- **Avisos vigentes**: active notices as solid black cards (or white-bordered for `NOTICIA`), with a lime or indigo pill-label. Appears only when notices exist.
- **Contacto / Tarifas y pago**: two bordered panels (`border-[3px]`), asymmetric content (Contacto is often shorter), never forced into matching card heights or icon+heading+text sameness.
- **Footer**: solid black band, lime link for the FacilAgua credit.
- Floating WhatsApp assistant widget (`asistente-comite.tsx`) restyled to match: lime trigger button, thick dark borders, indigo header — but its internal chat-bubble behavior and logic were preserved, not rebuilt, since the form's job there is a functioning chat UI, not signage.

## Rules for future work on this surface

- Every field on this page is optional at the data layer (a new committee may have only a name and comuna); sections must keep degrading gracefully — do not assume `telefono`, tarifas, or avisos exist.
- Lime never sits under body text on white. If a new element needs lime, put it on indigo or black, or use it only as a background with dark text.
- Thick (`3px`) borders are this surface's depth system, standing in for shadows. Do not mix in soft drop-shadows — that would blend two depth languages.
- This surface's fonts and palette do not migrate to the panel or marketing site, and vice versa; each keeps its own committed world.
- Any new imagery must be authored in this world's own reduced, high-contrast grammar (thick stroke icons) rather than sourced as generic stock — no rural water committee photography exists yet, and none should be faked as real.

## Open items

- No real committee has published content through this design yet; only the test tenant "APR jose fleto" (Pucón, with placeholder copy) has been verified end-to-end.
- The `MANTENCION` and `NOTICIA` notice-type stylings were built and pass contrast checks but have not been visually inspected with real content (only `CORTE` was tested in the finish round).
- No user testing with actual older rural users has happened; legibility conclusions rest on WCAG contrast math and the product owner's domain knowledge, not observed behavior.
