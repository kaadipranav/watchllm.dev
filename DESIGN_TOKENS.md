# WatchLLM Design System - Quick Reference

## Color Tokens

### Background Colors
```css
bg-primary: #0A0A0A     /* Near-black main background */
bg-surface: #111111     /* Card/surface background */
bg-elevated: #1A1A1A    /* Elevated element background */
```

### Border Colors
```css
border-subtle: #222222   /* Subtle borders */
border-default: #2A2A2A  /* Default borders */
border-hover: #333333    /* Hover state borders */
```

### Text Colors
```css
text-primary: #FAFAFA    /* Primary text - near-white */
text-secondary: #A1A1A1  /* Secondary text */
text-tertiary: #737373   /* Tertiary text */
text-muted: #525252      /* Muted text */
```

### Accent Colors
```css
accent-primary: #3B82F6        /* Blue - primary accent */
accent-primary-hover: #2563EB  /* Blue hover state */
accent-success: #10B981        /* Green - success */
accent-warning: #F59E0B        /* Amber - warning */
accent-error: #EF4444          /* Red - error */
accent-purple: #A855F7         /* Purple - secondary accent */
```

## Typography Scale

```css
/* Hero - 72px / 900 weight / -0.04em letter-spacing */
text-6xl lg:text-[72px] font-black tracking-tight

/* H1 - 48px / 700 weight / -0.03em */
text-5xl font-bold tracking-tight

/* H2 - 32px / 600 weight / -0.02em */
text-3xl font-semibold tracking-tight

/* H3 - 24px / 600 weight / -0.01em */
text-2xl font-semibold tracking-tight

/* Body Large - 16px / 400 weight / -0.01em */
text-lg font-normal

/* Body - 14px / 400 weight / 0em */
text-sm font-normal

/* Caption - 12px / 400 weight / 0.01em */
text-xs font-normal

/* Code - 13px / monospace */
text-sm font-mono
```

## Spacing Scale (4px base)

```css
space-1: 4px   (1 unit)
space-2: 8px   (2 units)
space-3: 12px  (3 units)
space-4: 16px  (4 units)
space-5: 20px  (5 units)
space-6: 24px  (6 units)
space-8: 32px  (8 units)
space-10: 40px (10 units)
space-12: 48px (12 units)
space-16: 64px (16 units)
space-20: 80px (20 units)
space-24: 96px (24 units)
space-32: 128px (32 units)
```

## Border Radius

```css
rounded-xs: 4px   /* Badges, small buttons */
rounded-sm: 6px   /* Inputs, default buttons */
rounded-md: 8px   /* Cards */
rounded-lg: 12px  /* Large cards */
rounded-xl: 16px  /* Hero sections */
rounded-full: 9999px /* Pills, avatars */
```

## Shadows

```css
shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.5)
shadow-small: 0 2px 8px 0 rgba(0, 0, 0, 0.6)
shadow-medium: 0 4px 16px 0 rgba(0, 0, 0, 0.7)
shadow-large: 0 8px 32px 0 rgba(0, 0, 0, 0.8)
shadow-glow-primary: 0 0 24px rgba(59, 130, 246, 0.4)
shadow-glow-success: 0 0 24px rgba(16, 185, 129, 0.4)
```

## Animation Timing

```css
duration-fast: 150ms      /* Quick transitions */
duration-base: 200ms      /* Standard transitions */
duration-slow: 300ms      /* Slow transitions */

/* Easing */
cubic-bezier(0.4, 0, 0.2, 1)  /* ease-out */
```

## Component Patterns

### Button - Primary
```tsx
<Button>
  {/* Gradient background, glow on hover */}
  bg-gradient-to-br from-accent-primary to-accent-primary-hover
  hover:shadow-glow-primary hover:scale-[1.02]
</Button>
```

### Button - Secondary
```tsx
<Button variant="secondary">
  {/* Bordered with fill on hover */}
  border border-border-default
  hover:border-accent-primary hover:bg-accent-primary/10
</Button>
```

### Button - Ghost
```tsx
<Button variant="ghost">
  {/* Transparent with subtle hover */}
  bg-transparent hover:bg-white/5
</Button>
```

### Card
```tsx
<Card>
  {/* Surface with subtle border */}
  bg-bg-surface border border-border-subtle
  hover:border-border-hover hover:-translate-y-1
  transition-all duration-base
</Card>
```

### Input
```tsx
<Input>
  {/* Dark background with focus glow */}
  bg-bg-primary border border-border-default
  focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
</Input>
```

### Badge
```tsx
<Badge variant="primary">
  {/* Small uppercase label */}
  bg-accent-primary/10 text-accent-primary
  border border-accent-primary/20
  uppercase tracking-wider text-xs
</Badge>
```

## Utility Classes

### Gradients
```css
.text-gradient
/* Linear gradient from primary to secondary text */
background: linear-gradient(90deg, #FAFAFA, #A1A1A1)

.text-gradient-accent
/* Gradient from blue to purple */
background: linear-gradient(135deg, #3B82F6, #A855F7)

.gradient-border
/* Animated gradient border on hover */
/* See globals.css for implementation */
```

### Effects
```css
.glass
/* Glassmorphism effect */
bg-bg-primary/80 backdrop-blur-xl border border-border-subtle

.card-glow
/* Card with subtle glow */
shadow-large + shadow-glow-primary

.skeleton
/* Loading shimmer animation */
/* See globals.css for implementation */
```

### Patterns
```css
.grid-pattern
/* Background grid overlay */
background-image: linear-gradient(hsl(var(--border-subtle)) 1px, transparent 1px)
background-size: 60px 60px

.hero-grid
/* Hero section dot pattern */
background-image: radial-gradient(...)
```

## Responsive Breakpoints

```css
xs: 0-639px      /* Mobile */
sm: 640-767px    /* Large mobile */
md: 768-1023px   /* Tablet */
lg: 1024-1279px  /* Small desktop */
xl: 1280-1535px  /* Desktop */
2xl: 1536px+     /* Large desktop */
```

## Accessibility

### Focus States
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-accent-primary/50
focus-visible:ring-offset-2
focus-visible:ring-offset-bg-primary
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Usage Examples

### Section Container
```tsx
<section className="relative py-32 overflow-hidden">
  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</section>
```

### Section Header
```tsx
<div className="text-center max-w-3xl mx-auto mb-20">
  <h2 className="text-sm font-medium uppercase tracking-wider text-accent-primary mb-4">
    Section Label
  </h2>
  <h1 className="text-5xl font-bold tracking-tight text-text-primary mb-6">
    Main Heading
  </h1>
  <p className="text-lg text-text-secondary leading-relaxed">
    Description text
  </p>
</div>
```

### Feature Card
```tsx
<div className="bg-bg-surface border border-border-subtle rounded-lg p-6 
                transition-all duration-base 
                hover:border-border-hover hover:-translate-y-1">
  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-primary to-accent-purple
                  flex items-center justify-center mb-4">
    <Icon className="h-6 w-6 text-white" />
  </div>
  <h3 className="text-xl font-semibold text-text-primary mb-3">Title</h3>
  <p className="text-sm text-text-secondary leading-relaxed">Description</p>
</div>
```

### Animated Element with Framer Motion
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
>
  {/* Content */}
</motion.div>
```

## Best Practices

1. **Use semantic color names** - `text-primary` instead of `text-[#FAFAFA]`
2. **Consistent spacing** - Always use the spacing scale (multiples of 4px)
3. **200ms transitions** - Standard for all UI interactions
4. **Reduced motion** - Always support `prefers-reduced-motion`
5. **Focus indicators** - Never remove without replacement
6. **Mobile-first** - Write mobile styles first, then enhance with breakpoints
7. **Gradient effects** - Use sparingly for accent, not everywhere
8. **Card hover** - Subtle -4px translateY is enough

## Common Combinations

### Primary CTA Button
```tsx
className="bg-gradient-to-br from-accent-primary to-accent-primary-hover 
           text-white px-6 py-3 rounded-sm 
           shadow-subtle hover:shadow-glow-primary 
           hover:scale-[1.02] hover:brightness-110
           active:scale-[0.98]
           transition-all duration-fast"
```

### Section Background
```tsx
className="relative py-32 overflow-hidden"
{/* Background decoration */}
<div className="absolute inset-0 pointer-events-none">
  <div className="absolute top-1/4 right-1/4 w-96 h-96 
                  bg-accent-primary/10 rounded-full blur-3xl" />
</div>
```

### Live Badge
```tsx
<Badge variant="primary" className="inline-flex items-center gap-2">
  <span className="relative flex h-2 w-2">
    <span className="animate-pulse-dot absolute inline-flex h-full w-full 
                     rounded-full bg-accent-primary opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 
                     bg-accent-primary" />
  </span>
  Live
</Badge>
```

---

**Design System Version:** 1.0
**Last Updated:** December 27, 2025
**Based on:** ui.md specification
