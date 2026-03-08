import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function CreateEventPage() {
    const { token, loading, userInfo } = useAuth();
    const navigate = useNavigate();

    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState("นัดประชุมใหม่");
    const [location, setLocation] = useState("Google Meet / Online");
    
    // Default dates (today to next week)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const [startDate, setStartDate] = useState(today.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(nextWeek.toISOString().split("T")[0]);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");

    useEffect(() => {
        if (!loading && !userInfo) {
            navigate("/");
        }
    }, [userInfo, loading, navigate]);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            alert("กรุณา login ก่อน");
            return;
        }

        setIsCreating(true);

        try {
            const data = await createEvent(token, {
                title,
                location,
                dateRange: {
                    start: startDate,
                    end: endDate,
                },
                timeRange: {
                    start: startTime,
                    end: endTime,
                },
            });

            // Redirect to the event management page after creation
            navigate(`/event/${data.event.eventId}`);
        } catch (error) {
            console.error(error);
            alert("สร้างอีเวนต์ไม่สำเร็จ");
            setIsCreating(false);
        }
    };

    if (loading || !userInfo) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
    }

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="container topbar-inner">
                    <div className="brand" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
                        <div className="brand-badge">✨</div>
                        <div>MeetSync</div>
                    </div>
                </div>
            </header>

            <main className="container" style={{ padding: '2rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
                <button 
                    onClick={() => navigate("/dashboard")} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}
                >
                    &larr; กลับไปหน้าแดชบอร์ด
                </button>

                <div className="glass-card">
                    <h2 style={{ marginBottom: "1.5rem" }}>สร้างอีเวนต์ใหม่</h2>
                    
                    <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>ชื่ออีเวนต์</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                required 
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
                                placeholder="เช่น นัดประชุมโปรเจกต์, กินข้าวแก๊งเพื่อน"
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>สถานที่ หรือ ลิงก์</label>
                            <input 
                                type="text" 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
                                placeholder="เช่น Google Meet, ร้านอาหาร"
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>วันเริ่มต้น</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    required 
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>วันสิ้นสุด</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    required 
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>เวลาเริ่มต้นที่ให้เลือก</label>
                                <input 
                                    type="time" 
                                    value={startTime} 
                                    onChange={(e) => setStartTime(e.target.value)} 
                                    required 
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>เวลาสิ้นสุดที่ให้เลือก</label>
                                <input 
                                    type="time" 
                                    value={endTime} 
                                    onChange={(e) => setEndTime(e.target.value)} 
                                    required 
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={isCreating}
                            style={{ padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}
                        >
                            {isCreating ? "กำลังสร้าง..." : "สร้างอีเวนต์"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
