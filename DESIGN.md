# Design

<!-- impeccable:design-schema 1 -->

## Scope

This file documents **one surface only**: the public committee site (`src/components/sitio/*`, served at `apr-<slug>.facilagua.com`). It does not describe the admin panel (`src/components/panel/*`), which keeps its own pre-existing card-based visual language.

## World

**Inherited from the product's own marketing site.** This is the *third* pass at this surface, and the first two both failed by inventing a visual world from scratch instead of using one FacilAgua already has:

1. **First attempt** — "señalética vial rural" (solid indigo/lime/black blocks, thick borders, all-caps display type). Rejected on sight: "malísimo, se ve como hecho por un niño de básica."
2. **Second attempt** — corrected palette/type to a soft sky-blue + italic-serif language modeled on a real Chilean APR site (Comité APR Caburgua) the user pointed to, then a follow-up pass broke the generic header→hero→card-row composition into an asymmetric hero with an authored landscape illustration. The user's verdict: "muy básico, sin vida ni estilo ni nada" — still not it.
3. **This attempt** — the user redirected explicitly: *"inspírate en la landing del software en sí"* (`src/components/site/*`). That landing already has a mature, working visual identity — a mono-uppercase eyebrow badge before every section heading, monospace/tabular-nums for every number and amount, thin `rounded-2xl` borders (never thick), real objects dramatized instead of invented illustration (the landing's own invoice-section renders an actual bill with a header band, dashed item rows, and a barcode), `bg-muted/40` alternating section backgrounds instead of gradients. This surface now **inherits that system directly** rather than establishing a third identity. The committee's public site should read as unmistakably the same product as the marketing site — because a member who has seen FacilAgua's landing anywhere should recognize it here.

No more invented worlds for this surface unless the user explicitly asks for one again. If it still reads as flat, the fix is to look more like `src/components/site/*`, not to invent a fourth aesthetic.

## Palette & Type

Exactly the product's existing tokens — nothing new was introduced for this surface:

- `--primary` (indigo `#3607F2`) for the eyebrow badges, CTA button, icons, links.
- `--forest` for the "servicio normal" status badge; `--destructive` for the "corte de agua" status badge and CORTE notice tint.
- `--tertiary` / `--tertiary-foreground` for MANTENCION notices, matching the landing's features-section icon tone exactly.
- `--foreground` / `--background` (near-black bill header, white cards) — same as the landing's invoice section.
- `--muted/40` for alternating section backgrounds (avisos band, contacto band).
- Type: the product's existing Geist sans stack, plus `font-mono` (Geist Mono, already a global token) for every eyebrow label and every number/amount — exactly how the landing treats monospace, never introduced as a "technical" costume.
- No lime, no italic serif, no illustration, no gradient. All three were tried on this surface across the first two attempts and none survived.

## Structure

Mirrors the landing's own section rhythm and devices directly:

- **Header**: white bar, small indigo-tinted icon badge, committee name + comuna — unchanged in shape since the first version, just restyled to match tokens.
- **Hero**: centered, matching the landing's `Hero.tsx` — a rounded-full status badge (mono, uppercase, colored by whether a CORTE notice is active) above an `<h1>`, a description paragraph, then the WhatsApp CTA as a full pill button. No illustration, no asymmetric grid; the landing's own hero is centered and this one now matches it.
- **Avisos** (conditional): a `bg-muted/40` band with an eyebrow + heading, then a card grid — each notice card carries a small tinted icon square (`bg-{color}/12` exactly like `FeaturesSection`'s icon treatment), a mono uppercase type label, title, and body. Absent most of the time; the page must look complete without it, and does.
- **Tarifas**: two-column section (`0.85fr / 1.15fr`) pairing a short pitch on the left with an actual bill-styled card on the right — a near-black header band with the committee's mark and name, then cargo fijo / valor m³ as dashed-divider rows with mono tabular amounts. This is a direct reuse of the landing's `InvoiceSection` device (real object, dramatized), not a generic pricing card.
- **Contacto**: a `bg-muted/40` band with an eyebrow + heading, then a grid of small bordered cards (icon, then value) — one card per available field (dirección, teléfono, email, horario). Plain, quiet, matches the landing's `FeaturesSection` card shape at a smaller scale.
- **Footer**: matches the landing's `Footer.tsx` exactly in structure — logo mark + committee name on the left, copyright + "Sitio creado con FacilAgua" on the right.
- The floating WhatsApp assistant widget (`asistente-comite.tsx`) keeps its prior shadcn-default styling (rounded-full trigger, rounded-2xl panel) — already consistent with this system, no changes needed.

## Known layout constraint

The floating assistant button (`fixed right-5 bottom-5`) can overlap full-bleed dark content (the bill card in Tarifas) on mobile mid-scroll, not just at the page's end. The Tarifas section carries `pr-20` on mobile (`lg:pr-7` cancels it on desktop, where the bill no longer spans full width) to keep the bill's right edge clear of the button. Any future full-width, solid-background element on this page should check this same overlap before shipping — padding at the bottom of `<main>` only protects the final viewport, not scroll position mid-page.

## Rules for future work on this surface

- **Do not invent a new visual world here again.** This is the third correction; the fix that finally worked was stopping invention and inheriting `src/components/site/*` directly. Any future work should extend that system (new landing sections, new landing components) rather than restyle this page independently.
- Depth comes from thin borders + soft shadows (`shadow-lg` on the bill card), never thick uniform borders — the specific failure of the first attempt.
- Numbers and identifiers are always `font-mono tabular-nums`, matching the landing's amount/ID treatment everywhere (boleta section, features, KPIs across the product).
- Section eyebrows are always `font-mono text-[0.72rem] font-semibold tracking-[0.09em] text-primary uppercase` — copy this class combination verbatim from the landing rather than approximating it.
- Every field on this page is optional at the data layer (a new committee may have only a name and comuna); sections must keep degrading gracefully.
- If a section starts to look flat, look at how the landing solves the equivalent problem before inventing a new device.

## Open items

- No real committee has published content through this design yet; only the test tenant "APR jose fleto" (Pucón, placeholder copy) has been verified end-to-end, desktop and mobile, with and without an active `CORTE` notice.
- The `MANTENCION` and `NOTICIA` notice-type stylings pass contrast checks but were not visually inspected with real content in the finish round — only `CORTE` was.
- If the landing's own visual system evolves (new section patterns, new tokens), this surface should be revisited to stay in sync — it is explicitly meant to trail the landing, not diverge from it.
