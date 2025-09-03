/*
  react-vt-router (v0.1)
  A tiny, React-first router for small/medium SPAs that leans on modern Web Platform APIs:
  - History API (pushState/replaceState + popstate)
  - URLPattern for path matching and params parsing
  - View Transition API for animated route transitions (if available)
  - (Optional) Navigation API interception when available (progressive enhancement)

  A tiny, React-first router for small/medium SPAs that leans on modern Web Platform APIs:
  - History API (pushState/replaceState + popstate)
  - URLPattern for path matching and params parsing
  - View Transition API for animated route transitions (if available)
  - (Optional) Navigation API interception when available (progressive enhancement)

  Goals
  - Keep bundle small and fast; no dependency on big router libs
  - Provide a React Router–like API surface for the core features
  - TypeScript-first with helpful comments

  Core features implemented
  - <BrowserRouter>, <Routes>, <Route>, <Link>, <Navigate>, <Outlet>
	- Hooks: useNavigate, useLocation, useParams, useSearchParams, useRouterState, useMatch, useOutletContext
  - Nested routes with dynamic params and index routes
  - Redirects via <Navigate to="..." replace />
  - Relative and absolute navigation
  - View Transitions via document.startViewTransition when available

  Not (yet) implemented (future work)
  - Data APIs (loader/action/defer), preloading, lazy boundary, scroll restoration
  - Hash-based routing, memory router
  - Route-level transition customization hooks
*/

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    Children,
    isValidElement,
} from "react";
import type { ReactNode, CSSProperties, MouseEventHandler, AnchorHTMLAttributes } from "react";

let keyCounter = 0;
const createKey = () => `k${++keyCounter}`;
const normalize = (path: string) => path.replace(/\/+$/, "") || "/";
const joinPaths = (base: string, child: string) => normalize(`${base === "/" ? "" : base}/${child}`);
const toURL = (to: string, base?: string) => new URL(to, base ?? window.location.href);

const supportsURLPattern = (): boolean => {
    try {
        const forced = (window as any).__REACT_VT_ROUTER_FORCE_STRING__ ?? (window as any).__TINY_ROUTER_FORCE_STRING__;
        if (forced === true) return false;
    } catch {}
    return typeof (window as any).URLPattern === "function";
};

type URLPatternLike = { exec(input: URL | string): { pathname: { groups: Record<string, string> } } | null };

export type LocationLike = { pathname: string; search: string; hash: string; state: any; key: string };

export type ViewTransitionConfig = {
    name?: string;
    className?: string;
    attribute?: string;
    onStart?: () => void;
    onReady?: () => void;
    onFinished?: () => void;
};

function normalizeVT(
    input: boolean | string | ViewTransitionConfig | undefined,
    fallbackAttr = "data-vt"
): false | ViewTransitionConfig | undefined {
    if (input === undefined) return undefined;
    if (typeof input === "boolean") return input ? {} : false;
    if (typeof input === "string") return { name: input, attribute: fallbackAttr };
    return { attribute: fallbackAttr, ...input };
}

export type NavigateOptions = {
    replace?: boolean;
    state?: any;
    viewTransition?: boolean | string | ViewTransitionConfig;
    scroll?: ScrollBehavior;
};

export type NavigateFunction = ((to: string | number, options?: NavigateOptions) => void) & {
    back: () => void;
    forward: () => void;
    go: (delta: number) => void;
};

export type RouteObject = {
    path?: string;
    index?: boolean;
    caseSensitive?: boolean;
    element?: ReactNode;
    children?: RouteObject[];
};

export type CompiledRoute = RouteObject & {
    id: string;
    fullPath: string;
    pattern: URLPatternLike | null;
    parent?: CompiledRoute;
    children?: CompiledRoute[];
};

export type Match = { route: CompiledRoute; params: Record<string, string> };

const toPatternPath = (fullPath: string, _caseSensitive?: boolean) => {
    let path = fullPath.startsWith("/") ? fullPath : `/${fullPath}`;
    if (path === "/*") path = "/:__splat(.*)";
    else if (path.endsWith("/*")) {
        const base = path.slice(0, -2).replace(/\/+$/, "");
        path = (base === "" ? "/" : base) + "/:__splat(.*)";
    }
    return path;
};

const getPathnameForMatch = (pathname: string, caseSensitive?: boolean) =>
    caseSensitive ? pathname : pathname.toLowerCase();
const isViewTransitionSupported = () => typeof (document as any).startViewTransition === "function";

function debug(...args: any[]) {
    try {
        if ((window as any).__REACT_VT_ROUTER_DEBUG__ ?? (window as any).__TINY_ROUTER_DEBUG__) {
            // eslint-disable-next-line no-console
            console.log(...args);
        }
    } catch {}
}

let __rvtVTInjected = false;
function ensureVtCssInjected() {
    if (__rvtVTInjected) return;
    const css = `
/* react-vt-router: built-in view-transition presets */
html[data-vt], html[data-vt]::view-transition-new(root), html[data-vt]::view-transition-old(root) { view-transition-name: root; }

@keyframes art-fade-in { from { opacity: 0.01 } to { opacity: 1 } }
@keyframes art-fade-out { from { opacity: 1 } to { opacity: 0.01 } }
html[data-vt="fade"]::view-transition-new(root) { animation: art-fade-in 250ms ease-out both; }
html[data-vt="fade"]::view-transition-old(root) { animation: art-fade-out 250ms ease-in both; }

@keyframes art-slide-in { from { transform: translateX(100%); opacity: .01 } to { transform: translateX(0); opacity: 1 } }
@keyframes art-slide-out { from { transform: translateX(0); opacity: 1 } to { transform: translateX(-20%); opacity: .01 } }
html[data-vt="slide"] { overflow-x: clip; }
html[data-vt="slide"]::view-transition-new(root) { animation: art-slide-in 500ms cubic-bezier(.2,.8,.2,1) both; }
html[data-vt="slide"]::view-transition-old(root) { animation: art-slide-out 500ms cubic-bezier(.2,.8,.2,1) both; }

@keyframes art-slide-left-in { from { transform: translateX(-100%); opacity: .01 } to { transform: translateX(0); opacity: 1 } }
@keyframes art-slide-left-out { from { transform: translateX(0); opacity: 1 } to { transform: translateX(20%); opacity: .01 } }
html[data-vt="slide-left"] { overflow-x: clip; }
html[data-vt="slide-left"]::view-transition-new(root) { animation: art-slide-left-in 500ms cubic-bezier(.2,.8,.2,1) both; }
html[data-vt="slide-left"]::view-transition-old(root) { animation: art-slide-left-out 500ms cubic-bezier(.2,.8,.2,1) both; }

@keyframes art-slide-right-in { from { transform: translateX(100%); opacity: .01 } to { transform: translateX(0); opacity: 1 } }
@keyframes art-slide-right-out { from { transform: translateX(0); opacity: 1 } to { transform: translateX(-100%); opacity: .01 } }
html[data-vt="slide-right"] { overflow-x: clip; }
html[data-vt="slide-right"]::view-transition-new(root) { animation: art-slide-right-in 500ms cubic-bezier(.2,.8,.2,1) both; }
html[data-vt="slide-right"]::view-transition-old(root) { animation: art-slide-right-out 500ms cubic-bezier(.2,.8,.2,1) both; }

@keyframes art-zoom-in { from { transform: scale(.96); opacity: .01 } to { transform: scale(1); opacity: 1 } }
@keyframes art-zoom-out { from { transform: scale(1); opacity: 1 } to { transform: scale(1.04); opacity: .01 } }
html[data-vt="zoom"]::view-transition-new(root) { animation: art-zoom-in 300ms ease-out both; }
html[data-vt="zoom"]::view-transition-old(root) { animation: art-zoom-out 300ms ease-in both; }

@media (prefers-reduced-motion: reduce) { html[data-vt]::view-transition-new(root), html[data-vt]::view-transition-old(root) { animation: none !important; }}`;
    const style = document.createElement("style");
    style.setAttribute("data-react-vt-router", "vt-presets");
    style.textContent = css;
    document.head.appendChild(style);
    __rvtVTInjected = true;
}

async function startViewTransition(cb: () => void, cfg?: ViewTransitionConfig) {
    ensureVtCssInjected();
    const attr = cfg?.attribute || "data-vt";
    const rootEl = document.documentElement;
    const applyDecorations = () => {
        if (cfg?.name) rootEl.setAttribute(attr, String(cfg.name));
        if (cfg?.className) rootEl.classList.add(cfg.className);
    };
    const clearDecorations = () => {
        if (cfg?.name) rootEl.removeAttribute(attr);
        if (cfg?.className) rootEl.classList.remove(cfg.className);
    };
    cfg?.onStart?.();
    if (isViewTransitionSupported()) {
        try {
            applyDecorations();
            const vt = (document as any).startViewTransition(cb);
            Promise.resolve(vt?.ready)
                .then(() => cfg?.onReady?.())
                .catch(() => {});
            try {
                await vt?.finished;
            } finally {
                clearDecorations();
                cfg?.onFinished?.();
            }
            return;
        } catch {}
    }
    applyDecorations();
    try {
        cb();
    } finally {
        clearDecorations();
        cfg?.onFinished?.();
    }
}

type RouterState = { location: LocationLike };
type RouterContextValue = RouterState & { navigate: NavigateFunction };
const RouterContext = createContext<RouterContextValue | null>(null);
type RouteRenderContextValue = { matches: Match[]; index: number };
const RouteRenderContext = createContext<RouteRenderContextValue | null>(null);
const OutletContext = createContext<any>(undefined);

let routeIdCounter = 0;
const rid = () => `r${++routeIdCounter}`;

function compileRoutes(routes: RouteObject[], parent?: CompiledRoute, parentPath: string = "/"): CompiledRoute[] {
    const compiled: CompiledRoute[] = [];
    for (const r of routes) {
        const id = rid();
        const childPath = r.index ? "" : r.path ?? "";
        const fullPath = r.index
            ? normalize(parentPath)
            : childPath.startsWith("/")
            ? normalize(childPath)
            : normalize(joinPaths(parentPath, childPath || ""));
        const useCase = r.caseSensitive;
        let pattern: URLPatternLike | null = null;
        if (supportsURLPattern()) {
            const pathname = toPatternPath(fullPath, useCase);
            try {
                const Ctor: any = (window as any).URLPattern;
                pattern = new Ctor({ pathname });
            } catch {
                pattern = null;
            }
        }
        const cr: CompiledRoute = { ...r, id, fullPath, pattern, parent, children: undefined };
        if (r.children?.length) cr.children = compileRoutes(r.children, cr, fullPath);
        compiled.push(cr);
    }
    return compiled;
}

function matchRoutes(routes: CompiledRoute[], url: URL): Match[] | null {
    const pathnameRaw = url.pathname || "/";
    try {
        debug("[react-vt-router] matchRoutes start", {
            url: url.toString(),
            pathnameRaw,
            supportsURLPattern: supportsURLPattern(),
        });
    } catch {}
    const attempt = (nodeList: CompiledRoute[], stack: Match[]): Match[] | null => {
        for (const node of nodeList) {
            const caseSensitive = node.caseSensitive;
            const pathname = getPathnameForMatch(pathnameRaw, caseSensitive);
            let isMatch = false;
            let params: Record<string, string> = {};
            try {
                debug("[react-vt-router] try node", {
                    fullPath: node.fullPath,
                    index: !!node.index,
                    hasChildren: !!(node.children && node.children.length),
                });
            } catch {}
            if (node.index) {
                const expected = getPathnameForMatch(node.fullPath, caseSensitive);
                isMatch = pathname === expected;
                try {
                    debug("[react-vt-router] index check", { expected, pathname, isMatch });
                } catch {}
            } else if (node.pattern) {
                try {
                    if (node.children?.length) {
                        let deepPattern: URLPatternLike | undefined = (node as any).__deepPattern;
                        if (!deepPattern && supportsURLPattern()) {
                            try {
                                const Ctor: any = (window as any).URLPattern;
                                const source = node.fullPath === "/" ? "/*" : `${node.fullPath}/*`;
                                const deepPath = toPatternPath(source, node.caseSensitive);
                                deepPattern = new Ctor({ pathname: deepPath });
                                (node as any).__deepPattern = deepPattern;
                            } catch {}
                        }
                        const u = new URL(url.toString());
                        if (!caseSensitive) u.pathname = u.pathname.toLowerCase();
                        try {
                            const exact = node.pattern.exec(u);
                            if (exact) {
                                isMatch = true;
                                params = { ...(exact.pathname.groups as any) };
                            }
                        } catch {}
                        if (!isMatch && deepPattern) {
                            try {
                                const exec = deepPattern.exec(u);
                                if (exec) {
                                    isMatch = true;
                                    const g = (exec.pathname.groups as any) || {};
                                    const { __splat, ...rest } = g;
                                    params = rest;
                                }
                            } catch {}
                        }
                        try {
                            debug("[react-vt-router] pattern parent", {
                                fullPath: node.fullPath,
                                exactTried: true,
                                deepTried: !!deepPattern,
                                isMatch,
                                params,
                            });
                        } catch {}
                        if (!isMatch) {
                            const full = getPathnameForMatch(node.fullPath, caseSensitive);
                            isMatch = pathname === full || pathname.startsWith(full === "/" ? "/" : full + "/");
                            try {
                                debug("[react-vt-router] string parent fallback", { full, pathname, isMatch });
                            } catch {}
                        }
                    } else {
                        const u = new URL(url.toString());
                        if (!caseSensitive) u.pathname = u.pathname.toLowerCase();
                        try {
                            const exec = node.pattern.exec(u);
                            if (exec) {
                                isMatch = true;
                                params = { ...(exec.pathname.groups as any) };
                            }
                        } catch {}
                        if (!isMatch) {
                            const full = getPathnameForMatch(node.fullPath, caseSensitive);
                            isMatch = pathname === full;
                            try {
                                debug("[react-vt-router] string leaf fallback", { full, pathname, isMatch });
                            } catch {}
                        }
                    }
                } catch {}
            } else {
                const full = getPathnameForMatch(node.fullPath, caseSensitive);
                if (node.children?.length) {
                    isMatch = pathname === full || pathname.startsWith(full === "/" ? "/" : full + "/");
                    try {
                        debug("[react-vt-router] no-pattern parent fallback", { full, pathname, isMatch });
                    } catch {}
                } else {
                    isMatch = pathname === full;
                    try {
                        debug("[react-vt-router] no-pattern leaf fallback", { full, pathname, isMatch });
                    } catch {}
                }
            }
            if (!isMatch) continue;
            const nextStack = [...stack, { route: node, params }];
            try {
                debug("[react-vt-router] matched", { fullPath: node.fullPath, params, depth: nextStack.length });
            } catch {}
            if (node.children?.length) {
                const m = attempt(node.children, nextStack);
                if (m) return m;
                continue;
            }
            return nextStack;
        }
        return null;
    };
    return attempt(routes, []);
}

export type BrowserRouterProps = {
    children: ReactNode;
    enableNavigationAPI?: boolean;
    defaultViewTransition?: boolean | string | ViewTransitionConfig;
};

function createLocationLike(state?: any): LocationLike {
    return {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        state: state ?? window.history.state?.usr ?? null,
        key: createKey(),
    };
}

export function BrowserRouter({
    children,
    enableNavigationAPI = false,
    defaultViewTransition,
}: BrowserRouterProps): ReactNode {
    const [location, setLocation] = useState<LocationLike>(() => createLocationLike());
    const latestStateRef = useRef<any>(location.state);
    useEffect(() => {
        latestStateRef.current = location.state;
    }, [location.state]);
    useEffect(() => {
        const onPopState = () => {
            const next = createLocationLike();
            try {
                debug("[react-vt-router] popstate", next);
            } catch {}
            const vtCfg = normalizeVT(defaultViewTransition);
            if (vtCfg !== false) startViewTransition(() => setLocation(next), vtCfg || undefined);
            else setLocation(next);
        };
        const onHashChange = () => {
            const next = createLocationLike();
            try {
                debug("[react-vt-router] hashchange", next);
            } catch {}
            const vtCfg = normalizeVT(defaultViewTransition);
            if (vtCfg !== false) startViewTransition(() => setLocation(next), vtCfg || undefined);
            else setLocation(next);
        };
        window.addEventListener("popstate", onPopState);
        window.addEventListener("hashchange", onHashChange);
        return () => {
            window.removeEventListener("popstate", onPopState);
            window.removeEventListener("hashchange", onHashChange);
        };
    }, [defaultViewTransition]);
    useEffect(() => {
        if (!enableNavigationAPI) return;
        const nav: any = (window as any).navigation;
        if (!nav?.addEventListener) return;
        const handler = (e: any) => {
            if (!e.canIntercept) return;
            const url = new URL(e.destination.url);
            if (url.origin !== window.location.origin) return;
            e.intercept({
                handler: () => {
                    const cfg = normalizeVT(defaultViewTransition);
                    startViewTransition(() => {
                        setLocation(createLocationLike(e.info?.state));
                        if (e.info?.scroll !== false) {
                            window.scrollTo({ top: 0, behavior: "auto" });
                        }
                    }, cfg || undefined);
                },
            });
        };
        nav.addEventListener("navigate", handler);
        return () => nav.removeEventListener("navigate", handler);
    }, [enableNavigationAPI]);
    const navigateBase = useCallback(
        (to: string | number, options: NavigateOptions = {}) => {
            const { replace, state, viewTransition = defaultViewTransition ?? true, scroll = "auto" } = options;
            if (typeof to === "number") {
                window.history.go(to);
                return;
            }
            const url = toURL(to);
            if (url.origin !== window.location.origin) {
                window.location.href = url.toString();
                return;
            }
            const current = new URL(window.location.href);
            if (current.pathname === url.pathname && current.search === url.search && current.hash === url.hash) {
                try {
                    debug("[react-vt-router] navigate no-op (same URL)", url.toString());
                } catch {}
                return;
            }
            const apply = () => {
                try {
                    debug("[react-vt-router] navigate", { to: url.toString(), replace, state, scroll, viewTransition });
                } catch {}
                if (replace) {
                    window.history.replaceState({ usr: state ?? null }, "", url);
                } else {
                    window.history.pushState({ usr: state ?? null }, "", url);
                }
                const next = createLocationLike(state);
                try {
                    debug("[react-vt-router] location set", next);
                } catch {}
                setLocation(next);
                window.scrollTo({ top: 0, behavior: scroll });
            };
            const vtCfg = normalizeVT(viewTransition);
            if (vtCfg !== false) startViewTransition(apply, vtCfg || undefined);
            else apply();
        },
        [defaultViewTransition]
    );
    const navigate = useMemo<NavigateFunction>(() => {
        const fn = ((to: string | number, options?: NavigateOptions) => navigateBase(to, options)) as NavigateFunction;
        fn.back = () => fn(-1);
        fn.forward = () => fn(1);
        fn.go = (delta: number) => fn(delta);
        return fn;
    }, [navigateBase]);
    const ctx = useMemo<RouterContextValue>(() => ({ location, navigate }), [location, navigate]);
    return <RouterContext.Provider value={ctx}>{children}</RouterContext.Provider>;
}

export function useRouterState(): RouterState {
    const ctx = useContext(RouterContext);
    if (!ctx) throw new Error("useRouterState must be used within <BrowserRouter>");
    return { location: ctx.location };
}
export function useLocation(): LocationLike {
    return useRouterState().location;
}
export function useNavigate(): NavigateFunction {
    const ctx = useContext(RouterContext);
    if (!ctx) throw new Error("useNavigate must be used within <BrowserRouter>");
    return ctx.navigate;
}
export function useParams<T extends Record<string, string> = Record<string, string>>() {
    const rctx = useContext(RouteRenderContext);
    if (!rctx) return {} as T;
    const params = useMemo(() => {
        return rctx.matches.reduce<Record<string, string>>((acc, m) => Object.assign(acc, m.params), {});
    }, [rctx.matches]);
    return params as T;
}
export function useSearchParams(): [
    URLSearchParams,
    (
        nextInit: URLSearchParams | string | Record<string, string> | [string, string][],
        options?: { replace?: boolean }
    ) => void
] {
    const { location } = useRouterState();
    const navigate = useNavigate();
    const set = useCallback<
        (
            nextInit: URLSearchParams | string | Record<string, string> | [string, string][],
            options?: { replace?: boolean }
        ) => void
    >(
        (nextInit, options) => {
            let sp: URLSearchParams;
            if (nextInit instanceof URLSearchParams) sp = nextInit;
            else if (typeof nextInit === "string") sp = new URLSearchParams(nextInit);
            else if (Array.isArray(nextInit)) sp = new URLSearchParams(nextInit);
            else sp = new URLSearchParams(Object.entries(nextInit));
            const url = new URL(window.location.href);
            url.search = sp.toString();
            navigate(url.toString(), { replace: options?.replace });
        },
        [navigate]
    );
    return [useMemo(() => new URLSearchParams(location.search), [location.search]), set];
}

export type RouteProps = {
    path?: string;
    index?: boolean;
    element?: ReactNode;
    caseSensitive?: boolean;
    redirectTo?: string;
    children?: ReactNode;
};
export function Route(_props: RouteProps): ReactNode {
    return null;
}
(Route as any).$$reactVtRouterRoute = true;
(Route as any).displayName = "ReactVtRouterRoute";

export type RoutesProps = { children: ReactNode };
function createRoutesFromChildren(children: ReactNode): RouteObject[] {
    const routes: RouteObject[] = [];
    Children.forEach(children, (child) => {
        if (!isValidElement(child)) return;
        const t: any = child.type as any;
        const isRouteEl = t === Route || t?.$$reactVtRouterRoute === true || t?.displayName === "ReactVtRouterRoute";
        const p: any = child.props;
        const looksLikeRouteProps = p && typeof p === "object" && ("path" in p || "index" in p);
        if (!isRouteEl && !looksLikeRouteProps) return;
        const props = child.props as RouteProps;
        const route: RouteObject = {
            path: props.path,
            index: props.index,
            caseSensitive: props.caseSensitive,
            element: props.redirectTo ? <Navigate to={props.redirectTo} replace /> : props.element,
        };
        if (props.children) route.children = createRoutesFromChildren(props.children);
        routes.push(route);
    });
    try {
        debug("[react-vt-router] createRoutesFromChildren:", routes);
    } catch {}
    return routes;
}

export function Routes({ children }: RoutesProps): ReactNode {
    const { location } = useRouterState();
    const routes = useMemo(() => createRoutesFromChildren(children), [children]);
    const compiled = useMemo(() => compileRoutes(routes), [routes]);
    const url = useMemo(() => new URL(window.location.href), [location.key]);
    const matches = useMemo(() => matchRoutes(compiled, url), [compiled, url]);
    try {
        debug("[react-vt-router] Routes snapshot", {
            location,
            url: url.toString(),
            routes,
            compiled: compiled.map((r) => ({
                id: r.id,
                fullPath: r.fullPath,
                index: r.index,
                children: !!(r.children && r.children.length),
            })),
            matches,
        });
    } catch {}
    if (!matches) return null;
    return (
        <RouteRenderContext.Provider value={{ matches, index: 0 }}>
            <RouteRenderer />
        </RouteRenderContext.Provider>
    );
}

function RouteRenderer(): ReactNode {
    const ctx = useContext(RouteRenderContext);
    if (!ctx) return null;
    const { matches, index } = ctx;
    const current = matches[index];
    if (!current) return null;
    const next = (
        <RouteRenderContext.Provider value={{ matches, index: index + 1 }}>
            <Outlet />
        </RouteRenderContext.Provider>
    );
    const el = current.route.element;
    if (!el) return next;
    return (
        <RouteRenderContext.Provider value={{ matches, index: index + 1 }}>
            <>{el}</>
        </RouteRenderContext.Provider>
    );
}

export function Outlet(props?: { context?: any }): ReactNode {
    const ctx = useContext(RouteRenderContext);
    if (!ctx) return null;
    const { matches, index } = ctx;
    const next = matches[index];
    if (!next) return null;
    const el = next.route.element;
    if (!el)
        return (
            <OutletContext.Provider value={props?.context}>
                <RouteRenderContext.Provider value={{ matches, index: index + 1 }}>
                    <Outlet />
                </RouteRenderContext.Provider>
            </OutletContext.Provider>
        );
    return (
        <OutletContext.Provider value={props?.context}>
            <RouteRenderContext.Provider value={{ matches, index: index + 1 }}>
                <>{el}</>
            </RouteRenderContext.Provider>
        </OutletContext.Provider>
    );
}

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    replace?: boolean;
    viewTransition?: boolean | string | ViewTransitionConfig;
    scroll?: ScrollBehavior;
};
export function Link({ to, replace, onClick, target, rel, viewTransition, scroll, ...rest }: LinkProps) {
    const navigate = useNavigate();
    const href = useMemo(() => toURL(to).toString(), [to]);
    const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented) return;
        if ((target && target !== "_self") || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
            return;
        try {
            const u = new URL(href);
            if (u.origin !== window.location.origin) return;
        } catch {
            return;
        }
        e.preventDefault();
        try {
            debug("[react-vt-router] Link intercept", { href, replace, viewTransition, scroll });
        } catch {}
        navigate(href, { replace, viewTransition, scroll });
    };
    return <a {...rest} href={href} onClick={handleClick} target={target} rel={rel} />;
}

export type NavigateProps = {
    to: string | number;
    replace?: boolean;
    state?: any;
    viewTransition?: boolean | string | ViewTransitionConfig;
};
export function Navigate({ to, replace, state, viewTransition = true }: NavigateProps): ReactNode {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(to as any, { replace, state, viewTransition });
    }, [navigate, to, replace, state, viewTransition]);
    return null;
}

export function useRoutes(routeObjects: RouteObject[]): ReactNode {
    const { location } = useRouterState();
    const compiled = useMemo(() => compileRoutes(routeObjects), [routeObjects]);
    const url = useMemo(() => new URL(window.location.href), [location.key]);
    const matches = useMemo(() => matchRoutes(compiled, url), [compiled, url]);
    if (!matches) return null;
    return (
        <RouteRenderContext.Provider value={{ matches, index: 0 }}>
            <RouteRenderer />
        </RouteRenderContext.Provider>
    );
}

export function createRoutesFromElements(children: ReactNode): RouteObject[] {
    return createRoutesFromChildren(children);
}

export type PathPattern = string;
export type PathMatch = { params: Record<string, string>; pathname: string; pattern: PathPattern };
export function useMatch(pattern: PathPattern): PathMatch | null {
    const { location } = useRouterState();
    const url = useMemo(() => new URL(window.location.href), [location.key]);
    if (supportsURLPattern()) {
        try {
            const Ctor: any = (window as any).URLPattern;
            const pathname = toPatternPath(pattern);
            const p: URLPatternLike = new Ctor({ pathname });
            const res = p.exec(url);
            if (res) {
                const params = (res.pathname.groups as any) || {};
                return { params, pathname: url.pathname, pattern };
            }
        } catch {}
    }
    const target = pattern.endsWith("/*") ? pattern.slice(0, -2) : pattern;
    const here = url.pathname;
    if (here === target || (pattern.endsWith("/*") && (here === target || here.startsWith(target + "/"))))
        return { params: {}, pathname: here, pattern };
    return null;
}

export type NavLinkProps = Omit<LinkProps, "className" | "style"> & {
    className?: string | ((args: { isActive: boolean; isPending: boolean }) => string | undefined);
    style?: CSSProperties | ((args: { isActive: boolean; isPending: boolean }) => CSSProperties | undefined);
    end?: boolean;
};
export function NavLink({ className, style, end, ...rest }: NavLinkProps) {
    const toHref = useResolvedPath(rest.to);
    const loc = useLocation();
    const isBase = normalize(toHref);
    const cur = normalize(loc.pathname);
    const isActive = end ? cur === isBase : cur === isBase || cur.startsWith(isBase + "/");
    const computedClass = typeof className === "function" ? className({ isActive, isPending: false }) : className;
    const computedStyle = typeof style === "function" ? style({ isActive, isPending: false }) : style;
    return <Link {...rest} className={computedClass} style={computedStyle} />;
}

export function useOutletContext<T = unknown>(): T {
    return useContext(OutletContext) as T;
}
export function OutletWithContext({ context }: { context?: any }): ReactNode {
    const ctx = useContext(RouteRenderContext);
    if (!ctx) return null;
    const { matches, index } = ctx;
    const next = matches[index];
    if (!next) return null;
    const el = next.route.element;
    return (
        <OutletContext.Provider value={context}>
            <RouteRenderContext.Provider value={{ matches, index: index + 1 }}>
                {el ?? <OutletWithContext />}
            </RouteRenderContext.Provider>
        </OutletContext.Provider>
    );
}
export function useResolvedPath(to: string): string {
    return useMemo(() => toURL(to).pathname + toURL(to).search + toURL(to).hash, [to]);
}

export default {
    BrowserRouter,
    Routes,
    Route,
    Link,
    NavLink,
    Navigate,
    Outlet,
    OutletWithContext,
    useNavigate,
    useLocation,
    useParams,
    useSearchParams,
    useMatch,
    useOutletContext,
    useRoutes,
    createRoutesFromElements,
};
