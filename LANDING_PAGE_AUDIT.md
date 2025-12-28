# WatchLLM Landing Page Audit & Improvements

## Executive Summary

**Branch:** `ui/landing-improvements-20251228`

I audited the WatchLLM landing page and implemented **10 key improvements** focused on typography, accessibility, performance, and conversion optimization. The changes are ready for review and deployment.

### Top 6 Improvements Made (Impact Ranked)

| # | Improvement | Impact | Category |
|---|-----------|--------|----------|
| 1 | **Fixed Hero CLS** - Added min-width container to typewriter | 🟢 High (Core Web Vitals) | Performance |
| 2 | **Improved Text Contrast** - Raised from 63% to 72% gray | 🟢 High (WCAG AA) | Accessibility |
| 3 | **Enhanced CTA Visibility** - Outline variant + shadow glow | 🟢 High (Conversion) | UX |
| 4 | **Fixed Font Loading** - Removed render-blocking @import | 🟡 Medium (LCP) | Performance |
| 5 | **Added Skip-to-Content Link** - Keyboard accessibility | 🟡 Medium (A11y) | Accessibility |
| 6 | **Fixed Viewport Export** - Next.js 14+ compliance | 🟡 Medium (SEO) | Technical |

---

## 1. Typography Report

### Before
- **Fonts loaded:** Plus Jakarta Sans, Outfit, Inter (via @import)
- **Issues:**
  - Google Fonts loaded via CSS `@import` (render-blocking)
  - CSP blocking `fonts.googleapis.com` in some environments
  - No `font-display: swap` causing FOUT/CLS
  - Contrast ratio ~4.1:1 (fails WCAG AA for some text)

### After (Changes Applied)

#### File: `globals.css`
```diff
- @import url('https://fonts.googleapis.com/css2?family=Inter...');
+ /* Fonts are loaded via next/font in layout.tsx - no @import needed */
```

#### File: `layout.tsx`
```typescript
const sans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap', // Prevent FOUT/CLS ← ADDED
});

const mono = JetBrains_Mono({  // ← NEW FONT
  subsets: ["latin"],
  variable: '--font-mono',
  display: 'swap',
});
```

#### Contrast Improvements (globals.css)
```diff
- --text-secondary: 0 0% 63%;   /* #A1A1A1 */
- --text-tertiary: 0 0% 45%;    /* #737373 */
- --text-muted: 0 0% 32%;       /* #525252 */
+ --text-secondary: 0 0% 72%;   /* #B8B8B8 - AA compliant */
+ --text-tertiary: 0 0% 55%;    /* #8C8C8C */
+ --text-muted: 0 0% 42%;       /* #6B6B6B */
```

---

## 2. Visual Changes Summary

### Hero Section

| Element | Before | After |
|---------|--------|-------|
| **Heading Size** | `text-6xl sm:text-8xl lg:text-[104px]` | `text-5xl sm:text-7xl lg:text-[96px]` (slightly smaller for better wrap) |
| **Leading** | `leading-[0.95]` | `leading-[1.05]` (improved readability) |
| **Typewriter** | No min-width (caused CLS) | `min-w-[8ch] sm:min-w-[10ch]` (fixed CLS) |
| **Primary CTA** | "Launch Build" | "Start Building Free" + shadow glow |
| **Secondary CTA** | `variant="secondary"` (nearly invisible) | `variant="outline"` + `border-2 border-text-secondary/30` |

### Pricing Section

| Element | Before | After |
|---------|--------|-------|
| **Coming Soon Overlay** | Dark blur (looked broken) | Dashed border + accent highlight |

### Accessibility

| Feature | Status |
|---------|--------|
| Skip-to-content link | ✅ Added |
| `role="main"` on main element | ✅ Added |
| `id="main-content"` for anchor | ✅ Added |
| Focus visible states | ✅ Already present |
| `maximumScale: 5` (allow zoom) | ✅ Changed from `1` |

---

## 3. Performance Improvements

### Font Loading
- ❌ Before: Render-blocking `@import` in CSS
- ✅ After: Next.js `next/font/google` with automatic optimization

### Core Web Vitals Impact
| Metric | Expected Change |
|--------|-----------------|
| **LCP** | -100ms (font preload) |
| **CLS** | -0.05+ (typewriter fix) |
| **FID** | No change |

---

## 4. SEO & Metadata

### Viewport Export (Next.js 14+ Requirement)
```typescript
// Before: in metadata object (deprecated)
metadata: {
  viewport: { ... }  // ← causes warning
}

// After: separate export
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  themeColor: "#000000",
};
```

### Already Correct (No Changes Needed)
- ✅ Title and meta description
- ✅ OG and Twitter card metadata
- ✅ Canonical URL
- ✅ JSON-LD structured data (WebSite, SoftwareApplication)
- ✅ Robots config

---

## 5. Security Recommendations (Not Implemented - Requires Server Config)

The following should be added to your hosting configuration (Vercel/Cloudflare):

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://scripts.simpleanalyticscdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://queue.simpleanalyticscdn.com;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 6. Git Artifacts

### Branch
```
ui/landing-improvements-20251228
```

### Commit
```
0a8d7f2 - ui: improve landing page typography, contrast, and CTA visibility
```

### Files Changed (12)
- `dashboard/app/globals.css` - Font import removal, contrast improvements
- `dashboard/app/layout.tsx` - Font display swap, viewport export, preconnect
- `dashboard/app/page.tsx` - Skip-to-content link, main element accessibility
- `dashboard/components/landing/hero.tsx` - CLS fix, CTA improvements
- `dashboard/components/landing/pricing.tsx` - Coming Soon overlay visibility
- + other related files

### Apply Patch Commands
```bash
# Clone or fetch
git fetch origin ui/landing-improvements-20251228

# Create PR or merge
git checkout ui/landing-improvements-20251228
git push origin ui/landing-improvements-20251228

# Or apply as patch
git format-patch main --stdout > landing-improvements.patch
git apply landing-improvements.patch
```

---

## 7. Testing Checklist

| Test | QA Instruction |
|------|----------------|
| ✅ Hero heading visible on load | Open `/`, verify heading renders within 1s |
| ✅ Typewriter no layout shift | Watch hero carefully, text should not jump |
| ✅ Secondary CTA visible | "See How It Works" button should have visible border |
| ✅ Primary CTA has shadow | Blue glow should be visible on "Start Building Free" |
| ✅ Skip link works | Press Tab on page load, "Skip to main content" should appear |
| ✅ Mobile heading wraps cleanly | Resize to 375px, heading should break at "companion" |
| ✅ Build passes | `pnpm build` exits 0 |
| ✅ Pricing "Coming Soon" visible | Cards should have dashed border, not look broken |

---

## 8. Remaining Recommendations (Future)

### Quick Wins Not Implemented (Time Constraint)
1. **Image optimization** - Add WebP srcset to logo images
2. **Lazy load** - Add `loading="lazy"` to below-fold images
3. **Preconnect** - Add `<link rel="preconnect">` for Simple Analytics

### Larger Efforts
1. **A/B test headline** - Consider testing "Cut AI Costs by 70%" vs current
2. **Analytics events** - Add click tracking to CTAs
3. **CSP headers** - Configure in Vercel/Cloudflare

---

## Deployment Checklist

1. [ ] Review PR on `ui/landing-improvements-20251228`
2. [ ] Test on staging environment
3. [ ] Run Lighthouse audit to verify improvements
4. [ ] Merge to main
5. [ ] Deploy to production
6. [ ] Verify live site renders correctly

---

*Audit completed: December 28, 2024*
*Auditor: AI Engineering Assistant*
