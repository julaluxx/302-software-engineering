import { Link } from "react-router-dom";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function Topbar() {
    const { user } = useAuth();

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <header className="topbar">
            <div className="container topbar-inner">
                <Link to="/" className="brand brand-link">
                    <div className="brand-badge">✨</div>
                    <div>MeetSync</div>
                </Link>

                <nav className="nav-chips">
                    {user ? (
                        <button onClick={handleLogout} className="chip chip-link" style={{ cursor: 'pointer' }}>
                            Logout ({user.displayName || user.email})
                        </button>
                    ) : (
                        <button onClick={handleLogin} className="chip chip-link" style={{ cursor: 'pointer' }}>
                            Login with Google
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}