import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth, provider } from "../firebase";
import { createEvent, loginWithGoogle } from "../services/api";
import AppShell from "../components/layout/AppShell";
import type { EventData, UserInfo } from "../types";

export default function HomePage() {
    const [token, setToken] = useState("");
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [createdEvent, setCreatedEvent] = useState<EventData | null>(null);

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            const data = await loginWithGoogle(idToken);

            setToken(idToken);
            setUserInfo(data.user);
            alert("เข้าสู่ระบบสำเร็จ");
        } catch (error) {
            console.error(error);
            alert("เข้าสู่ระบบไม่สำเร็จ");
        }
    };

    const handleCreateEvent = async () => {
        try {
            if (!token) {
                alert("กรุณา login ก่อน");
                return;
            }

            const data = await createEvent(token, {
                title: "ประชุมโปรเจกต์ MeetSync",
                dateRange: {
                    start: "2026-03-10",
                    end: "2026-03-12",
                },
                timeRange: {
                    start: "09:00",
                    end: "18:00",
                },
                location: "Google Meet",
            });

            setCreatedEvent(data.event);
            alert("สร้างอีเวนต์สำเร็จ");
        } catch (error) {
            console.error(error);
            alert("สร้างอีเวนต์ไม่สำเร็จ");
        }
    };

    return (
        <AppShell>
            <section className="hero">
                <div className="glass-card hero-main">
                    <div className="eyebrow">🌼 นัดหมายแบบอบอุ่น ใช้งานง่าย</div>

                    <h1 className="page-title">จัดเวลานัดกลุ่มให้เร็วขึ้นและชัดเจนขึ้น</h1>

                    <p className="subtitle">
                        MeetSync เป็นแอพจัดเวลานัดหมายกลุ่มที่ช่วยให้ Host สร้าง event,
                        ให้ Guest ลงเวลาว่าง, ดู heatmap และ finalize เวลานัดหมายได้ใน flow เดียว
                    </p>

                    <div className="hero-actions">
                        <button className="btn btn-primary" onClick={handleLogin}>
                            Sign in with Google
                        </button>

                        <Link to="/create" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                            Go to Create Event
                        </Link>

                        <button className="btn btn-dark" onClick={handleCreateEvent} disabled={!token}>
                            Quick Create Test Event
                        </button>
                    </div>

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
                            <span className="muted">Host ยืนยันเวลานัดสุดท้ายได้</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card hero-side">
                    <div className="mini-panel">
                        <h3>เริ่มต้นเร็ว</h3>
                        <p>ถ้าจะสร้าง event จริง แนะนำให้ไปหน้า Create Event โดยตรง</p>
                    </div>

                    <div className="mini-panel">
                        <h3>โครงสร้างแอพ</h3>
                        <p>แยกหน้า Home, Create, Event, Submitted และ Not Found ชัดเจน</p>
                    </div>

                    <div className="mini-panel">
                        <h3>สถานะผู้ใช้</h3>
                        <p>{token ? "เข้าสู่ระบบแล้ว" : "ยังไม่ได้เข้าสู่ระบบ"}</p>
                    </div>
                </div>
            </section>

            <section className="cards-2 page-section">
                <article className="form-card">
                    <div className="page-header">
                        <h2>ข้อมูลผู้ใช้</h2>
                        <p>แสดงข้อมูลหลัง login สำเร็จ</p>
                    </div>

                    {userInfo ? (
                        <div className="code-card">
                            <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                        </div>
                    ) : (
                        <div className="info-box">ยังไม่มีข้อมูลผู้ใช้ใน session นี้</div>
                    )}
                </article>

                <article className="list-card">
                    <div className="page-header">
                        <h2>Event ล่าสุด</h2>
                        <p>แสดงอีเวนต์ที่เพิ่งสร้างล่าสุด</p>
                    </div>

                    {createdEvent ? (
                        <div className="link-card">
                            <p>
                                <strong>Event ID:</strong> {createdEvent.eventId}
                            </p>
                            <p>
                                <strong>Share link:</strong>
                            </p>
                            <a href={createdEvent.shareLink} target="_blank" rel="noreferrer">
                                {createdEvent.shareLink}
                            </a>
                        </div>
                    ) : (
                        <div className="info-box">ยังไม่มี event ที่สร้างในรอบนี้</div>
                    )}
                </article>
            </section>
        </AppShell>
    );
}