# Design

<!-- impeccable:design-schema 1 -->

## Scope

This file documents **one surface only**: the public committee site (`src/components/sitio/*`, served at `apr-<slug>.facilagua.com`). It does not describe the admin panel (`src/components/panel/*`) or the marketing site (`src/components/site/*`), which keep their own pre-existing indigo-on-white, card-based visual language, untouched by this redesign.

## World

**Community bulletin, real-reference-led.** Built directly from a real Chilean APR site the user pointed to (Comité APR Caburgua — see `PRODUCT.md` § Evidence on Hand), not from an abstract concept exercise. Soft sky-blue hero section closed by a wave-shaped divider, a warm italic serif for the committee's welcome message, white content cards with soft shadows (not hard borders), indigo used as an accent (button, icons, links) rather than as a dominant page-scale block.

This is the **second** correction. The first attempt ("señalética vial rural" — solid indigo/lime/black blocks, thick borders, all-caps display type) was rejected on sight as looking amateurish. A first fix (this section's opening two paragraphs, originally) corrected palette and type to the sky-blue/italic-serif language described above, but kept the same generic **composition** — header, centered hero, a row of same-sized cards below — and the user called that "mejoró casi nada": the genericness was never the color, it was the skeleton. See "Composition" below for what changed to fix that.

## Composition

The page composition breaks the "stacked equal cards" template directly:

- **Asymmetric two-column hero** (`lg:grid-cols-[1.15fr_0.85fr]`): welcome copy + CTA on the left, an authored SVG illustration (`paisaje-rural.tsx` — flat-silhouette mountains and a lake, in the surface's own indigo/sky-blue palette) on the right. On mobile the illustration stacks above the text as a banner, not a block that pushes content down awkwardly.
- **Tarifas live inside the hero**, not as a separate card further down — confirmed with the user that cargo fijo / valor m³ are near-universally filled in by committees from day one, so they earn a place in the first viewport rather than waiting in a card a visitor may not scroll to.
- **Avisos, when present, are a full-width band** with its own light-gray background (`#fbfbfc`), not one more card in a row — this reads as an interruption/alert rather than "more content," which matches what a notice actually is. Absent most of the time (notices are sporadic), so the page must look complete without this band, and does.
- **Contacto is a horizontal data strip**, not a bordered square card — a third, distinct rhythm after the hero and the (conditional) avisos band, so the page never repeats the same container three times.
- Four sections, four different visual treatments (hero band / conditional alert band / plain data strip / footer band) — no two consecutive sections use the same card-shadow-border container, which is what makes the scroll feel composed rather than templated.

## Illustration

`src/components/sitio/paisaje-rural.tsx` — an authored flat-SVG landscape (layered mountain silhouettes, snow caps, a lake rendered in the surface's own indigo, a pale sun). Exists because the reference site's warmth comes largely from real committee photography, which FacilAgua does not have for any tenant yet; this illustration is the honest substitute — synthetic and clearly so, never pretending to be a real place — until real photos exist. Same component renders at every tenant regardless of comuna; it is deliberately generic-landscape rather than depicting a specific real location, since nothing in the data identifies actual local geography.

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

- **Header**: simple white bar, circular indigo-tinted icon badge, committee name + comuna.
- **Hero band**: sky-blue gradient, asymmetric two-column layout (see Composition), the WhatsApp CTA as a full pill button with a soft indigo drop shadow (`shadow-[0_8px_20px_-6px_rgba(54,7,242,0.45)]`) — depth communicated through shadow, not a border — and the tarifas duo below a thin divider line.
- **Wave divider**: an inline SVG path (`viewBox 1440×60`) closing the hero band into the content area below. This is the surface's other authored, non-generic motif alongside the landscape illustration — deliberately not a straight edge or a diagonal, both of which read as generic template dividers.
- **Avisos** (conditional): full-width band, own light-gray background, notice-type-tinted cards inside with soft 1px borders — see Composition for why this is a band and not a card-in-a-row.
- **Contacto**: horizontal data strip on plain white, wrapping flex row of icon+value pairs, `infoPago` as a short paragraph below a thin divider.
- **Footer**: flat off-white band, quiet.
- The floating WhatsApp assistant widget (`asistente-comite.tsx`) was left in its prior shadcn-default styling (rounded-full trigger, rounded-2xl panel, soft shadow) — it already matched this gentler register without needing changes, unlike the first redesign attempt which had forced it into thick borders.

## Rules for future work on this surface

- Every field on this page is optional at the data layer (a new committee may have only a name and comuna); sections must keep degrading gracefully — do not assume `telefono`, tarifas, or avisos exist.
- **Do not collapse back into a stack of same-shaped cards.** That was the second, more fundamental failure mode after the color/border one — restyling within a generic header→hero→card-row skeleton reads as "barely changed" no matter how good the palette is. Any future work on this page should keep varying container shape and rhythm between sections (band vs. strip vs. hero), not just their color.
- Depth on this surface comes from soft shadows and low-opacity tints, never from thick uniform borders — the specific failure mode of the first rejected attempt.
- The wave divider and the landscape illustration are this surface's two authored, non-generic motifs; do not replace either with a generic straight/diagonal divider or a stock icon.
- The italic warm serif is reserved for the committee's own welcome copy — do not extend it to labels, numbers, or UI chrome, or it stops feeling like an accent and starts feeling like a costume.
- Lime stays out of this surface unless there is a specific, considered reason to bring it back — see `PRODUCT.md`.
- Any new imagery must either be real (sourced from an actual committee, when that becomes available) or authored in the same flat-illustration grammar as `paisaje-rural.tsx` — do not fabricate stock-style "rural water committee" photography to fill space.

## Open items

- No real committee has published content through this design yet; only the test tenant "APR jose fleto" (Pucón, placeholder copy) has been verified end-to-end, desktop and mobile, with and without an active `CORTE` notice.
- The `MANTENCION` and `NOTICIA` notice-type stylings were built and pass contrast checks but were not visually inspected with real content in the finish round — only `CORTE` was.
- The reference site (Comité APR Caburgua) uses real photography extensively; this redesign intentionally does not, since FacilAgua has no real committee photos yet. If/when committees start uploading real photos, the hero's illustration slot is the natural place to swap in a real photo per committee — the layout was built with that substitution in mind.
