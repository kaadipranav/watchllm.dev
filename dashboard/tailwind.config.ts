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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'premium-sm': 'var(--radius-sm)',
        'premium-md': 'var(--radius-md)',
        'premium-lg': 'var(--radius-lg)',
        'premium-xl': 'var(--radius-xl)',
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
      },
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'base': 'var(--duration-base)',
        'slow': 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'premium-out': 'var(--ease-out)',
        'premium-in-out': 'var(--ease-in-out)',
        'bounce': 'var(--ease-bounce)',
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in var(--duration-base) var(--ease-out)",
        "slide-up": "slide-up var(--duration-base) var(--ease-out)",
        "slide-down": "slide-down var(--duration-base) var(--ease-out)",
        "scale-in": "scale-in var(--duration-base) var(--ease-out)",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
