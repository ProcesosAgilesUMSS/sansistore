# Frontend Design System

## Overview
This document defines the design tokens, visual system, and interaction patterns used in Sansistore's frontend.  
It ensures consistency, scalability, performance, and adaptability across all interfaces.

---

## Design Principles

- **Visual Speed**: Interfaces are optimized for immediate readability and fast cognitive processing.
- **Consistency**: Unified design tokens and reusable components across the system.
- **Adaptability**: Fully responsive layout with native support for Light and Dark modes.
- **Performance First**: Lightweight implementation avoiding unnecessary abstractions.

---

## Color System

### Core Palette (60 · 30 · 10)

- **60% — Background**
  - Light: `#FFFBF4`
  - Dark: `#0A0B0D`

- **30% — Brand / Accent**
  - Primary: `#88B04B`

- **10% — Action / Emphasis**
  - Primary Action: `#1E1E1E`

---

### Secondary Colors

- **Text**
  - Light: `#1E1E1E`
  - Dark: `#F5F3EF`

- **Card Background**
  - Light: `#FFFFFF`
  - Dark: `#141518`

- **Secondary Background**
  - Light: `#E8E5D8`
  - Dark: `#1A1B1E`

- **Borders**
  - Light: `rgba(136, 176, 75, 0.15)`
  - Dark: `rgba(255, 255, 255, 0.08)`

---

## Typography

- **Primary Font**: Inter  
- **Display Font**: Outfit  

### Hierarchy

- **Hero Titles**
  - Weight: 900
  - Responsive using `clamp()`
  - Tight letter-spacing

- **Section Titles**
  - Weight: 800

- **Body Text**
  - Weight: 400–500
  - Optimized for readability across devices

---

## Spacing System

- Based on TailwindCSS spacing scale.

### Standard Spacing
- **Small**: 8px – 12px  
- **Medium**: 16px – 24px  
- **Large**: 32px – 64px  

### Layout Padding
- Fluid padding: `clamp(15px, 5vw, 100px)`

### Border Radius
- **Small**: `0.75rem`
- **Medium**: `1.25rem`
- **Large**: `2.5rem`
- **Full**: `9999px` (buttons, pills, circular elements)

---

## Components

### Navbar
- Fixed positioning.
- Glassmorphism effect (`blur` + transparency).
- Theme-aware background and borders.

### Buttons
- Fully rounded (`border-radius: full`).
- Uppercase typography.
- High contrast and clear primary vs secondary actions.

### Inputs
- Rounded corners and soft borders.
- Theme-adaptive colors.
- Focus states with accent highlights.

### Cards
- Rounded (`1.2rem` – `2.5rem`).
- Subtle borders and soft shadows.
- Optional hover + 3D tilt interaction.

### Mobile Tab Bar
- Fixed bottom navigation with glass effect.
- Grid layout (4 items) optimized for touch interaction.

---

## Theming

- Supports **Light and Dark modes**.
- Automatic detection via `prefers-color-scheme`.
- Manual override stored in `localStorage`.
- UI controlled via `data-theme` attribute with smooth transitions.

---

## Responsiveness

- **Mobile-first architecture**.
- Fluid typography using `clamp()`.
- Adaptive grid layouts (`auto-fill` + `minmax`).
- Safe-area support for modern mobile browsers (`env(safe-area-inset-bottom)`).

---

## Interaction & Motion

- **Smooth Scrolling**: Implemented via Lenis.
- **Reveal Animations**: Scroll-based using Intersection Observer.
- **Microinteractions**: Scale feedback on `active` states and high-fidelity hover effects.
- **Enhancements**: 3D tilt (desktop) and Canvas Confetti for feedback.

---

## Technical Stack (Frontend)

- **Core**: HTML5, Vanilla JavaScript.
- **Styling**: TailwindCSS (Utility-first).
- **Libraries**:
  - Lucide Icons (Iconography).
  - Lenis (Smooth Scroll).
  - Vanilla Tilt (3D Effects).
  - Canvas Confetti (Interactions).

---

## UI Strategy

This project does **NOT** rely on component libraries such as shadcn/ui.

### Rationale
- Full control over visual system and design tokens.
- Avoidance of unnecessary abstraction layers.
- Reduced bundle size and complexity.
- Greater flexibility for custom interaction patterns.

---

## Architecture Notes

- Design tokens implemented via CSS variables (`:root`).
- Dark mode overrides via `[data-theme='dark']`.
- Consistent UI enforced through reusable patterns.
- No framework dependency ensures full portability.

---

## Live Preview
[https://delivery-proposal-sansistore-jgaa.vercel.app](https://delivery-proposal-sansistore-jgaa.vercel.app)

---

**Final Notes**: This system is designed to scale while prioritizing clarity, contrast, and speed, avoiding overengineering while maintaining maximum flexibility.