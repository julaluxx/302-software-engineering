import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import AppShell from "../components/layout/AppShell";
import SectionCard from "../components/layout/SectionCard";
import CreateEventForm from "../components/event/CreateEventForm";
import { auth, provider } from "../firebase";
import { createEvent, loginWithGoogle } from "../services/api";
import type { EventData, UserInfo } from "../types";

export default function CreateEventPage() {
    const navigate = useNavigate();

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

    const handleCreate = async (payload: {
        title: string;
        dateRange: { start: string; end: string };
        timeRange: { start: string; end: string };
        location: string;
    }) => {
        try {
            if (!token) {
                alert("กรุณา login ก่อน");
                return;
            }

            const data = await createEvent(token, payload);
            setCreatedEvent(data.event);
            alert("สร้างอีเวนต์สำเร็จ");
        } catch (error) {
            console.error(error);
            alert("สร้างอีเวนต์ไม่สำเร็จ");
        }
    };

    return (
        <AppShell>
            <section className="page-section">
                <div className="cards-2">
                    <SectionCard
                        title="Create Event"
                        description="สร้างอีเวนต์ใหม่โดยกำหนดชื่อ ช่วงวันที่ ช่วงเวลา และสถานที่"
                    >

                        {userInfo && (
                            <div className="code-card">
                                <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                            </div>
                        )}

                        <div style={{ marginTop: 20 }}>
                            <CreateEventForm onSubmit={handleCreate} />
                        </div>
                    </SectionCard>

                    {/* <SectionCard
                        title="Event Preview"
                        description="หลังสร้างเสร็จ ระบบจะแสดงลิงก์สำหรับแชร์ให้ผู้เข้าร่วม"
                    >
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

                                <div className="hero-actions" style={{ marginTop: 16 }}>
                                    <button
                                        className="btn btn-dark"
                                        onClick={() => navigate(`/event/${createdEvent.eventId}`)}
                                    >
                                        Open Event Page
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="info-box">ยังไม่มี event ที่สร้างในรอบนี้</div>
                        )}
                    </SectionCard> */}
                </div>
            </section>
        </AppShell>
    );
}