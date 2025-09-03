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

## 快速开始

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

```ts
const cfg = {
	name: "fade",          // data-vt="fade"
	className: "my-vt",    // 转场期间挂在 html 的类名
	attribute: "data-vt",  // 预设使用的属性名
	onStart(){}, onReady(){}, onFinished(){}
};
```

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

