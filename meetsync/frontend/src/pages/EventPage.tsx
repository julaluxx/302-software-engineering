import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";

type EventData = {
    title: string;
    location: string;
    dateRange: {
        start: string;
        end: string;
    };
    timeRange: {
        start: string;
        end: string;
    };
};

type UserInfo = {
    uid: string;
    name: string;
    email: string;
};

type OverlapItem = {
    date: string;
    time: string;
    count: number;
};

type AvailabilitySlot = {
    date: string;
    startTime: string;
    endTime: string;
};

function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function getCellStyle(count: number) {
    let background = "#f3f4f6";

    if (count === 1) background = "#dbeafe";
    if (count === 2) background = "#93c5fd";
    if (count === 3) background = "#60a5fa";
    if (count >= 4) background = "#2563eb";

    return {
        background,
        color: count >= 3 ? "#ffffff" : "#111827",
        border: "1px solid #e5e7eb",
        padding: "8px 10px",
        textAlign: "center" as const,
        borderRadius: 6,
        minWidth: 88,
        fontSize: 14,
        fontWeight: 600,
    };
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

    useEffect(() => {
        async function loadEvent() {
            try {
                const res = await fetch(`http://localhost:3000/api/events/${id}`);
                const data = await res.json();

                if (data.ok) {
                    setEvent(data.event);
                } else {
                    alert(data.message || "โหลด event ไม่สำเร็จ");
                }
            } catch (error) {
                console.error(error);
                alert("โหลด event ไม่สำเร็จ");
            }
        }

        loadEvent();
    }, [id]);

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            const res = await fetch("http://localhost:3000/api/auth/google", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            });

            const data = await res.json();

            if (data.ok) {
                setToken(idToken);
                setUserInfo(data.user);
                alert("login success");
            } else {
                alert(data.message || "login failed");
            }
        } catch (error) {
            console.error(error);
            alert("login failed");
        }
    };

    const handleAddSlot = () => {
        if (!date || !startTime || !endTime) {
            alert("กรุณาเลือกวันและเวลาให้ครบ");
            return;
        }

        if (toMinutes(startTime) >= toMinutes(endTime)) {
            alert("เวลาเริ่มต้องน้อยกว่าเวลาจบ");
            return;
        }

        if (event) {
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

            if (!event) {
                alert("ยังไม่มีข้อมูล event");
                return;
            }

            if (slots.length === 0) {
                alert("กรุณาเพิ่มช่วงเวลาว่างอย่างน้อย 1 ช่วง");
                return;
            }

            const res = await fetch("http://localhost:3000/api/availability", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    eventId: id,
                    slots,
                }),
            });

            const data = await res.json();

            if (data.ok) {
                alert("ส่งเวลาว่างสำเร็จ");
            } else {
                alert(data.message || "submit availability failed");
            }
        } catch (error) {
            console.error(error);
            alert("submit availability failed");
        }
    };

    const loadOverlap = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/events/${id}/overlap`);
            const data = await res.json();

            if (data.ok) {
                setOverlap(data.overlap);
            } else {
                alert(data.message || "load overlap failed");
            }
        } catch (error) {
            console.error(error);
            alert("load overlap failed");
        }
    };

    const groupedOverlap = useMemo(() => {
        const grouped: Record<string, OverlapItem[]> = {};

        for (const item of overlap) {
            if (!grouped[item.date]) {
                grouped[item.date] = [];
            }
            grouped[item.date].push(item);
        }

        for (const key of Object.keys(grouped)) {
            grouped[key].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
        }

        return grouped;
    }, [overlap]);

    if (!event) {
        return <div style={{ padding: 24 }}>Loading event...</div>;
    }

    return (
        <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
            <h1 style={{ marginBottom: 8 }}>{event.title}</h1>

            <p>
                <strong>วันที่:</strong> {event.dateRange.start} - {event.dateRange.end}
            </p>

            <p>
                <strong>เวลา:</strong> {event.timeRange.start} - {event.timeRange.end}
            </p>

            <p>
                <strong>สถานที่:</strong> {event.location}
            </p>

            <hr style={{ margin: "20px 0" }} />

            <button onClick={handleLogin}>Guest Login with Google</button>

            {userInfo && (
                <pre
                    style={{
                        marginTop: 16,
                        padding: 12,
                        background: "#f9fafb",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        overflowX: "auto",
                    }}
                >
                    {JSON.stringify(userInfo, null, 2)}
                </pre>
            )}

            <div
                style={{
                    marginTop: 24,
                    padding: 16,
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: "#ffffff",
                }}
            >
                <h3 style={{ marginTop: 0 }}>เลือกช่วงเวลาว่าง</h3>

                <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
                    <div>
                        <label>Date: </label>
                        <input
                            type="date"
                            value={date}
                            min={event.dateRange.start}
                            max={event.dateRange.end}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label>Start Time: </label>
                        <input
                            type="time"
                            value={startTime}
                            min={event.timeRange.start}
                            max={event.timeRange.end}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>

                    <div>
                        <label>End Time: </label>
                        <input
                            type="time"
                            value={endTime}
                            min={event.timeRange.start}
                            max={event.timeRange.end}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>

                    <div>
                        <button onClick={handleAddSlot}>Add Time Slot</button>
                    </div>
                </div>

                <div style={{ marginTop: 20 }}>
                    <h4 style={{ marginBottom: 10 }}>ช่วงเวลาที่เลือก</h4>

                    {slots.length === 0 ? (
                        <p style={{ color: "#6b7280" }}>ยังไม่มีช่วงเวลาที่เพิ่ม</p>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {slots.map((slot, index) => (
                                <div
                                    key={`${slot.date}-${slot.startTime}-${slot.endTime}-${index}`}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 8,
                                        padding: 12,
                                        background: "#f9fafb",
                                    }}
                                >
                                    <div>
                                        <strong>{slot.date}</strong> | {slot.startTime} - {slot.endTime}
                                    </div>

                                    <button onClick={() => handleRemoveSlot(index)}>Remove</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 16 }}>
                    <button onClick={handleSubmitAvailability}>Submit Availability</button>
                </div>
            </div>

            <div
                style={{
                    marginTop: 24,
                    padding: 16,
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: "#ffffff",
                }}
            >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Availability Overview</h3>
                    <button onClick={loadOverlap}>Load Heatmap Data</button>
                </div>

                {overlap.length === 0 ? (
                    <p style={{ marginTop: 16, color: "#6b7280" }}>
                        ยังไม่มีข้อมูล overlap ให้แสดง
                    </p>
                ) : (
                    <div style={{ marginTop: 20, display: "grid", gap: 20 }}>
                        {Object.entries(groupedOverlap).map(([dateKey, items]) => (
                            <div key={dateKey}>
                                <h4 style={{ marginBottom: 10 }}>{dateKey}</h4>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                                        gap: 8,
                                    }}
                                >
                                    {items.map((item) => (
                                        <div
                                            key={`${item.date}-${item.time}`}
                                            style={getCellStyle(item.count)}
                                            title={`${item.time} ว่าง ${item.count} คน`}
                                        >
                                            <div>{item.time}</div>
                                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                                {item.count} คน
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: 16, fontSize: 13, color: "#4b5563" }}>
                    <div>สีอ่อน = คนน้อยว่าง</div>
                    <div>สีเข้ม = คนว่างมาก</div>
                </div>
            </div>
        </div>
    );
}