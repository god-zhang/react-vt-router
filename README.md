<!-- Language -->
**English | [简体中文](https://cdn.jsdelivr.net/npm/react-vt-router@latest/README.zh-CN.md)**

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

```tsx
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, Outlet } from "react-vt-router";

export default function App() {
  return (
    <BrowserRouter defaultViewTransition="zoom">
      <Routes>
        <Route path="/" element={<Layout/>}>
          <Route index element={<Home/>} />
          <Route path="users">
            <Route index element={<Users/>} />
            <Route path=":id" element={<UserDetail/>} />
          </Route>
          <Route path="old-home" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </BrowserRouter>
  );
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
- Custom config example:

```ts
const cfg = {
  name: "fade",
  className: "my-vt",
  attribute: "data-vt",
  onStart(){}, onReady(){}, onFinished(){}
};
```

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
