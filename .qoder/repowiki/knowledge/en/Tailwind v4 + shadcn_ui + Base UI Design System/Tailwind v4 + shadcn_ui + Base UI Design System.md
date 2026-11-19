---
kind: frontend_style
name: Tailwind v4 + shadcn/ui + Base UI Design System
category: frontend_style
scope:
    - '**'
source_files:
    - Apps/Web/src/app/globals.css
    - Apps/Web/components.json
    - Apps/Web/package.json
    - Apps/Web/src/providers/theme-provider.tsx
    - Apps/Web/src/components/ui/button.tsx
    - Apps/Web/src/hooks/use-mobile.ts
---

## Approach

The TaskFlow web app (`Apps/Web`) is styled with **Tailwind CSS v4** (no `tailwind.config.*` file — configuration lives in CSS via `@theme`), using the **shadcn/ui** component generator configured for the `base-nova` style, built on top of **Base UI** primitives (`@base-ui/react`) and enhanced with **class-variance-authority** (CVA) for variant-driven styling. Dark mode is provided by `next-themes`, and animations come from `tw-animate-css`. Icons are sourced from `@hugeicons/react`.

## Key Files

- `Apps/Web/src/app/globals.css` — single global stylesheet that imports Tailwind, tw-animate-css, and shadcn's base CSS; defines all design tokens as CSS custom properties under `:root` and `.dark`; exposes Tailwind theme variables via `@theme inline`.
- `Apps/Web/components.json` — shadcn/ui project config: `style: "base-nova"`, `rsc: true`, `tsx: true`, `iconLibrary: "hugeicons"`, `baseColor: "zinc"`, `cssVariables: true`, aliases mapping `@/components/ui` → `src/components/ui`, plus a registry for `@reui` components.
- `Apps/Web/package.json` — declares dependencies: `next`, `tailwindcss ^4`, `@tailwindcss/turbopack`, `@base-ui/react`, `class-variance-authority`, `cn`, `next-themes`, `sonner`, `tw-animate-css`, `react-day-picker`, `@dnd-kit/*`, `@hugeicons/*`.
- `Apps/Web/src/providers/theme-provider.tsx` — thin wrapper around `next-themes`'s `ThemeProvider`.
- `Apps/Web/src/hooks/use-mobile.ts` — mobile breakpoint hook using `window.matchMedia` with a hard-coded `MOBILE_BREAKPOINT = 768`.
- `Apps/Web/src/components/ui/button.tsx` — representative shadcn-generated component showing the CVA + Base UI pattern used across the UI layer.

## Architecture and Conventions

### Design Tokens
All visual tokens are defined as CSS custom properties in `globals.css`:
- Color roles: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--card`, `--popover`, `--sidebar*`, `--chart-1..5`, `--success/info/warning/invert` and their `-foreground` counterparts.
- Radius tokens: `--radius-sm/md/lg/xl/2xl/3xl/4xl` derived from a single `--radius: 0.625rem`.
- Colors use **OKLCH** values in light mode and alternate OKLCH values in the `.dark` selector.
- Semantic color extensions (`--success`, `--info`, `--warning`, `--invert`) map to Tailwind's named palette colors (`--color-emerald-*`, `--color-violet-*`, `--color-yellow-*`, `--color-zinc-*`).

These CSS variables are re-exported into Tailwind's theme via `@theme inline { --color-*: var(--*) }`, making them available as Tailwind utilities like `bg-primary`, `text-destructive`, `rounded-xl`, etc.

### Component Library Composition
- **Primitives**: All interactive elements wrap `@base-ui/react` primitives (e.g., `ButtonPrimitive` from `@base-ui/react/button`). This provides accessibility-compliant unstyled primitives.
- **Variants**: Each component uses `class-variance-authority` (`cva`) to declare `variant` and `size` prop combinations (see `button.tsx` variants: `default|outline|secondary|ghost|destructive|link` and sizes `xs|sm|lg|icon|icon-xs|icon-sm|icon-lg`).
- **Class merging**: `cn` (from the `cn` package) merges user-supplied className with generated variant classes.
- **Generated components**: The `src/components/ui/` directory contains ~30 shadcn-generated primitives (alert, badge, button, calendar, card, dialog, dropdown-menu, input, select, sheet, sidebar, table, tabs, toast, tooltip, etc.).

### Theme / Dark Mode
- Light/dark themes are toggled by adding/removing the `.dark` class on the document root, driven by `next-themes` through the `ThemeProvider` in `providers/theme-provider.tsx`.
- A custom `@custom-variant dark (&:is(.dark *))` rule enables scoped dark-mode styles inside component CSS.

### Responsive Strategy
- No dedicated responsive breakpoints are declared in a config file (there is no `tailwind.config.*`). Breakpoints rely on Tailwind's default breakpoints.
- A single JS-based breakpoint exists in `hooks/use-mobile.ts`: `MOBILE_BREAKPOINT = 768`, exposed via `useIsMobile()` for conditional rendering logic.

### Iconography
- Icons are consumed via `@hugeicons/react` (`@hugeicons/core-free-icons`), configured in `components.json` as `iconLibrary: "hugeicons"`.

### Animation
- Animations are imported globally via `@import "tw-animate-css"` in `globals.css`, enabling utility classes like `animate-*` throughout the app.

### Project Structure for Styling
- Global styles: `src/app/globals.css`.
- Shared UI primitives: `src/components/ui/*.tsx` (shadcn-generated).
- Feature components: grouped by page area under `src/components/<page-name>/` (e.g., `main-page/`, `tasks-page/`, `projects-page/`, `project-details-page/`).
- Theme provider: `src/providers/theme-provider.tsx`.
- Mobile hook: `src/hooks/use-mobile.ts`.

## Conventions and Constraints

- **No Tailwind config file**: Configuration is done exclusively in CSS via `@theme inline` and `@custom-variant` rules in `globals.css` (enforced by the absence of any `tailwind.config.*` in the repo).
- **Design tokens are CSS variables**: New colors, radii, or semantic tokens should be added as `--variable` declarations under both `:root` and `.dark` blocks in `globals.css`, then referenced via Tailwind utilities.
- **Components extend Base UI primitives**: New UI components should wrap a `@base-ui/react` primitive and apply styling through CVA variants merged with `cn`, following the pattern in `components/ui/button.tsx`.
- **Variant/sizes are declared via CVA**: Component props for appearance are typed through `VariantProps<typeof componentVariants>` rather than ad-hoc className strings.
- **Dark mode uses the `.dark` class**: Styles toggle via the `next-themes` provider; new themed styles should target the `.dark` selector or use the `dark:` Tailwind prefix.
- **Icons come from Hugeicons**: New icons should be imported from `@hugeicons/react` per the shadcn `iconLibrary` setting in `components.json`.
- **Mobile breakpoint is centralized**: The `768px` breakpoint is defined once in `hooks/use-mobile.ts` and accessed via `useIsMobile()` rather than being scattered as magic numbers.