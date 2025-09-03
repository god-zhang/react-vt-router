**[English](./README.md) | 简体中文**

# react-vt-router

[![npm version](https://img.shields.io/npm/v/react-vt-router.svg?color=orange)](https://www.npmjs.com/package/react-vt-router)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-vt-router?label=minzip)](https://bundlephobia.com/package/react-vt-router)
[![license](https://img.shields.io/npm/l/react-vt-router.svg)](../LICENSE)

一个基于原生 Web API 构建的轻量 React 路由库：History、URLPattern、View Transitions（可选支持 Navigation API）。在保持体积小的同时，核心用法与 react-router 接近。

## 安装

```bash
npm install react-vt-router
# 或
pnpm add react-vt-router
# 或
yarn add react-vt-router
```

## 快速开始（更详细）

1）布局 Layout（带导航 + Outlet）

```tsx
import { Link, NavLink, Outlet } from "react-vt-router";

function Layout() {
	return (
		<div>
			<nav style={{ display: "flex", gap: 12 }}>
				<Link to="/">首页</Link>
				<NavLink to="/users" className={({ isActive }) => (isActive ? "active" : undefined)}>
					用户
				</NavLink>
			</nav>
			<hr />
			<Outlet />
		</div>
	);
}
```

2）页面 Pages（路由参数 + 查询参数）

```tsx
import { Link, useParams, useSearchParams } from "react-vt-router";

function Home() { return <h2>首页</h2>; }

function Users() {
	const list = [1, 2, 3];
	return (
		<div>
			<h2>用户列表</h2>
			<ul>
				{list.map(id => (
					<li key={id}>
						<Link to={`/users/${id}?tab=profile`}>用户 {id}</Link>
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
			<h3>用户：{id}</h3>
			<div>tab = {sp.get("tab") ?? "-"}</div>
		</div>
	);
}

function NotFound() { return <h2>页面不存在</h2>; }
```

3）接线 Routes（父子嵌套 + 跳转）

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-vt-router";

export default function App() {
	return (
		<BrowserRouter defaultViewTransition="zoom">
			<Routes>
				<Route path="/" element={<Layout />}>{/* 父级路由 + 布局 */}
					<Route index element={<Home />} />      {/* index = 默认子路由 */}
					<Route path="users">
						<Route index element={<Users />} />
						<Route path=":id" element={<UserDetail />} />
					</Route>
					{/* 旧路径重定向 */}
					<Route path="old-home" element={<Navigate to="/" replace />} />
				</Route>
				<Route path="*" element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	);
}
```

4）编程式导航 + 视图转场

```tsx
import { useNavigate } from "react-vt-router";

function Buttons() {
	const navigate = useNavigate();
	return (
		<div style={{ display: "flex", gap: 8 }}>
			<button onClick={() => navigate("/users/1", { viewTransition: "slide" })}>
				去用户 1（slide）
			</button>
			<button onClick={() => navigate.back()}>后退</button>
			<button onClick={() => navigate.forward()}>前进</button>
		</div>
	);
}
```

5）匹配示例（可选）

```tsx
import { useMatch } from "react-vt-router";

function UsersBadge() {
	const match = useMatch("/users/*");
	return match ? <span>Users 区域</span> : null;
}
```

## 特性亮点
- 内置 View Transition 动画：`fade` | `slide` | `slide-left` | `slide-right` | `zoom`
- 基于 URLPattern 的路径匹配，提供稳健的字符串回退方案
- API 与 react-router 核心用法相近
- TypeScript 一等公民，类型与注释友好

## 组件
以下仅列核心用法（类型定义简洁版）。

- BrowserRouter(props)
	- enableNavigationAPI?: boolean（是否拦截 Navigation API，默认 false）
	- defaultViewTransition?: boolean | string | ViewTransitionConfig
		- boolean：true 开启默认转场；false 关闭
		- string：使用内置预设（"fade" | "slide" | "slide-left" | "slide-right" | "zoom"）
		- ViewTransitionConfig：{ name?, className?, attribute?, onStart?, onReady?, onFinished? }

- Routes / Route
	- RouteProps：{ path?: string; index?: boolean; element?: ReactNode; caseSensitive?: boolean; redirectTo?: string }
	- 嵌套路由：在父 Route 下放置子 Route；index 表示父路径的默认子路由。

- Link(props)
	- { to: string; replace?: boolean; viewTransition?: boolean | string | ViewTransitionConfig; scroll?: ScrollBehavior }
	- 拦截同源跳转，支持转场与替换历史、滚动到顶部。

- NavLink(props)
	- 在 Link 基础上增加 isActive 计算。
	- className?: string | (({ isActive, isPending }) => string)
	- style?: CSSProperties | (({ isActive, isPending }) => CSSProperties)
	- end?: boolean（是否严格匹配）

- Navigate(props)
	- { to: string | number; replace?: boolean; state?: any; viewTransition?: boolean | string | ViewTransitionConfig }
	- 渲染后即触发跳转；支持数字 delta（等价 history.go）。

- Outlet / OutletWithContext
	- 渲染子路由出口，可通过 OutletWithContext 传递上下文到下一层。

## Hooks
更接近 react-router 的核心体验：

- useNavigate(): NavigateFunction
	- 调用：navigate(to: string, options?)（options: { replace?, state?, viewTransition?, scroll? }）
	- 便捷：navigate.back()、navigate.forward()、navigate.go(delta)

- useLocation(): { pathname: string; search: string; hash: string; state: any; key: string }

- useParams<T>(): T（合并父子路由动态参数）

- useSearchParams(): [URLSearchParams, set(next, options?)]
	- set 支持 URLSearchParams | string | Record | [string,string][]；options.replace 控制是否替换历史。

- useMatch(pattern: string): { params, pathname, pattern } | null
	- 支持 "/*" 结尾的父级匹配；内部优先 URLPattern，不可用时字符串回退。

- useRoutes(routeObjects: RouteObject[]): ReactNode（对象数组驱动路由）

- useOutletContext<T>(): T
- useResolvedPath(to: string): string

## 视图转场（View Transitions）
- 全局：`<BrowserRouter defaultViewTransition="zoom"/>`
- 局部：`Link`/`navigate(to, { viewTransition })`
- 预设：`fade`、`slide`、`slide-left`、`slide-right`、`zoom`
- 自定义示例：

1）全局配置（默认转场）

```tsx
import { BrowserRouter } from "react-vt-router";

const vt = {
	name: "fade",          // 将在 <html> 节点上设置 attribute="fade"
	className: "vt-running", // 转场期间挂在 <html> 的类名
	attribute: "data-vt",  // 属性名，默认 data-vt
	onStart() { /* 开始前（快照前） */ },
	onReady() { /* DOM 快照完成，可开始渲染新页面 */ },
	onFinished() { /* 转场结束，清理标记 */ },
};

export function App() {
	return (
		<BrowserRouter defaultViewTransition={vt}>
			{/* ...Routes */}
		</BrowserRouter>
	);
}
```

2）每次导航覆盖（Link / navigate）

```tsx
import { Link, useNavigate } from "react-vt-router";

// Link：字符串预设
<Link to="/users/2" viewTransition="slide-right">用户2</Link>

// Link：显式关闭本次转场
<Link to="/" viewTransition={false}>返回首页（无动画）</Link>

// Link：自定义对象
<Link to="/about" viewTransition={{ name: "fade", className: "my-vt" }}>关于</Link>

// 编程式导航：传入对象
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
			去用户3（自定义转场）
		</button>
	);
}
```

3）生命周期钩子

```ts
const vt = {
	name: "fade",
	onStart() {
		console.log("VT start");
	},
	onReady() {
		console.log("VT ready");
	},
	onFinished() {
		console.log("VT finished");
	},
};
```

4）CSS 自定义（示例）

库会在转场期间给 <html> 添加：
- 一个属性（默认 `data-vt`），值为配置的 `name`
- 一个类名（可配置 `className`）

你可以基于此编写样式，或直接使用 View Transitions 的伪元素：

```css
/* 按名称作用域：只有在 fade 转场下才生效 */
html[data-vt="fade"]::view-transition-old(root) {
	animation: fade-out 180ms ease-in both;
}
html[data-vt="fade"]::view-transition-new(root) {
	animation: fade-in 220ms ease-out both;
}

@keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }
@keyframes fade-in  { from { opacity: 0 } to { opacity: 1 } }

/* 也可用类名进行更细粒度控制 */
html.vt-running { /* 转场进行中 */ }
```

5）进阶：按方向切换动画

```tsx
import { useLocation, useNavigate } from "react-vt-router";

function PrevNext({ currentId }: { currentId: number }) {
	const { pathname } = useLocation();
	const navigate = useNavigate();

	const goto = (id: number) => {
		const vtName = id > currentId ? "slide-left" : "slide-right";
		navigate(`/users/${id}`, { viewTransition: vtName });
	};

	return (
		<div style={{ display: "flex", gap: 8 }}>
			<button onClick={() => goto(currentId - 1)}>上一个</button>
			<button onClick={() => goto(currentId + 1)}>下一个</button>
		</div>
	);
}
```

说明：当浏览器不支持 View Transitions API 时，会优雅退化为无动画导航；当 `viewTransition: false` 时，本次导航强制无动画。

## 调试与兼容
- 调试日志：`window.__REACT_VT_ROUTER_DEBUG__ = true`
- 强制字符串回退（禁用 URLPattern）：`window.__REACT_VT_ROUTER_FORCE_STRING__ = true`
- Navigation API 拦截：设置 BrowserRouter 的 `enableNavigationAPI`

## 说明与限制
- 更适合中/小型 SPA：本库追求小而美、零依赖、API 简洁，对中小规模项目可“即插即用”。
- 大型/复杂应用：若需要数据 API（loader/action/defer）、细粒度缓存、错误/懒加载边界、SSR、路由器变体（hash/memory/静态）等高级能力，建议优先选用 react-router。
- 尚未包含：高级数据 API、SSR、hash/memory 路由器等；后续有计划按需补充。
- 兼容性：面向现代浏览器；当 View Transitions / URLPattern 不可用时自动回退到无转场或字符串匹配。

## 协议
MIT

