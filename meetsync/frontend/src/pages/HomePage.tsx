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

                    {/* <p className="subtitle">
                        MeetSync เป็นแอพจัดเวลานัดหมายกลุ่มที่ช่วยให้ Host สร้าง event,
                        ให้ Guest ลงเวลาว่าง, ดู heatmap และ finalize เวลานัดหมายได้ใน flow เดียว
                    </p> */}

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