import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard", { replace: true });
        }
    }, [user, loading, navigate]);

    return (
        <AppShell>
            <section className="hero">
                <div className="glass-card hero-main">

                    <div className="eyebrow">🌼 นัดหมายแบบอบอุ่น ใช้งานง่าย</div>

                    <h1 className="page-title">จัดเวลานัดกลุ่มให้เร็วขึ้นและชัดเจนขึ้น</h1>

                    <div className="stats">
                        <div className="stat">
                            <strong>Login</strong>
                            <span className="muted">เข้าสู่ระบบด้วย Google</span>
                        </div>
                        <div className="stat">
                            <strong>Availability</strong>
                            <span className="muted">เลือกเวลาว่างด้วย drag grid</span>
                        </div>
                        <div className="stat">
                            <strong>Finalize</strong>
                            <span className="muted">รับอีเมลแจ้งเตือนการนัดหมาย</span>
                        </div>
                    </div>
                </div>
            </section>
        </AppShell>
    );
}