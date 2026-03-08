import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { getMyEvents } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { EventData } from "../types";

export default function DashboardPage() {
    const { userInfo, token, loading } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventData[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);

    useEffect(() => {
        if (!loading && !userInfo) {
            navigate("/");
            return;
        }

        const fetchEvents = async () => {
            if (token) {
                try {
                    const data = await getMyEvents(token);
                    setEvents(data.events || []);
                } catch (error) {
                    console.error("Failed to fetch events", error);
                } finally {
                    setIsLoadingEvents(false);
                }
            }
        };

        if (token) {
            fetchEvents();
        }
    }, [userInfo, token, loading, navigate]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
    }

    if (!userInfo) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="container topbar-inner">
                    <div className="brand" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
                        <div className="brand-badge">✨</div>
                        <div>MeetSync</div>
                    </div>

                    <div className="nav-chips">
                        <div className="chip user-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{userInfo.name.split(' ')[0]}</span>
                        </div>
                        <button className="chip btn-logout" onClick={handleLogout} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid currentColor', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>แดชบอร์ด (อีเวนต์ของคุณ)</h2>
                    <button className="btn btn-primary" onClick={() => navigate("/create")}>
                        + สร้างอีเวนต์ใหม่
                    </button>
                </div>

                {isLoadingEvents ? (
                    <div style={{ textAlign: "center", padding: "2rem" }}>กำลังโหลดข้อมูล...</div>
                ) : events.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "3rem" }}>
                        <h3 style={{ marginBottom: "1rem" }}>ยังไม่มีอีเวนต์</h3>
                        <p className="muted" style={{ marginBottom: "2rem" }}>เริ่มสร้างอีเวนต์แรกของคุณเพื่อหาเวลาว่างร่วมกับเพื่อนๆ</p>
                        <button className="btn btn-primary" onClick={() => navigate("/create")}>
                            สร้างอีเวนต์เลย
                        </button>
                    </div>
                ) : (
                    <div className="cards-2">
                        {events.map((event) => (
                            <div key={event.eventId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3>{event.title}</h3>
                                
                                <div className="info-box" style={{ flexGrow: 1 }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <strong>วันที่: </strong> 
                                        {new Date(event.dateRange.start).toLocaleDateString("th-TH")} - {new Date(event.dateRange.end).toLocaleDateString("th-TH")}
                                    </div>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <strong>เวลา: </strong> {event.timeRange.start} - {event.timeRange.end}
                                    </div>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <strong>สถานที่: </strong> {event.location || "-"}
                                    </div>
                                    <div>
                                        <strong>สถานะ: </strong> 
                                        <span style={{ 
                                            display: 'inline-block', 
                                            padding: '2px 8px', 
                                            borderRadius: '12px', 
                                            fontSize: '0.85rem',
                                            backgroundColor: event.status === 'finalized' ? '#e6f4ea' : '#fff3e0',
                                            color: event.status === 'finalized' ? '#137333' : '#e65100',
                                            fontWeight: 'bold'
                                        }}>
                                            {event.status === 'finalized' ? 'สรุปเวลาแล้ว' : 'เปิดให้โหวต'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                    <button 
                                        className="btn btn-dark" 
                                        style={{ flex: 1, padding: '0.5rem' }}
                                        onClick={() => navigate(`/event/${event.eventId}`)}
                                    >
                                        จัดการ
                                    </button>
                                    <button 
                                        className="btn" 
                                        style={{ flex: 1, padding: '0.5rem', border: '1px solid currentColor', background: 'transparent' }}
                                        onClick={() => {
                                            navigator.clipboard.writeText(`http://localhost:5173/event/${event.eventId}`);
                                            alert("คัดลอกลิงก์สำเร็จ");
                                        }}
                                    >
                                        แชร์ลิงก์
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
