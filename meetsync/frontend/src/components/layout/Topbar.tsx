import { Link } from "react-router-dom";

export default function Topbar() {
    return (
        <header className="topbar">
            <div className="container topbar-inner">
                <Link to="/" className="brand brand-link">
                    <div className="brand-badge">✨</div>
                    <div>MeetSync</div>
                </Link>

                <nav className="nav-chips">
                    <Link to="/" className="chip chip-link">Home</Link>
                    {/* <Link to="/create" className="chip chip-link">Create Event</Link> */}
                </nav>
            </div>
        </header>
    );
}