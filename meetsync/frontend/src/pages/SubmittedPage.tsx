import { Link, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";

export default function SubmittedPage() {
    const { id } = useParams();

    return (
        <AppShell>
            <section className="page-section">
                <div className="form-card" style={{ maxWidth: 720, margin: "0 auto" }}>
                    <div className="page-header">
                        <h2>ส่งเวลาว่างสำเร็จ</h2>
                        <p>
                            ระบบได้รับ availability ของคุณแล้ว สามารถกลับไปดูหน้า event ได้ทุกเมื่อ
                        </p>
                    </div>

                    <div className="hero-actions justify-center">
                        <Link to={`/event/${id}`} className="btn btn-primary" style={{ textDecoration: "none" }}>
                            กลับไปหน้า Event
                        </Link>

                        <Link to="/" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                            กลับหน้าแรก
                        </Link>
                    </div>
                </div>
            </section>
        </AppShell>
    );
}