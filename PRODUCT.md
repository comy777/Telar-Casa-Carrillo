# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + React + TypeScript + Tailwind CSS, in npm workspaces: `apps/storefront` (public store, :3000) and `apps/admin` (private panel, :3002), sharing `packages/ui` and `packages/api-client`. Decided by the user's project brief; see `docs/frontend-plan.md`. Backend is the separate repo `Telar-Casa-Carrillo-Backend` (NestJS REST API, PostgreSQL, Wompi, Cloudinary).

## Users

- **Primary:** Colombians in Colombia buying woven pieces for themselves or as gifts. They pay in COP and receive national shipping. Spanish only.
- **Secondary (admin):** the Carrillo family workshop, running the catalog, inventory, orders, shipments and content from the private panel.

## Product Purpose

Online store for Telar Casa Carrillo, a family weaving workshop that sells its own pieces. Customers discover the pieces and the people who weave them, buy online and follow their orders. All catalog, prices, images, customers and orders come from the backend; nothing of the business is hard-coded.

Success: customers buy with confidence, understand the piece was hand-woven by a named person, and the family manages the whole store without a developer.

## Positioning

A single family workshop selling what it weaves itself, not a reseller or marketplace of anonymous crafts. Each piece can be traced to the person in the family who made it (artisan profiles exist in the data model).

## Operating Context

- Products: **ruanas and garments** (ruanas, chales, ponchos and similar) and **hamacas**. Woven on looms (telar).
- Market: Colombia only for now; prices include IVA; payments via Wompi (cards, PSE, Nequi); national carriers with manual tracking.
- Legal: Ley 1581 (personal data) and Ley 1480 (consumer protection, right of withdrawal) pages are required in the storefront.

## Capabilities and Constraints

- Backend already provides catalog (search, filters, variants with `compareAtPrice`), cart, checkout, payments, orders, tracking, accounts, privacy, admin and metrics.
- Not yet in the backend: content (banners, testimonials, FAQ, pages, newsletter, store settings), contact, public best-sellers, related products, techniques, profile editing. See `docs/frontend-plan.md` §1.
- Undecided: final domain name; whether to sell internationally later.

## Brand Commitments

- Name: **Telar Casa Carrillo**.
- A logo exists and must be respected once provided (not yet in the repo).
- Voice: Spanish (Colombia), warm and direct, family-run.

## Evidence on Hand

The workshop has a logo, real product photos, photos of the weavers and the workshop, and a written brand history, but **none are in the repo yet**. Until they arrive, designs use clearly marked placeholders. Do not invent testimonials, history, people, awards, sales figures or claims.

## Product Principles

1. The person behind the piece is part of the product: show who wove it and how.
2. The data is the truth: the storefront shows what the backend says (price, stock, status) and never computes business rules.
3. Trust before the sale: clear prices with IVA, shipping, returns and data policies at hand.
4. The family can run it alone: every piece of content is editable from the admin.

## Accessibility & Inclusion

WCAG 2.2 AA. Mobile-first: most Colombian shoppers browse on phones, often on mid-range Android devices and mobile data.
