# UI — Estándares (cheatsheet)

Resumen de bolsillo para que toda la UI quede cuadrada. Tokens definidos en
[`src/styles/global.css`](./src/styles/global.css).

## Regla de oro

**Usa los tokens `--theme-*`. Nunca hardcodees colores.** Si hardcodeas, el dark mode se rompe
y el sistema se descuadra.

```tsx
// BIEN
<div className="bg-(--theme-card-bg) text-(--theme-text) border border-(--theme-border)">
// MAL
<div className="bg-white text-gray-900 border border-gray-200">
```

## Tokens

| Necesitas          | Usa                                                                              |
| ------------------ | -------------------------------------------------------------------------------- |
| Fondo de página    | `bg-(--theme-bg)`                                                                 |
| Texto              | `text-(--theme-text)`                                                             |
| Tarjeta / panel    | `bg-(--theme-card-bg)`                                                            |
| Chip / fondo sutil | `bg-(--theme-secondary-bg)`                                                       |
| Borde              | `border-(--theme-border)`                                                         |
| Error              | `bg-(--theme-error-bg) border-(--theme-error-border) text-(--theme-error)`        |
| Éxito              | `bg-(--theme-success-bg) border-(--theme-success-border) text-(--theme-success)`  |
| Advertencia        | `bg-(--theme-warning-bg) border-(--theme-warning-border) text-(--theme-warning)`  |
| Info               | `bg-(--theme-info-bg) border-(--theme-info-border) text-(--theme-info)`           |
| Peligro (fuerte)   | `bg-(--theme-danger-bg) border-(--theme-danger-border) text-(--theme-danger)`     |
| Marca (verde)      | `text-primary` · `bg-primary` · `bg-primary/5`                                    |

Texto atenuado: `text-(--theme-text) opacity-60` (no `text-gray-500`).

Estos tokens reemplazan los `red-500` / `amber-500` / `blue-500` ad-hoc (usados cientos
de veces hoy). Color de tema = se adapta a dark; color de Tailwind suelto = no.

## Reemplazos típicos

| Hardcodeo                    | Token                            |
| ---------------------------- | -------------------------------- |
| `bg-white`                   | `bg-(--theme-card-bg)`           |
| `text-gray-900`/`text-black` | `text-(--theme-text)`            |
| `text-gray-500`/`-400`       | `text-(--theme-text) opacity-60` |
| `bg-gray-100`/`-50`          | `bg-(--theme-secondary-bg)`      |
| `border-gray-200`            | `border-(--theme-border)`        |

## Única excepción

Escalas donde el color *codifica info* (ej. estados de pedido). Van centralizadas en una
constante (ver `OrderStatusBadge.tsx`), nunca esparcidas por el JSX.

## Estructura de página

- **Header (Navbar) y Footer SIEMPRE.** Toda página de la app va con `Navbar` arriba y
  `Footer` abajo. Usa un layout que ya los incluya (`SellerLayout`, `OrdersLayout`) o
  agrégalos; no dejes pantallas sueltas sin ellos.
- **Ancho de contenido:** centra con `mx-auto` y usa **`max-w-7xl`** como ancho estándar
  de página. (`max-w-2xl` para formularios/modales angostos.) No mezcles `5xl`/`6xl`/`4xl`
  página por página — eso es lo que descuadra el ancho entre secciones.
- **Header y Footer van casi full-width:** `w-full px-4 sm:px-8 lg:px-12 xl:px-16` (sin
  `max-w`), pegados a los bordes. Solo el *contenido* de página se limita a `max-w-7xl`.
- **Cuerpo:** `min-h-screen flex flex-col` para que el footer quede abajo; el contenido
  principal `flex-1`.

```tsx
<main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6">
```

## Fuentes

- **Una sola fuente: Inter.** Se carga una vez en [`Layout.astro`](./src/layouts/Layout.astro).
  No la importes por layout ni uses otra familia.
- Es la fuente por defecto del `body` (en `global.css`); no necesitas ponerla.
- Para títulos usa pesos altos (`font-bold`, `font-black`), no otra fuente. `font-display`
  existe pero también apunta a Inter.
- No uses `font-['Outfit']` ni `style={{fontFamily}}` inline — era el desorden anterior, hay
  que reemplazarlos por `font-display`.

## Navegación (Navbar)

- **Textos de los links SIEMPRE en español** (Productos, Órdenes, Inventario, Entregas,
  Admin). El dominio y la UI van en español.
- **Resaltar la página activa:** el link de la sección actual va en `text-primary` con
  subrayado; comparar `window.location.pathname` con el `href`. Usar `aria-current="page"`.
- **Sin sesión → botón "Iniciar sesión" visible** (pastilla verde con ícono), no escondido
  en un dropdown.
- **Inicio (`/`) redirige a `/productos`** — no hay landing de bienvenida.
- El navbar no debe romperse al ensanchar: logo y acciones con `shrink-0`, links con
  `whitespace-nowrap`, nombre de usuario con `truncate`.

## Marca (logo)

- Logo = ícono de bolsa (`ShoppingBag`) en pastilla verde `rounded-xl bg-primary` + texto
  **"SansiStore"** (capitalizado, `font-black`, "Store" en `text-primary`).
- Mismo logo en Navbar y Footer. Referencia: [`Navbar.tsx`](./src/components/Navbar.tsx).

## Lo demás

- **Radios:** tarjetas `rounded-2xl` · pills/botones `rounded-full`
- **Iconos UI:** `lucide-react` · **Logos de marca** (redes): `react-icons`
- **Dark mode:** no haces nada extra — si usas tokens, funciona solo.
- **No** usamos librerías de componentes (shadcn/MUI). Construimos con Tailwind + tokens.
- Tokens definidos en [`src/styles/global.css`](./src/styles/global.css).
