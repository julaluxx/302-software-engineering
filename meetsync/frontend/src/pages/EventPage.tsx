import { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { useParams } from "react-router-dom";
import { auth, provider } from "../firebase";
import HeatmapGrid from "../components/HeatmapGrid";
import AvailabilityPicker from "../components/AvailabilityPicker";
import {
    finalizeEvent,
    getEvent,
    getOverlap,
    loginWithGoogle,
    submitAvailability,
} from "../services/api";
import AppShell from "../components/layout/AppShell";
import type {
    AvailabilitySlot,
    EventData,
    FinalizedSlot,
    OverlapItem,
    UserInfo,
} from "../types";

export default function EventPage() {
    const { id } = useParams();

    const [event, setEvent] = useState<EventData | null>(null);
    const [token, setToken] = useState("");
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [overlap, setOverlap] = useState<OverlapItem[]>([]);
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
            alert("เข้าสู่ระบบสำเร็จ");
        } catch (error) {
            console.error(error);
            alert("เข้าสู่ระบบไม่สำเร็จ");
        }
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
                alert("กรุณาเลือกเวลาว่างอย่างน้อย 1 ช่วง");
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
        return (
            <div className="container" style={{ padding: 24 }}>
                Loading event...
            </div>
        );
    }

    const isHost = !!userInfo && !!event.hostId && userInfo.uid === event.hostId;
    const isFinalized = event.status === "finalized";

    return (
        <AppShell>
            <section className="page-section">
                <section className="hero">
                    <div className="glass-card hero-main">

                        <h1 className="page-title">{event.title}</h1>

                        <div className="stats">
                            <div className="stat">
                                <strong>{event.dateRange.start}</strong>
                                <span className="muted">วันเริ่มต้น</span>
                            </div>
                            <div className="stat">
                                <strong>
                                    {event.timeRange.start} - {event.timeRange.end}
                                </strong>
                                <span className="muted">ช่วงเวลาที่เปิดให้เลือก</span>
                            </div>
                            <div className="stat">
                                <strong>{event.location}</strong>
                                <span className="muted">สถานที่</span>
                            </div>
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
                            <strong>เวลา:</strong> {event.finalizedSlot.startTime} -{" "}
                            {event.finalizedSlot.endTime}
                        </p>
                        <p>
                            <strong>สถานะ:</strong> finalized
                        </p>
                    </div>
                )}

                <section className="cards-2 page-section">
                    <article className="form-card">
                        <div className="page-header">
                            <h2>ลงเวลาว่าง</h2>
                            <p>
                                เลือกเวลาว่างด้วยการ drag บนตาราง ระบบจะรวม cell ต่อเนื่องให้เป็นช่วงเวลาอัตโนมัติ
                            </p>
                        </div>

                        {userInfo && (
                            <div className="code-card">
                                <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                            </div>
                        )}

                        {!isFinalized && (
                            <div style={{ marginTop: 20 }}>
                                <AvailabilityPicker event={event} onSlotsChange={setSlots} />
                            </div>
                        )}
                    </article>

                    <article className="heatmap-card">
                        <div className="page-header">
                            <h2>Overview</h2>
                        </div>

                        <HeatmapGrid
                            overlap={overlap}
                            isHost={isHost}
                            isFinalized={isFinalized}
                            selectedFinalizeSlot={selectedFinalizeSlot}
                            onSelectSlot={setSelectedFinalizeSlot}
                        />

                        <div className="legend">
                            <span>
                                <i className="legend-1" /> น้อย
                            </span>
                            <span>
                                <i className="legend-2" /> ปานกลาง
                            </span>
                            <span>
                                <i className="legend-3" /> มาก
                            </span>
                            <span>
                                <i className="legend-4" /> มากที่สุด
                            </span>
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
                                            <strong>เวลา:</strong> {selectedFinalizeSlot.startTime} -{" "}
                                            {selectedFinalizeSlot.endTime}
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
                    MeetSync Event Page — Drag to select availability
                </div>
            </section>
        </AppShell>
    );
}