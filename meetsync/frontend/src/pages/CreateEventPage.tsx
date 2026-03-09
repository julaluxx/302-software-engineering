import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import SectionCard from "../components/layout/SectionCard";
import CreateEventForm from "../components/event/CreateEventForm";
import { createEvent } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function CreateEventPage() {
    const navigate = useNavigate();
    const { token } = useAuth();

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
            alert("สร้างอีเวนต์สำเร็จ");
            navigate(`/event/${data.event.eventId}/submitted`);
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
                        <div style={{ marginTop: 20 }}>
                            <CreateEventForm onSubmit={handleCreate} />
                        </div>
                    </SectionCard>
                </div>
            </section>
        </AppShell>
    );
}