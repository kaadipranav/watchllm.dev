import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        display: ['var(--font-display)', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        // WatchLLM Design System - Based on ui.md specification
        
        // Background colors
        'bg-primary': '#0A0A0A',
        'bg-surface': '#111111',
        'bg-elevated': '#1A1A1A',
        
        // Border colors
        'border-subtle': '#222222',
        'border-default': '#2A2A2A',
        'border-hover': '#333333',
        
        // Accent colors
        'accent-primary': '#3B82F6',
        'accent-primary-hover': '#2563EB',
        'accent-success': '#10B981',
        'accent-warning': '#F59E0B',
        'accent-error': '#EF4444',
        'accent-purple': '#A855F7',
        
        // Text colors
        'text-primary': '#FAFAFA',
        'text-secondary': '#A1A1A1',
        'text-tertiary': '#737373',
        'text-muted': '#525252',

        // Legacy compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Premium Design System Colors
        'premium': {
          bg: {
            primary: "hsl(var(--bg-primary))",
            elevated: "hsl(var(--bg-elevated))",
            'elevated-hover': "hsl(var(--bg-elevated-hover))",
            glass: "hsl(var(--bg-glass))",
          },
          border: {
            subtle: "hsl(var(--border-subtle))",
            hover: "hsl(var(--border-hover))",
            focus: "hsl(var(--border-focus))",
          },
          text: {
            primary: "hsl(var(--text-primary))",
            secondary: "hsl(var(--text-secondary))",
            muted: "hsl(var(--text-muted))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent-primary))",
            glow: "hsl(var(--accent-glow))",
          },
          success: {
            DEFAULT: "hsl(var(--success))",
            glow: "hsl(var(--success-glow))",
          },
          warning: "hsl(var(--warning))",
          danger: "hsl(var(--danger))",
          info: "hsl(var(--info))",
        },
      },
      borderRadius: {
        // WatchLLM Design System
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '30': '7.5rem',   // 120px
      },
      boxShadow: {
        'premium-sm': 'var(--shadow-sm)',
        'premium-md': 'var(--shadow-md)',
        'premium-lg': 'var(--shadow-lg)',
        'glow-accent': 'var(--shadow-glow-accent)',
        'glow-success': 'var(--shadow-glow-success)',
        // WatchLLM Design System
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'small': '0 2px 8px 0 rgba(0, 0, 0, 0.6)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.7)',
        'large': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
        'glow-primary': '0 0 24px rgba(59, 130, 246, 0.4)',
        'glow-success-alt': '0 0 24px rgba(16, 185, 129, 0.4)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'premium-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'premium-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-down": "slide-down 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scale-in 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
