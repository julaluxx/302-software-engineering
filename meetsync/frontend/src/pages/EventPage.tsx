import { useEffect, useState } from "react";
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

export default function EventPage() {
    const { id } = useParams();
    const [event, setEvent] = useState<EventData | null>(null);
    const [token, setToken] = useState("");
    const [userInfo, setUserInfo] = useState<any>(null);
    const [overlap, setOverlap] = useState<any[]>([]);

    useEffect(() => {
        async function loadEvent() {
            const res = await fetch(`http://localhost:3000/api/events/${id}`);
            const data = await res.json();

            if (data.ok) {
                setEvent(data.event);
            } else {
                alert(data.message || "โหลด event ไม่สำเร็จ");
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

            const res = await fetch("http://localhost:3000/api/availability", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    eventId: id,
                    slots: [
                        {
                            date: event.dateRange.start,
                            startTime: "10:00",
                            endTime: "12:00",
                        },
                        {
                            date: event.dateRange.start,
                            startTime: "14:00",
                            endTime: "16:00",
                        },
                    ],
                }),
            });

            const data = await res.json();
            alert(JSON.stringify(data, null, 2));
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

    if (!event) {
        return <div style={{ padding: 24 }}>Loading event...</div>;
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>{event.title}</h1>
            <p>วันที่: {event.dateRange.start} - {event.dateRange.end}</p>
            <p>เวลา: {event.timeRange.start} - {event.timeRange.end}</p>
            <p>สถานที่: {event.location}</p>

            <hr />

            <button onClick={handleLogin}>Guest Login with Google</button>

            <div style={{ marginTop: 12 }}>
                <button onClick={handleSubmitAvailability}>Submit Availability</button>
            </div>

            <div style={{ marginTop: 12 }}>
                <button onClick={loadOverlap}>Load Heatmap Data</button>
            </div>

            {userInfo && (
                <pre style={{ marginTop: 16 }}>
                    {JSON.stringify(userInfo, null, 2)}
                </pre>
            )}

            <ul style={{ marginTop: 16 }}>
                {overlap.map((item, index) => (
                    <li key={index}>
                        {item.date} {item.time} - ว่าง {item.count} คน
                    </li>
                ))}
            </ul>
        </div>
    );
}