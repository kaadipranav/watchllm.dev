# WatchLLM UI Design Specification

## Design Philosophy

**Core Principle**: Minimalist precision with intricate micro-interactions. Every pixel serves a purpose. Information density without cognitive overload.

**Inspiration Sources**:
- **Vercel**: Clean gradients, subtle shadows, confident typography
- **Linear**: Fluid animations, command-driven UX, keyboard-first
- **JetBrains**: Technical sophistication, monospace accents, data visualization
- **Dovetail**: Soft color palettes, generous whitespace, narrative hierarchy

---

## 1. Design System Foundation

### Color Palette

```
Primary Colors:
- Background: #0A0A0A (near-black)
- Surface: #111111 
- Surface Elevated: #1A1A1A
- Border Subtle: #222222
- Border Default: #2A2A2A
- Border Hover: #333333

Accent Colors:
- Primary: #3B82F6 (blue)
- Primary Hover: #2563EB
- Success: #10B981 (green)
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)
- Purple Accent: #A855F7

Text Colors:
- Primary: #FAFAFA (near-white)
- Secondary: #A1A1A1
- Tertiary: #737373
- Muted: #525252

Semantic Colors (Cache):
- Cache Hit: #10B981 with 10% opacity background
- Cache Miss: #EF4444 with 10% opacity background
- Cache Partial: #F59E0B with 10% opacity background
```

### Typography

```
Font Stack:
- Primary: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Monospace: 'JetBrains Mono', 'Fira Code', Consolas, monospace
- Display: Inter with -0.03em letter-spacing

Scale:
- Hero: 72px / 900 weight / -0.04em
- H1: 48px / 700 weight / -0.03em
- H2: 32px / 600 weight / -0.02em
- H3: 24px / 600 weight / -0.01em
- Body Large: 16px / 400 weight / -0.01em
- Body: 14px / 400 weight / 0em
- Caption: 12px / 400 weight / 0.01em
- Code: 13px / 400 weight (monospace)
```

### Spacing System

```
Base unit: 4px

Scale:
- 0: 0px
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 8: 32px
- 10: 40px
- 12: 48px
- 16: 64px
- 20: 80px
- 24: 96px
- 32: 128px
```

### Border Radius

```
- xs: 4px (buttons, small cards)
- sm: 6px (inputs, badges)
- md: 8px (cards, modals)
- lg: 12px (large cards)
- xl: 16px (hero sections)
- full: 9999px (pills, avatars)
```

### Shadows & Effects

```
Shadow Subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.5)
Shadow Small: 0 2px 8px 0 rgba(0, 0, 0, 0.6)
Shadow Medium: 0 4px 16px 0 rgba(0, 0, 0, 0.7)
Shadow Large: 0 8px 32px 0 rgba(0, 0, 0, 0.8)

Glow Primary: 0 0 24px rgba(59, 130, 246, 0.4)
Glow Success: 0 0 24px rgba(16, 185, 129, 0.4)

Backdrop Blur: blur(12px) with rgba(10, 10, 10, 0.8)
```

---

## 2. Component Library

### Navigation Bar

```
Structure:
├─ Logo (left) - 32px height, no wordmark on mobile
├─ Primary Nav (center-left)
│  ├─ Features (with dropdown indicator)
│  ├─ Pricing
│  └─ Docs
├─ Spacer
└─ Actions (right)
   ├─ Sign In (ghost button)
   └─ Get Started (primary button)

Behavior:
- Fixed position, backdrop blur
- 64px height on desktop, 56px mobile
- Gentle fade-in on scroll (0-50px range)
- Active nav item: underline with 2px blue indicator
- Logo on hover: subtle scale 1.05 transform
```

### Buttons

```css
Primary Button:
- Background: linear-gradient(135deg, #3B82F6, #2563EB)
- Padding: 12px 24px
- Border radius: 6px
- Font: 14px / 500 weight
- Hover: scale(1.02) + brightness(1.1)
- Active: scale(0.98)
- Transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1)
- Add subtle glow on hover

Secondary Button:
- Background: transparent
- Border: 1px solid #2A2A2A
- Same padding & radius as primary
- Hover: border-color #3B82F6, background rgba(59, 130, 246, 0.1)

Ghost Button:
- Background: transparent
- No border
- Padding: 8px 16px
- Hover: background rgba(255, 255, 255, 0.05)

Icon Button:
- 32px × 32px square
- Center icon
- Border radius: 6px
- Hover: background rgba(255, 255, 255, 0.08)
```

### Cards

```
Base Card:
- Background: #111111
- Border: 1px solid #222222
- Border radius: 12px
- Padding: 24px
- Hover: border-color #333333, transform translateY(-2px)
- Transition: 200ms ease

Feature Card (enhanced):
- Add gradient border on hover using ::before pseudo-element
- Gradient: linear-gradient(135deg, #3B82F6, #A855F7)
- Border width: 1px
- Inner content maintains dark background

Stat Card:
- Compact padding: 20px
- Monospace numbers
- Include sparkline or micro-chart
- Animated count-up on view
```

### Input Fields

```
Text Input:
- Height: 40px
- Background: #0A0A0A
- Border: 1px solid #2A2A2A
- Border radius: 6px
- Padding: 0 16px
- Font: 14px
- Placeholder: #525252
- Focus: border-color #3B82F6, box-shadow 0 0 0 3px rgba(59, 130, 246, 0.1)
- Error state: border-color #EF4444

Code Input (API keys):
- Font: JetBrains Mono 13px
- Background: #000000
- Include copy button on right (icon button)
- Masked by default with "show" toggle
```

### Badges & Pills

```
Badge:
- Inline-flex align-items center
- Padding: 2px 8px
- Border radius: 4px
- Font: 11px / 500 weight / uppercase / 0.05em letter-spacing
- Variants: neutral, primary, success, warning, error

Status Pill (Live indicators):
- Height: 24px
- Padding: 4px 12px
- Include pulsing dot (6px) on left
- Pulse animation: 2s infinite ease-in-out
- Examples: "Live", "Beta", "New"
```

### Data Visualization Components

```
Stat Counter (Requests/s, Savings):
- Large monospace number (32px)
- Small label below (12px, muted)
- Animated counting effect
- Suffix units (K, M, %, /s) in different color
- Trend indicator: small arrow + percentage change

Progress Bar:
- Height: 4px
- Background: #1A1A1A
- Fill: gradient based on value
  - Low: #EF4444
  - Medium: #F59E0B
  - High: #10B981
- Animated fill on load
- Include percentage label on hover

Mini Chart (sparkline):
- 80px wide × 32px tall
- Single color line (#3B82F6)
- No axes or labels
- Stroke width: 2px
- Subtle glow on line
- Animate path on mount
```

---

## 3. Page-Specific Layouts

### Hero Section

```
Structure:
- Full viewport height (min 600px)
- Centered content, max-width 1200px
- Gradient background: radial-gradient at top center
  - Center: rgba(59, 130, 246, 0.15)
  - Edge: transparent
  - Size: 800px circle

Headline:
- 72px font size (48px mobile)
- "Real-time LLM intelligence" 
- Gradient text effect: linear-gradient(90deg, #FAFAFA, #A1A1A1)
- Stagger animation: each word fades up 100ms apart

Subheadline:
- 20px font size, line-height 1.6
- Max-width 600px
- Muted color #A1A1A1
- Fade in 200ms after headline

CTA Section:
- Two-button layout: Primary + Secondary
- Stack on mobile
- Small caption below: "No credit card • OpenAI-compatible"
- Icons: checkmark + code brackets

Live Stats Ticker:
- Positioned below CTA (margin-top 48px)
- 3-4 stats in horizontal row
- Real-time updating numbers
- Grid layout, responsive stack on mobile
```

### Dashboard Preview (Hero)

```
Floating Dashboard:
- Width: 100% of container, max 1200px
- Aspect ratio: 16:9
- Position: relative, margin-top 80px
- Add perspective: 1200px for 3D effect
- Gentle rotation: rotateX(5deg) rotateY(0deg)

Visual Treatment:
- Screenshot/illustration of dashboard
- Border: 1px solid #333333
- Border radius: 16px
- Box shadow: Large + glow
- Ambient light effect: subtle gradient overlay from top
- Backdrop blur on edges

Animated Elements:
- Fade in scale from 0.95 to 1
- Parallax on scroll (moves slower than page)
- Floating animation: subtle Y-axis movement 20px, 6s infinite ease-in-out
```

### Features Section

```
Layout:
- Two-column grid on desktop (1fr 1fr)
- Single column on mobile
- Gap: 32px
- Padding: 120px vertical

Feature Item:
- Icon (32px) in colored circle background
- Title (24px, semibold)
- Description (16px, secondary color, line-height 1.6)
- Optional: small metric or proof point
- Stagger animation on scroll: each item 100ms delay

Icon Treatment:
- Background: gradient based on feature
  - Caching: blue gradient
  - Security: purple gradient
  - Speed: green gradient
- Icon color: white
- Size: 48px circle
- Subtle pulse animation
```

### "How It Works" Section

```
Layout: 
- Horizontal stepped timeline on desktop
- Vertical on mobile
- 3 steps connected by animated line
- Line animates on scroll (stroke-dasharray)

Step Component:
- Number badge (48px circle, gradient border)
- Title (20px, semibold)
- Description (14px, max-width 300px)
- Optional code snippet below
- Icon representing the step

Code Snippet:
- Inline code block, 300px wide
- Dark background (#000000)
- Syntax highlighting
- Copy button on hover
- Line numbers on left (muted)
```

### Pricing Section

```
Layout:
- 3 cards in row (stack on mobile)
- Center card elevated: scale(1.05), z-index higher
- "Most Popular" badge on center card

Pricing Card:
- Background: #111111
- Border: 1px solid #222222
- Border radius: 12px
- Padding: 32px
- Hover: border gradient animation

Header:
- Plan name (16px, uppercase, 0.1em letter-spacing)
- Price (48px, monospace, gradient text)
- Billing period (14px, muted)

Features List:
- Checkmark icon (green)
- Feature text (14px)
- Muted items for unavailable features
- Spacing: 12px between items

CTA Button:
- Full width
- Primary style for popular plan
- Secondary for others
- "Coming Soon" badge for unavailable
```

### Analytics Dashboard (App)

```
Layout:
- Sidebar navigation (256px fixed)
- Main content area (flex-1)
- Top bar (64px height) with:
  - Breadcrumbs
  - Date range picker
  - User menu

Sidebar:
- Logo at top
- Nav items with icons
- Active state: blue indicator bar on left (3px wide)
- Hover: background rgba(255, 255, 255, 0.05)
- Collapse on mobile (hamburger menu)

Main Grid:
- 12-column grid system
- Gap: 24px
- Responsive breakpoints

Widget Types:
1. Stat Card (3 columns each)
   - Large number
   - Trend indicator
   - Mini chart

2. Chart Card (6-12 columns)
   - Title bar with actions (fullscreen, export)
   - Chart area (use Recharts or similar)
   - Legend below

3. Request Log (12 columns)
   - Table with virtual scrolling
   - Columns: Time, Endpoint, Status, Latency, Cost, Cache Hit
   - Sortable headers
   - Row hover highlight
   - Monospace for technical values

4. Cache Hit Rate Ring
   - Donut chart (4 columns)
   - Center: percentage (48px)
   - Legend on right
   - Animated arc on load
```

---

## 4. Animations & Transitions

### Page Load

```
Sequence:
1. Fade in background (0-200ms)
2. Nav slides down (100-300ms, easeOut)
3. Hero content staggers up (200-600ms)
   - Headline words: 100ms stagger
   - Subtext: +100ms
   - Buttons: +100ms
4. Dashboard preview: scale + fade (400-800ms)
```

### Scroll Animations

```
Use Intersection Observer for:
- Fade up + scale for cards/sections
- Stagger children with 100ms delay
- Trigger once, 10% threshold
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

Parallax Elements:
- Hero background: 0.5x speed
- Dashboard preview: 0.8x speed
- Section backgrounds: 0.3x speed
```

### Micro-interactions

```
Button Hover:
- Transform: scale(1.02)
- Brightness: 110%
- Glow increase
- Duration: 150ms
- Easing: easeOut

Card Hover:
- Transform: translateY(-4px)
- Border color shift
- Shadow increase
- Duration: 200ms
- Easing: easeOut

Link Hover:
- Color shift to primary
- Underline slides in from left
- Duration: 150ms

Stat Counter:
- Count-up animation on viewport enter
- Duration: 1500ms
- Easing: easeOut
- Format: toLocaleString()

Loading States:
- Skeleton screens (pulse animation)
- Shimmer effect: linear-gradient moving left to right
- Color: rgba(255, 255, 255, 0.05)
```

### Command Menu (Linear-inspired)

```
Trigger: Cmd+K (Mac) or Ctrl+K (Windows)

Modal:
- Width: 600px
- Max-height: 400px
- Centered
- Backdrop: blur(12px) + rgba(0, 0, 0, 0.8)
- Border: 1px gradient
- Border radius: 12px

Search Input:
- Large (48px height)
- Icon on left
- Placeholder: "Search or jump to..."
- Auto-focus on open
- Clear button on right

Results:
- Grouped by category
- Keyboard navigation (arrow keys)
- Selected state: blue background
- Icons on left, keyboard shortcut on right
- Max 8 results, scroll if more

Animation:
- Scale from 0.95 to 1
- Fade in 150ms
- Results stagger 50ms
```

---

## 5. Responsive Breakpoints

```
xs: 0-639px (mobile)
sm: 640-767px (large mobile)
md: 768-1023px (tablet)
lg: 1024-1279px (small desktop)
xl: 1280-1535px (desktop)
2xl: 1536px+ (large desktop)

Key Adaptations:

Mobile (xs, sm):
- Stack all grids to single column
- Reduce font sizes by 20%
- Hero: 48px headline, centered
- Nav: hamburger menu, full-screen overlay
- Buttons: full width
- Padding: 16px horizontal, 48px vertical
- Dashboard preview: remove 3D transform

Tablet (md):
- 2-column grid for features
- Pricing cards: 2 up, 1 below
- Nav: keep visible
- Reduce spacing by 25%

Desktop (lg+):
- Full layout as designed
- Max content width: 1400px
- Centered with auto margins
```

---

## 6. Code Examples & Developer Experience

### API Integration Block

```
Visual:
- Dark code editor appearance
- Line numbers (muted)
- Syntax highlighting (VSCode dark+ theme colors)
- Copy button (top right, icon button)
- Language badge (top left, small pill)

Example:
```typescript
const client = new WatchLLM({
  apiKey: process.env.WATCHLLM_KEY,
  baseURL: "https://api.watchllm.com/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello!" }],
});
```

Features:
- Tab system for multiple languages
- Expandable for more complex examples
- "Try in playground" CTA button below
```

### Terminal Command Display

```
Visual:
- Monospace font
- Black background
- Green text for commands
- Gray text for comments
- Prompt: $ symbol

Example:
$ npm install watchllm
$ export WATCHLLM_KEY=your_key_here
$ # Start caching immediately

Features:
- Copy entire command with one click
- Animated typing effect on first view
```

---

## 7. Accessibility Requirements

```
WCAG 2.1 AA Compliance:

Color Contrast:
- Text/background: minimum 4.5:1
- Large text: minimum 3:1
- UI components: minimum 3:1

Keyboard Navigation:
- All interactive elements focusable
- Focus indicator: 2px blue outline, 4px offset
- Skip to main content link
- Arrow key navigation in menus/lists
- Escape to close modals

Screen Readers:
- Semantic HTML5 elements
- ARIA labels on icon buttons
- ARIA-live regions for dynamic content
- Alt text on all images
- Hidden text for context where needed

Motion:
- Respect prefers-reduced-motion
- Disable animations if set
- Keep essential feedback (no decorative)

Interactive States:
- Hover
- Focus
- Active
- Disabled (50% opacity, cursor: not-allowed)
- Loading (spinner + disabled)
```

---

## 8. Performance Optimization

```
Images:
- Use WebP with PNG fallback
- Lazy load below fold images
- Responsive srcset for different sizes
- Blur-up placeholder technique
- Max size: 200KB per image

Fonts:
- Subset fonts to used characters
- font-display: swap
- Preload critical font files
- WOFF2 format only

JavaScript:
- Code splitting by route
- Lazy load non-critical components
- Dynamic imports for heavy libraries
- Bundle size budget: 200KB initial

CSS:
- Critical CSS inline in <head>
- Defer non-critical styles
- Purge unused Tailwind classes
- CSS bundle budget: 50KB

Loading Performance:
- LCP target: < 2.5s
- FID target: < 100ms
- CLS target: < 0.1
- Use skeleton screens
- Optimize font loading to prevent FOIT
```

---

## 9. Dark Mode (Primary) + Light Mode

```
Primary: Dark mode as shown above

Light Mode (Optional):
- Background: #FFFFFF
- Surface: #F9F9F9
- Surface Elevated: #FFFFFF
- Border: #E5E5E5
- Text Primary: #0A0A0A
- Text Secondary: #525252

Toggle:
- Icon button in nav (sun/moon)
- Smooth transition: 200ms on background, color
- Persist preference in localStorage
- Respect system preference (prefers-color-scheme)
```

---

## 10. Implementation Checklist

### Phase 1: Foundation
- [ ] Set up design tokens (CSS variables or Tailwind config)
- [ ] Implement typography system
- [ ] Create color palette with semantic naming
- [ ] Set up spacing scale
- [ ] Configure shadow/effect utilities

### Phase 2: Components
- [ ] Build button variants
- [ ] Create card components
- [ ] Implement form inputs
- [ ] Build badge/pill components
- [ ] Create navigation bar
- [ ] Build footer

### Phase 3: Layouts
- [ ] Hero section with gradient background
- [ ] Features grid layout
- [ ] How it works timeline
- [ ] Pricing cards with comparison
- [ ] Dashboard layout shell

### Phase 4: Interactions
- [ ] Add hover states to all interactive elements
- [ ] Implement scroll animations
- [ ] Add page transition effects
- [ ] Create command menu (Cmd+K)
- [ ] Add micro-interactions

### Phase 5: Data Visualization
- [ ] Stat counter animations
- [ ] Progress bars
- [ ] Sparkline charts
- [ ] Donut/ring charts
- [ ] Request log table

### Phase 6: Responsive
- [ ] Test all breakpoints
- [ ] Optimize mobile navigation
- [ ] Ensure touch targets (min 44px)
- [ ] Test on real devices

### Phase 7: Polish
- [ ] Add loading states
- [ ] Implement error states
- [ ] Add empty states
- [ ] Ensure accessibility
- [ ] Performance audit
- [ ] Cross-browser testing

---

## 11. Tech Stack Recommendations

```
Framework: Next.js 14+ (App Router)
Styling: Tailwind CSS v3.4+
Animations: Framer Motion
Charts: Recharts or Tremor
Icons: Lucide React
Fonts: Next.js Font Optimization (Inter, JetBrains Mono)
Components: Radix UI (headless components)
Command Menu: cmdk
Code Highlighting: Shiki or Prism
Deployment: Vercel
```

---

## 12. Brand Voice in UI

```
Tone:
- Confident but not arrogant
- Technical but accessible
- Direct, no fluff
- Slightly playful (see "no support tier bullsh*t")

Copy Guidelines:
- Short sentences
- Active voice
- Numbers over words (70% not "seventy percent")
- Technical accuracy
- Avoid marketing speak
- Use developer terminology correctly

Examples:
✅ "Cache hit in 50ms"
❌ "Lightning-fast caching speeds"

✅ "Cut costs by 70%"
❌ "Experience massive savings"

✅ "BYOK support"
❌ "Bring your own keys for maximum flexibility"
```

---

## Visual References

**Vercel-inspired:**
- Subtle gradients on hero
- Confident use of whitespace
- Clean button styles with hover glow

**Linear-inspired:**
- Fluid transitions (200ms)
- Command palette (Cmd+K)
- Keyboard-first navigation
- Monochromatic with blue accent

**JetBrains-inspired:**
- Monospace for technical values
- Code blocks with proper syntax highlighting
- Data-dense dashboards
- Dark theme as primary

**Dovetail-inspired:**
- Card-based layouts
- Generous padding
- Soft shadows
- Clear visual hierarchy

---

## Final Notes

This is a comprehensive specification, but remember:

1. **Start minimal, iterate**: Build the foundation first, then add flourishes
2. **Consistency > Creativity**: Use the same patterns throughout
3. **Performance matters**: Beautiful but slow is still slow
4. **Test with real data**: Empty states and full states look different
5. **Keyboard users exist**: Make it fully navigable
6. **Mobile is not an afterthought**: Design mobile-first where appropriate

The goal is **minimalist precision**: every element serves a purpose, every interaction feels intentional, every detail is considered. This is a developer tool, so respect the audience's intelligence and time.