# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two distinct audiences on two different surfaces:

- **Panel administrativo** (`/panel`): the committee's board members (president, treasurer, secretary) and, for meter readings, a field operator role. They manage members, invoices, meter readings, and committee settings.
- **Sitio público del comité** (`apr-<slug>.facilagua.com`, one per committee): a member/neighbor of the rural water committee (APR/SSR), often an older adult, checking on their phone whether there's a water outage, what the current rate is, or how to reach the committee on WhatsApp. Occasional, task-driven visits, not a browsing session.

## Product Purpose

FacilAgua is a SaaS for Chilean rural potable water committees (APR/SSR — Agua Potable Rural / Servicio Sanitario Rural). It combines a WhatsApp AI bot that answers members' billing questions automatically ("how much do I owe") with an admin panel for the board to manage members, invoices, and payments. Each committee also gets a public website (this surface) that publishes their outage notices, rates, and contact info without anyone having to design or maintain a page.

## Positioning

Existing municipal/community-org tooling in this space is either nonexistent (committees run on paper and word of mouth) or generic SaaS built for urban businesses. FacilAgua is purpose-built for the rural APR/SSR structure and its real operating constraints: volunteer, often elderly board members; intermittent connectivity; WhatsApp as the only channel members actually use.

## Operating Context

- The public site is multi-tenant: one shared template renders every committee's page, populated from data the board enters in the panel (or dictates in a couple of sentences to an AI assistant that fills the fields for them — the board is not expected to write or format copy themselves).
- Visited overwhelmingly from a phone, often on a weak rural connection.
- Committees can publish outage/maintenance/news notices (`Aviso`: CORTE, MANTENCION, NOTICIA) that surface at the top of the page when active.
- A WhatsApp deep link is the primary action on the page — visitors are pushed to the bot/committee number for anything requiring a real answer (their balance, a specific complaint), since the public page never exposes personal account data.
- Available from the Estándar plan; gated below that in the admin panel.

## Capabilities and Constraints

- Content fields per committee: name, comuna/región, address, phone, email, free-text description, opening hours, cargo fijo (flat rate), valor m³ (per-cubic-meter rate), payment instructions (free text).
- No photo uploads or custom branding per committee today — the visual system is shared across all committees; only text content and the WhatsApp number vary.
- Must render correctly with any subset of fields filled in (most fields are optional; a new committee may have only a name and comuna).
- Must stay usable without JavaScript-dependent interactions being required to read the core information (outage status, rates, contact) — this is safety-relevant content (is there water or not).

## Brand Commitments

- Product name: FacilAgua (formerly ClickAgua — full rebrand completed).
- Primary color: indigo `#3607F2` (`oklch(0.454 0.289 272)`), already applied across the panel, auth screens, and marketing site.
- Secondary accent: a green ("forest" token) used for positive/success states.
- A lime `#C3F207` was evaluated as a possible complementary accent (verified as indigo's approximate complement) but has never been applied anywhere in the product yet — open for this redesign to use or reject.
- Logo: a cursive lowercase "f" mark (`src/components/marca/logo.tsx`), already used in the panel sidebar, auth screens, and marketing header.
- Existing marketing site (`src/components/site/*`) and admin panel (`src/components/panel/*`) already carry the indigo-primary, white-card, restrained visual language — not itself the subject of this redesign, but the wider system this surface still belongs to as a product.

## Evidence on Hand

- No real committee has published real content yet; "APR jose fleto" (Pucón) is the only test tenant, with placeholder copy.
- No photography, illustration, or committee-specific imagery exists. Any imagery this redesign wants must be authored (icons/illustration in the system's own grammar) rather than sourced as generic stock, since rural Chilean APR committees are a specific, non-generic subject.
- No user research or analytics on how members actually use this page yet — design decisions rely on the board members' domain knowledge (relayed through the product owner), not measured behavior.

## Product Principles

- Legibility for an older, non-technical rural audience outranks visual novelty — every design move must survive being read by someone with imperfect eyesight on a small phone screen in daylight.
- The page must earn institutional trust: a rural water committee is a civic body handling people's water and money, and the page should read as credible and serious, not as a generic startup landing page or a hobby project.
- Content stays boring and honest: no invented claims, testimonials, or data. Real fields either render or the section doesn't appear.
- The WhatsApp handoff is the page's one real conversion action; nothing should compete with or bury it.

## Accessibility & Inclusion

Primary audience skews older (many board members and site visitors are older adults in a rural setting). Text sizing, contrast, and tap targets must accommodate lower vision and less precise touch input; do not rely on hover-only affordances or fine motor precision.
