import { useNavigate } from "react-vt-router";

export default function User() {
    const navigate = useNavigate();
    return (
        <div style={{ padding: 20, width: 100 }}>
            <ul style={{ cursor: "pointer" }}>
                <li onClick={() => navigate.back()}>{"<--"}back</li>
                <li onClick={() => navigate("/users/10")}>user 10</li>
                <li onClick={() => navigate("/users/12")}>user 12</li>
                <li onClick={() => navigate("/users/16")}>user 16</li>
                <li onClick={() => navigate("/users/34")}>user 34</li>
                <li onClick={() => navigate("/users/67")}>user 67</li>
            </ul>
        </div>
    );
}
