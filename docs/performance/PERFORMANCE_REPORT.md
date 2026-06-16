# Performance Report
**Date:** 2026-06-16  
**Method:** Production build output analysis (clean builds this session)

---

## Measured Bundle Sizes

### TradeDoc (chunks already split by Vite)
| Asset | Raw | Note |
|---|---|---|
| `index-*.js` (app) | 833 KB | main chunk |
| `html2canvas-*.js` | 199 KB | PDF screenshot — lazy-splittable |
| `index.es-*.js` (jsPDF) | 151 KB | PDF generation |
| `purify.es-*.js` | 25 KB | DOMPurify |
| **Total JS** | **~1.21 MB** (~357 KB gzip) | |

### AgriSMES (single chunk)
| Asset | Raw | Note |
|---|---|---|
| `index-*.js` | 1.20 MB | **single bundle, no route splitting** |
| `index-*.css` | 148 KB | |
| **Total JS** | **~1.20 MB** (~238 KB gzip) | |

> `@sentry/node` (added for backend observability) is **not** in either client bundle — it is imported only in `api/*.js`, which Vercel bundles separately as serverless functions. Verified.

---

## Duplicate Dependencies

| Check | Result |
|---|---|
| TradeDoc top-level dupes | None |
| AgriSMES top-level dupes | None |
| Cross-product React versions | ⚠️ TradeDoc on React **19.2.7**, AgriSMES on React **18.3.1** — not a per-app duplicate, but a monorepo inconsistency to track |

---

## Opportunities (ranked by value)

| # | Opportunity | Est. saving | Value | Implemented? |
|---|---|---|---|---|
| 1 | AgriSMES route-level code splitting (`React.lazy` per page) | ~50–80 KB initial gzip | Medium | ❌ deferred |
| 2 | AgriSMES: replace `framer-motion` (~40 KB) with CSS transitions | ~35 KB gzip | Medium | ❌ deferred |
| 3 | TradeDoc: lazy-load jsPDF + html2canvas (only on export) | ~95 KB gzip off initial | Medium | ❌ deferred |
| 4 | Align React versions across products | maintainability | Low | ❌ deferred |

---

## Decision: No premature optimization

Per the directive ("only implement improvements with measurable value / no premature optimization"), **no bundle changes were made.** Rationale:

- Both apps gzip to **238–357 KB** — within acceptable range for authenticated B2B tools that are not high-frequency cold-load consumer sites.
- The highest-value change (route splitting) carries refactor risk and should be done with real LCP/field data, not speculative.
- No duplicate packages inflate the bundle today.
- Changing bundling now adds risk to a release that is otherwise being stabilized — it does not reduce production risk, which is the stated objective.

**Recommendation:** Implement #1 (route splitting) for AgriSMES post-launch, measured against real Core Web Vitals from Vercel Speed Insights (already wired in `main.tsx`).
