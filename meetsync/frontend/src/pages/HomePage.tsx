import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { loginWithGoogle } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function HomePage() {
    const { userInfo, loading } = useAuth();
    const navigate = useNavigate();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        if (!loading && userInfo) {
            navigate("/dashboard");
        }
    }, [userInfo, loading, navigate]);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            await loginWithGoogle(idToken);
            // After successful login, the AuthContext listener will update state 
            // and the useEffect will trigger navigation to /dashboard
        } catch (error) {
            console.error(error);
            alert("เข้าสู่ระบบไม่สำเร็จ");
            setIsLoggingIn(false);
        }
    };

    if (loading) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
    }

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="container topbar-inner">
                    <div className="brand">
                        <div className="brand-badge">✨</div>
                        <div>MeetSync</div>
                    </div>

                    <div className="nav-chips">
                        <button className="chip" onClick={handleLogin} disabled={isLoggingIn} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid currentColor', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}>
                            {isLoggingIn ? "Logging in..." : "Login"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container">
                <section className="hero">
                    <div className="glass-card hero-main" style={{ margin: '0 auto', maxWidth: '800px', width: '100%' }}>
                        <div className="eyebrow">🌼 นัดหมายแบบอบอุ่น ดูง่าย ใช้งานง่าย</div>

                        <h1 className="page-title">หาเวลาที่ทุกคนว่างตรงกัน ได้อย่างง่ายดาย</h1>

                        <p className="subtitle">
                            MeetSync เป็นแอปช่วยจัดการเวลานัดหมายกลุ่ม โหวตเวลาว่าง ดูผลรวมแบบ Heatmap และตัดสินใจเลือกเวลาที่เหมาะสมที่สุดได้ทันที
                        </p>

                        <div className="hero-actions" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={handleLogin} disabled={isLoggingIn}>
                                {isLoggingIn ? "Signing in..." : "Sign in with Google"}
                            </button>
                        </div>

                        <div className="stats" style={{ justifyContent: 'center' }}>
                            <div className="stat">
                                <strong>Google Login</strong>
                                <span className="muted">เข้าใช้งานได้ทันที</span>
                            </div>
                            <div className="stat">
                                <strong>Heatmap</strong>
                                <span className="muted">ดูเวลาว่างรวมของกลุ่ม</span>
                            </div>
                            <div className="stat">
                                <strong>Finalize</strong>
                                <span className="muted">สรุปเวลานัดหมาย</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}