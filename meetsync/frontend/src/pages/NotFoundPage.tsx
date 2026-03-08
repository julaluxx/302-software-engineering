import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";

export default function NotFoundPage() {
    return (
        <AppShell>
            <section className="page-section">
                <div className="form-card" style={{ maxWidth: 720, margin: "0 auto" }}>
                    <div className="page-header">
                        <h2>ไม่พบหน้าที่ต้องการ</h2>
                        <p>เส้นทางที่เปิดอยู่อาจไม่ถูกต้อง หรือ event นี้ไม่มีอยู่แล้ว</p>
                    </div>

                    <div className="hero-actions">
                        <Link to="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
                            กลับหน้าแรก
                        </Link>
                    </div>
                </div>
            </section>
        </AppShell>
    );
}