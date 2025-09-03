import "./App.css";
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, Outlet, useLocation } from "react-vt-router";

import Home from "./pages/Home.tsx";
import About from "./pages/About.tsx";
import NotFound from "./pages/Notfound.tsx";
import Users from "./pages/Users.tsx";
import UserDetail from "./pages/UserDetail.tsx";

function Layout() {
    const loc = useLocation();
    return (
        <div style={{ padding: 16 }}>
            <h1>react-vt-router demo</h1>
            <nav style={{ display: "flex", gap: 12 }}>
                <NavLink
                    to="/"
                    end
                    style={(args: { isActive: boolean; isPending: boolean }) => ({
                        fontWeight: args.isActive ? 700 : 400,
                    })}
                >
                    Home
                </NavLink>
                <NavLink
                    to="/about"
                    style={(args: { isActive: boolean; isPending: boolean }) => ({
                        fontWeight: args.isActive ? 700 : 400,
                    })}
                >
                    About
                </NavLink>
                <NavLink
                    to="/users"
                    style={(args: { isActive: boolean; isPending: boolean }) => ({
                        fontWeight: args.isActive ? 700 : 400,
                    })}
                >
                    Users
                </NavLink>
                <Link to="/users/42?tab=info" viewTransition>
                    User #42
                </Link>
                <Link to="/old-home" viewTransition>
                    Old Home (redirect)
                </Link>
            </nav>
            <p style={{ color: "#667", fontSize: 12 }}>
                Current: {loc.pathname}
                {loc.search}
            </p>
            <hr />
            <Outlet />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter defaultViewTransition="fade">
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="users">
                        <Route index element={<Users />} />
                        <Route path=":id" element={<UserDetail />} />
                    </Route>
                    <Route path="old-home" element={<Navigate to="/" replace />} />
                </Route>
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
