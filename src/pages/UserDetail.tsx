import { useParams, useSearchParams, useOutletContext } from "react-vt-router";
export default function UserDetail() {
    const { id } = useParams<{ id: string }>();
    const [sp, setSp] = useSearchParams();
    const tab = sp.get("tab") ?? "";
    const ctx = useOutletContext<{ from: string } | undefined>();
    return (
        <div>
            <p>User ID: {id}</p>
            {ctx && <p style={{ color: "#888" }}>From Outlet context: {ctx.from}</p>}
            <p>
                Tab:
                <button style={{ marginLeft: 8 }} onClick={() => setSp({ tab: "info" })}>
                    info
                </button>
                <button style={{ marginLeft: 8 }} onClick={() => setSp({ tab: "posts" })}>
                    posts
                </button>
            </p>
            <p>Active tab: {tab}</p>
        </div>
    );
}
