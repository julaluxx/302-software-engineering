import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { createEvent, loginWithGoogle } from "../services/api";
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
        <div className="app-shell">
            <header className="topbar">
                <div className="container topbar-inner">
                    <div className="brand">
                        <div className="brand-badge">✨</div>
                        <div>MeetSync</div>
                    </div>

                    <div className="nav-chips">
                        <div className="chip">Login</div>
                        <div className="chip">Create Event</div>
                        <div className="chip">Dashboard</div>
                        <div className="chip">Finalize</div>
                    </div>
                </div>
            </header>

            <main className="container">
                <section className="hero">
                    <div className="glass-card hero-main">
                        <div className="eyebrow">🌼 นัดหมายแบบอบอุ่น ดูง่าย ใช้งานง่าย</div>

                        <h1 className="page-title">จัดเวลานัดกลุ่มให้ดูสวย ตัดสินใจได้เร็ว</h1>

                        <p className="subtitle">
                            MeetSync เป็นแอปช่วยจัดเวลานัดหมายกลุ่มแบบ Web Application โดยมี flow
                            หลักคือ login, create event, ลงเวลาว่าง, ดู heatmap และ finalize
                            การนัดหมาย แนวหน้าที่ผมจัดให้จะอิงจากต้นแบบ `meetsync-ui.html`
                            ที่ใช้ hero ใหญ่ การ์ดโค้งมน ปุ่ม CTA เด่น และโทนเหลืองนุ่มแบบ cozy
                        </p>

                        <div className="hero-actions">
                            <button className="btn btn-primary" onClick={handleLogin}>
                                Sign in with Google
                            </button>

                            <button
                                className="btn btn-dark"
                                onClick={handleCreateEvent}
                                disabled={!token}
                            >
                                Create Test Event
                            </button>
                        </div>

                        <div className="stats">
                            <div className="stat">
                                <strong>Google Login</strong>
                                <span className="muted">เข้าใช้งานได้ง่าย ไม่ต้องสมัครใหม่</span>
                            </div>
                            <div className="stat">
                                <strong>Heatmap</strong>
                                <span className="muted">ดูเวลาว่างรวมของกลุ่มได้ทันที</span>
                            </div>
                            <div className="stat">
                                <strong>Finalize</strong>
                                <span className="muted">Host เลือกเวลานัดหมายสุดท้ายได้</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card hero-side">
                        <div className="mini-panel">
                            <h3>โครงสร้างหน้า</h3>
                            <p>
                                แยก UI ออกเป็นหน้า host และ guest ให้ตรงกับ flow ในเอกสารที่มีทั้ง
                                Host Flow และ Guest Flow
                            </p>
                        </div>

                        <div className="mini-panel">
                            <h3>สไตล์ที่ใช้</h3>
                            <p>
                                topbar แบบชิป, hero headline ใหญ่, card มน ๆ, ปุ่มหลักสีเหลือง และ
                                panel สรุปข้อมูลแบบอ่านง่าย ตามต้นแบบ HTML ที่คุณอัปโหลด
                            </p>
                        </div>

                        <div className="mini-panel">
                            <h3>Responsive</h3>
                            <p>
                                เอกสาร requirement ระบุว่าระบบต้องใช้งานบนมือถือได้ด้วย
                                ดังนั้น layout นี้จะยุบคอลัมน์อัตโนมัติเมื่อจอแคบ
                            </p>
                        </div>
                    </div>
                </section>

                <section className="cards-2 page-section">
                    <article className="form-card">
                        <div className="page-header">
                            <h2>เริ่มต้นใช้งาน</h2>
                            <p>
                                เข้าสู่ระบบก่อน แล้วสร้างอีเวนต์เพื่อแชร์ลิงก์ให้สมาชิกเข้ามาลงเวลาว่าง
                            </p>
                        </div>

                        <div className="form-stack">
                            <div className="info-box">
                                <strong>ขั้นตอน</strong>
                                <div className="muted" style={{ marginTop: 8 }}>
                                    1. Login ด้วย Google
                                    <br />
                                    2. สร้าง Event
                                    <br />
                                    3. แชร์ลิงก์ให้สมาชิก
                                    <br />
                                    4. ดู Heatmap และ Finalize
                                </div>
                            </div>

                            {userInfo && (
                                <div className="code-card">
                                    <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </article>

                    <article className="list-card">
                        <h3>สถานะปัจจุบัน</h3>
                        <p>
                            เมื่อสร้างอีเวนต์สำเร็จ ลิงก์สำหรับเข้าหน้า event จะปรากฏตรงนี้ เพื่อให้
                            guest เปิดเข้ามาลงเวลาว่างได้ตาม requirement ของ event management
                        </p>

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
                            <div className="info-box">
                                ยังไม่มีอีเวนต์ที่สร้างในรอบนี้
                            </div>
                        )}
                    </article>
                </section>

                <div className="footer-note">
                    MeetSync — Cozy yellow UI based on your uploaded prototype
                </div>
            </main>
        </div>
    );
}