import { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { useParams } from "react-router-dom";
import { auth, provider } from "../firebase";
import HeatmapGrid from "../components/HeatmapGrid";
import {
    finalizeEvent,
    getEvent,
    getOverlap,
    loginWithGoogle,
    submitAvailability,
} from "../services/api";
import type {
    AvailabilitySlot,
    EventData,
    FinalizedSlot,
    OverlapItem,
    UserInfo,
} from "../types";

function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

export default function EventPage() {
    const { id } = useParams();

    const [event, setEvent] = useState<EventData | null>(null);
    const [token, setToken] = useState("");
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [overlap, setOverlap] = useState<OverlapItem[]>([]);

    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [selectedFinalizeSlot, setSelectedFinalizeSlot] =
        useState<FinalizedSlot | null>(null);

    const loadEventData = async () => {
        try {
            if (!id) return;
            const data = await getEvent(id);
            setEvent(data.event);
        } catch (error) {
            console.error(error);
            alert("โหลด event ไม่สำเร็จ");
        }
    };

    useEffect(() => {
        loadEventData();
    }, [id]);

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            const data = await loginWithGoogle(idToken);

            setToken(idToken);
            setUserInfo(data.user);
            alert("login success");
        } catch (error) {
            console.error(error);
            alert("login failed");
        }
    };

    const handleAddSlot = () => {
        if (!event) return;

        if (!date || !startTime || !endTime) {
            alert("กรุณาเลือกวันและเวลาให้ครบ");
            return;
        }

        if (toMinutes(startTime) >= toMinutes(endTime)) {
            alert("เวลาเริ่มต้องน้อยกว่าเวลาจบ");
            return;
        }

        if (date < event.dateRange.start || date > event.dateRange.end) {
            alert("วันที่ต้องอยู่ในช่วงวันของ event");
            return;
        }

        if (
            toMinutes(startTime) < toMinutes(event.timeRange.start) ||
            toMinutes(endTime) > toMinutes(event.timeRange.end)
        ) {
            alert("เวลาที่เลือกต้องอยู่ในช่วงเวลาของ event");
            return;
        }

        const newSlot: AvailabilitySlot = {
            date,
            startTime,
            endTime,
        };

        setSlots((prev) => [...prev, newSlot]);
        setStartTime("");
        setEndTime("");
    };

    const handleRemoveSlot = (indexToRemove: number) => {
        setSlots((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmitAvailability = async () => {
        try {
            if (!token) {
                alert("กรุณา login ก่อน");
                return;
            }

            if (!id) {
                alert("ไม่พบ eventId");
                return;
            }

            if (slots.length === 0) {
                alert("กรุณาเพิ่มช่วงเวลาว่างอย่างน้อย 1 ช่วง");
                return;
            }

            await submitAvailability(token, id, slots);
            alert("ส่งเวลาว่างสำเร็จ");
        } catch (error) {
            console.error(error);
            alert("submit availability failed");
        }
    };

    const handleLoadOverlap = async () => {
        try {
            if (!id) return;
            const data = await getOverlap(id);
            setOverlap(data.overlap);
        } catch (error) {
            console.error(error);
            alert("load overlap failed");
        }
    };

    const handleFinalize = async () => {
        try {
            if (!token) {
                alert("กรุณา login ก่อน");
                return;
            }

            if (!id) {
                alert("ไม่พบ eventId");
                return;
            }

            if (!selectedFinalizeSlot) {
                alert("กรุณาเลือกช่วงเวลาจาก Heatmap ก่อน");
                return;
            }

            const data = await finalizeEvent(token, id, selectedFinalizeSlot);
            setEvent(data.event);
            alert("Finalize สำเร็จ");
        } catch (error) {
            console.error(error);
            alert("finalize failed");
        }
    };

    if (!event) {
        return <div className="container" style={{ padding: 24 }}>Loading event...</div>;
    }

    const isHost = !!userInfo && !!event.hostId && userInfo.uid === event.hostId;
    const isFinalized = event.status === "finalized";

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="container topbar-inner">
                    <div className="brand">
                        <div className="brand-badge">✨</div>
                        <div>MeetSync</div>
                    </div>

                    <div className="nav-chips">
                        <div className="chip">Event</div>
                        <div className="chip">Availability</div>
                        <div className="chip">Heatmap</div>
                        <div className="chip">Finalize</div>
                    </div>
                </div>
            </header>

            <main className="container">
                <section className="hero">
                    <div className="glass-card hero-main">
                        <div className="eyebrow">🗓️ Group Meeting Scheduler</div>

                        <h1 className="page-title">{event.title}</h1>

                        <p className="subtitle">
                            ผู้ใช้ต้องลงเวลาว่างผ่านอินเทอร์เฟซปฏิทิน และระบบต้องแสดง Heatmap
                            ภาพรวมเพื่อช่วยให้ host เลือกเวลาที่เหมาะสมที่สุด
                        </p>

                        <div className="stats">
                            <div className="stat">
                                <strong>{event.dateRange.start}</strong>
                                <span className="muted">วันเริ่มต้น</span>
                            </div>
                            <div className="stat">
                                <strong>{event.timeRange.start} - {event.timeRange.end}</strong>
                                <span className="muted">ช่วงเวลา</span>
                            </div>
                            <div className="stat">
                                <strong>{event.location}</strong>
                                <span className="muted">สถานที่</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card hero-side">
                        <div className="mini-panel">
                            <h3>การใช้งาน</h3>
                            <p>Guest เข้าลิงก์เพื่อเพิ่มเวลาว่าง ส่วน Host สามารถดู heatmap และ finalize ได้</p>
                        </div>

                        <div className="mini-panel">
                            <h3>Heatmap</h3>
                            <p>
                                ระบบแสดงภาพรวมเวลาว่างของกลุ่มแบบสีเข้ม-อ่อนเพื่อช่วยตัดสินใจ
                            </p>
                        </div>

                        <div className="mini-panel">
                            <h3>สิทธิ์ของ Host</h3>
                            <p>เฉพาะ host เท่านั้นที่กด Finalize เวลานัดหมายสุดท้ายได้</p>
                        </div>
                    </div>
                </section>

                {isFinalized && event.finalizedSlot && (
                    <div className="status-box">
                        <h3 style={{ marginTop: 0 }}>เวลานัดหมายที่ยืนยันแล้ว</h3>
                        <p>
                            <strong>วันที่:</strong> {event.finalizedSlot.date}
                        </p>
                        <p>
                            <strong>เวลา:</strong> {event.finalizedSlot.startTime} - {event.finalizedSlot.endTime}
                        </p>
                        <p>
                            <strong>สถานะ:</strong> finalized
                        </p>
                    </div>
                )}

                <section className="cards-2 page-section">
                    <article className="form-card">
                        <div className="page-header">
                            <h2>เข้าร่วมและลงเวลาว่าง</h2>
                            <p>
                                เพิ่มช่วงเวลาว่างได้หลายช่วง และระบบจะนำไปคำนวณ overlap
                                เป็นช่วงละ 15 นาทีตาม logic ที่คุณออกแบบไว้ก่อนหน้า
                            </p>
                        </div>

                        <div className="hero-actions">
                            <button className="btn btn-primary" onClick={handleLogin}>
                                Guest Login with Google
                            </button>
                        </div>

                        {userInfo && (
                            <div className="code-card">
                                <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                            </div>
                        )}

                        {!isFinalized && (
                            <>
                                <div className="form-stack" style={{ marginTop: 18 }}>
                                    <div>
                                        <label className="label">Date</label>
                                        <input
                                            className="input"
                                            type="date"
                                            value={date}
                                            min={event.dateRange.start}
                                            max={event.dateRange.end}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-grid">
                                        <div>
                                            <label className="label">Start Time</label>
                                            <input
                                                className="input"
                                                type="time"
                                                value={startTime}
                                                min={event.timeRange.start}
                                                max={event.timeRange.end}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="label">End Time</label>
                                            <input
                                                className="input"
                                                type="time"
                                                value={endTime}
                                                min={event.timeRange.start}
                                                max={event.timeRange.end}
                                                onChange={(e) => setEndTime(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="hero-actions" style={{ marginTop: 0 }}>
                                        <button className="btn btn-secondary" onClick={handleAddSlot}>
                                            Add Time Slot
                                        </button>
                                        <button className="btn btn-dark" onClick={handleSubmitAvailability}>
                                            Submit Availability
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: 20 }}>
                                    <h3>ช่วงเวลาที่เลือก</h3>

                                    {slots.length === 0 ? (
                                        <p className="muted">ยังไม่มีช่วงเวลาที่เพิ่ม</p>
                                    ) : (
                                        <div className="slot-list">
                                            {slots.map((slot, index) => (
                                                <div
                                                    key={`${slot.date}-${slot.startTime}-${slot.endTime}-${index}`}
                                                    className="slot-item"
                                                >
                                                    <div>
                                                        <strong>{slot.date}</strong> | {slot.startTime} - {slot.endTime}
                                                    </div>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => handleRemoveSlot(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </article>

                    <article className="heatmap-card">
                        <div className="page-header">
                            <h2>Availability Overview</h2>
                            <p>
                                หน้าสรุปมี heatmap, สมาชิก, ช่วงเวลาที่แนะนำ และ action card
                                ตามแนวทางในต้นแบบ HTML ของคุณ
                            </p>
                        </div>

                        <div className="heatmap-actions">
                            <button className="btn btn-primary" onClick={handleLoadOverlap}>
                                Load Heatmap Data
                            </button>
                        </div>

                        <HeatmapGrid
                            overlap={overlap}
                            isHost={isHost}
                            isFinalized={isFinalized}
                            selectedFinalizeSlot={selectedFinalizeSlot}
                            onSelectSlot={setSelectedFinalizeSlot}
                        />

                        <div className="legend">
                            <span><i className="legend-1" /> น้อย</span>
                            <span><i className="legend-2" /> ปานกลาง</span>
                            <span><i className="legend-3" /> มาก</span>
                            <span><i className="legend-4" /> มากที่สุด</span>
                        </div>

                        {isHost && !isFinalized && (
                            <div className="finalize-box">
                                <h3>Finalize Event</h3>

                                {selectedFinalizeSlot ? (
                                    <div className="info-box">
                                        <p>
                                            <strong>วันที่:</strong> {selectedFinalizeSlot.date}
                                        </p>
                                        <p>
                                            <strong>เวลา:</strong> {selectedFinalizeSlot.startTime} - {selectedFinalizeSlot.endTime}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="muted">ยังไม่ได้เลือกช่วงเวลาจาก heatmap</p>
                                )}

                                <div className="hero-actions">
                                    <button className="btn btn-dark" onClick={handleFinalize}>
                                        Finalize Meeting
                                    </button>
                                </div>
                            </div>
                        )}
                    </article>
                </section>

                <div className="footer-note">
                    MeetSync Event Page — Cozy yellow dashboard
                </div>
            </main>
        </div>
    );
}