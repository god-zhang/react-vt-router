<!-- Language -->
**English | [简体中文](https://github.com/god-zhang/react-vt-router/blob/main/README.zh-CN.md)**

# react-vt-router

[![npm version](https://img.shields.io/npm/v/react-vt-router.svg?color=orange)](https://www.npmjs.com/package/react-vt-router)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-vt-router?label=minzip)](https://bundlephobia.com/package/react-vt-router)
[![license](https://img.shields.io/npm/l/react-vt-router.svg)](https://cdn.jsdelivr.net/npm/react-vt-router@latest/LICENSE)

A tiny React router built on native Web APIs: History, URLPattern, View Transitions (optionally Navigation API). It mirrors the core of react-router while staying small and fast.

## Install

```bash
npm install react-vt-router
# or
pnpm add react-vt-router
# or
yarn add react-vt-router
```

## Quick start

1) Layout with nav and Outlet

```tsx
import { Link, NavLink, Outlet } from "react-vt-router";

function Layout() {
  return (
    <div>
      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/">Home</Link>
        <NavLink
          to="/users"
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          Users
        </NavLink>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}
```

2) Pages: params and query

```tsx
import { Link, useParams, useSearchParams } from "react-vt-router";

function Home() {
  return <h2>Home</h2>;
}

function Users() {
  const list = [1, 2, 3];
  return (
    <div>
      <h2>Users</h2>
      <ul>
        {list.map(id => (
          <li key={id}>
            <Link to={`/users/${id}?tab=profile`}>User {id}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();
  return (
    <div>
      <h3>User: {id}</h3>
      <div>tab = {sp.get("tab") ?? "-"}</div>
    </div>
  );
}

function NotFound() {
  return <h2>404</h2>;
}
```

3) Wire up routes

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-vt-router";

export default function App() {
  return (
    <BrowserRouter defaultViewTransition="zoom">
      <Routes>
        <Route path="/" element={<Layout />}>           {/* parent route with layout */}
          <Route index element={<Home />} />              {/* index = default child */}
          <Route path="users">
            <Route index element={<Users />} />
            <Route path=":id" element={<UserDetail />} />
          </Route>
          {/* redirect old path */}
          <Route path="old-home" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

4) Programmatic navigation and View Transitions

```tsx
import { useNavigate } from "react-vt-router";

function Buttons() {
  const navigate = useNavigate();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => navigate("/users/1", { viewTransition: "slide" })}>
        Go to user 1 (slide)
      </button>
      <button onClick={() => navigate.back()}>Back</button>
      <button onClick={() => navigate.forward()}>Forward</button>
    </div>
  );
}
```

5) Matching (optional)

```tsx
import { useMatch } from "react-vt-router";

function UsersBadge() {
  const match = useMatch("/users/*");
  return match ? <span>In Users</span> : null;
}
```

## Highlights
- Built-in View Transition presets: `fade` | `slide` | `slide-left` | `slide-right` | `zoom`
- URLPattern-based matching with robust string fallback
- Familiar API surface close to react-router for core usage
- TypeScript-first

## Components
(Only core options are listed here.)

- BrowserRouter(props)
  - enableNavigationAPI?: boolean – intercept Navigation API when available (default false)
  - defaultViewTransition?: boolean | string | ViewTransitionConfig
    - boolean: true to enable, false to disable
    - string: one of presets ("fade" | "slide" | "slide-left" | "slide-right" | "zoom")
    - ViewTransitionConfig: { name?, className?, attribute?, onStart?, onReady?, onFinished? }

- Routes / Route
  - RouteProps: { path?: string; index?: boolean; element?: ReactNode; caseSensitive?: boolean; redirectTo?: string }

- Link(props)
  - { to: string; replace?: boolean; viewTransition?: boolean | string | ViewTransitionConfig; scroll?: ScrollBehavior }

- NavLink(props)
  - className?: string | (({ isActive, isPending }) => string)
  - style?: CSSProperties | (({ isActive, isPending }) => CSSProperties)
  - end?: boolean

- Navigate(props)
  - { to: string | number; replace?: boolean; state?: any; viewTransition?: boolean | string | ViewTransitionConfig }

- Outlet / OutletWithContext

## Hooks
- useNavigate(): NavigateFunction
  - call: navigate(to, options?) (options: { replace?, state?, viewTransition?, scroll? })
  - helpers: navigate.back(), navigate.forward(), navigate.go(delta)
- useLocation(): { pathname, search, hash, state, key }
- useParams<T>(): T (merged across nesting)
- useSearchParams(): [URLSearchParams, set(next, options?)]
- useMatch(pattern: string): { params, pathname, pattern } | null
- useRoutes(routeObjects: RouteObject[]): ReactNode
- useOutletContext<T>(): T
- useResolvedPath(to: string): string

## View Transitions
- Global: `<BrowserRouter defaultViewTransition="zoom"/>`
- Per navigation: via `Link` or `navigate(to, { viewTransition })`
- Presets: `fade`, `slide`, `slide-left`, `slide-right`, `zoom`

1) Global default config

```tsx
import { BrowserRouter } from "react-vt-router";

const vt = {
  name: "fade",            // will set attribute="fade" on <html>
  className: "vt-running", // class added on <html> while transition runs
  attribute: "data-vt",    // attribute name, defaults to data-vt
  onStart() { /* before snapshot */ },
  onReady() { /* snapshot done, render new page */ },
  onFinished() { /* end of transition */ },
};

export function App() {
  return (
    <BrowserRouter defaultViewTransition={vt}>
      {/* ...Routes */}
    </BrowserRouter>
  );
}
```

2) Per-navigation override (Link / navigate)

```tsx
import { Link, useNavigate } from "react-vt-router";

// Link: preset string
<Link to="/users/2" viewTransition="slide-right">User 2</Link>

// Link: explicitly disable this transition
<Link to="/" viewTransition={false}>Back home (no animation)</Link>

// Link: custom object
<Link to="/about" viewTransition={{ name: "fade", className: "my-vt" }}>About</Link>

// Programmatic: pass object
function Go() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/users/3", {
        viewTransition: { name: "slide", className: "vt-running" },
        replace: false,
        scroll: "auto",
      })}
    >
      To user 3 (custom VT)
    </button>
  );
}
```

3) Lifecycle hooks

```ts
const vt = {
  name: "fade",
  onStart() { console.log("VT start"); },
  onReady() { console.log("VT ready"); },
  onFinished() { console.log("VT finished"); },
};
```

4) CSS examples

During a transition the router adds to <html>:
- an attribute (default `data-vt`) with value = `name`
- a class (configurable via `className`)

You can target them and also use the View Transitions pseudo-elements:

```css
/* Scoped by name: only active for fade */
html[data-vt="fade"]::view-transition-old(root) {
  animation: fade-out 180ms ease-in both;
}
html[data-vt="fade"]::view-transition-new(root) {
  animation: fade-in 220ms ease-out both;
}

@keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }
@keyframes fade-in  { from { opacity: 0 } to { opacity: 1 } }

/* Optional: global flag while running */
html.vt-running { /* ... */ }
```

5) Advanced: directional transitions

```tsx
import { useNavigate } from "react-vt-router";

function PrevNext({ currentId }: { currentId: number }) {
  const navigate = useNavigate();
  const go = (id: number) => {
    const vtName = id > currentId ? "slide-left" : "slide-right";
    navigate(`/users/${id}`, { viewTransition: vtName });
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => go(currentId - 1)}>Prev</button>
      <button onClick={() => go(currentId + 1)}>Next</button>
    </div>
  );
}
```

Note: if View Transitions API is not available, navigation gracefully falls back to no animation. Passing `viewTransition: false` forces no animation for that navigation.

## Debug & compatibility
- Debug logs: `window.__REACT_VT_ROUTER_DEBUG__ = true`
- Force string fallback (disable URLPattern): `window.__REACT_VT_ROUTER_FORCE_STRING__ = true`
- Navigation API interception: set `enableNavigationAPI` on BrowserRouter

## Notes & limitations
- Best for small/medium SPAs: minimal API, zero deps, quick to adopt.
- For large/complex apps requiring data APIs (loader/action/defer), SSR, hash/memory routers, deep caching, error/lazy boundaries, consider react-router.
- Targets modern browsers; gracefully falls back when View Transitions / URLPattern are unavailable.

## License
MIT
