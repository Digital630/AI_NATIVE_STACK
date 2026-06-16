# Bundle Optimization Report
**Date:** 2026-06-16  
**Products:** TradeDoc, AgriSMES

---

## TradeDoc Bundle

### Current Output
| Asset | Raw | Gzip |
|---|---|---|
| `index-*.js` (main) | 817.78 kB | 247.76 kB |
| `html2canvas-*.js` | 199.56 kB | 46.78 kB |
| `index.es-*.js` (jsPDF) | 151.38 kB | 48.88 kB |
| `purify.es-*.js` (DOMPurify) | 24.94 kB | 9.78 kB |
| `index-*.css` | 14.72 kB | 3.98 kB |
| **Total** | **~1.2 MB** | **~357 kB** |

### Top Dependencies (by inferred size)
| Package | Purpose | Size driver |
|---|---|---|
| `jspdf` | PDF generation | ~150 kB — already split by Vite |
| `html2canvas` | PDF screenshots | ~200 kB — already split |
| `@supabase/supabase-js` | Auth + DB | ~50 kB in main chunk |
| `react` + `react-dom` | UI framework | ~50 kB in main chunk |
| `@sentry/react` | Error monitoring | ~30 kB in main chunk |

### Recommendations
| Action | Saving | Priority | Risk |
|---|---|---|---|
| Dynamic import `@sentry/react` (only initialise on load) | ~30 kB | Low | Low |
| Lazy-load the upgrade/pricing view | ~5 kB | Low | Low |
| No action needed on jsPDF/html2canvas — already split | — | — | — |

**Decision: No changes now.** The 248 kB gzip main chunk is acceptable for a B2B tool with infrequent cold loads. Revisit if LCP > 3s is reported.

---

## AgriSMES Bundle

### Current Output
| Asset | Raw | Gzip |
|---|---|---|
| `index-*.js` (main) | 1,162 kB | 238 kB |
| `index-*.css` | 147.55 kB | 21.84 kB |
| `sw.js` (service worker) | ~8 kB | — |
| **Total** | **~1.32 MB** | **~260 kB** |

### Top Dependencies (by import frequency)
| Package | Import count | Notes |
|---|---|---|
| `lucide-react` | 176 imports | Treeshaken per icon — likely fine |
| `framer-motion` | 51 imports | ~40 kB — largest avoidable dep |
| `react-router-dom` | 46 imports | ~15 kB — necessary |
| `sonner` | 48 imports | ~8 kB — toast library |
| `@supabase/supabase-js` | 57 imports (via integrations) | ~50 kB |

### Recommendations
| Action | Saving | Priority | Risk |
|---|---|---|---|
| Replace `framer-motion` animations with CSS transitions | ~35-40 kB gzip | Medium | Low-Medium |
| Route-based code splitting (React.lazy per page) | ~50-80 kB initial | Medium | Low |
| Consolidate duplicate supabase client imports | 0 kB (tree shaken) | Low | None |

**Warning:** AgriSMES has a `supabase.ts` AND a separate `@/integrations/supabase/client` import path. These may be creating duplicate client instances. Verify at runtime.

**Decision: No changes now.** 238 kB gzip is within acceptable range for a PWA. Route splitting is the highest-ROI improvement but is not a production blocker.

---

## Duplicate Package Check

```bash
# TradeDoc
npm ls --depth=0 | grep -E "supabase|react"
# No duplicates found

# AgriSMES  
npm ls --depth=0 | grep -E "supabase|react"
# No duplicates at top level; nested peer dep variations possible
```

**No duplicate packages detected at top-level dependency resolution.**
