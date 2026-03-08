import { useState } from "react";

type Props = {
    onSubmit: (payload: {
        title: string;
        dateRange: { start: string; end: string };
        timeRange: { start: string; end: string };
        location: string;
    }) => Promise<void>;
};

export default function CreateEventForm({ onSubmit }: Props) {
    const [title, setTitle] = useState("");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [timeStart, setTimeStart] = useState("");
    const [timeEnd, setTimeEnd] = useState("");
    const [location, setLocation] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !dateStart || !dateEnd || !timeStart || !timeEnd || !location) {
            alert("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        if (dateStart > dateEnd) {
            alert("วันเริ่มต้นต้องไม่เกินวันสิ้นสุด");
            return;
        }

        if (timeStart >= timeEnd) {
            alert("เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด");
            return;
        }

        await onSubmit({
            title,
            dateRange: {
                start: dateStart,
                end: dateEnd,
            },
            timeRange: {
                start: timeStart,
                end: timeEnd,
            },
            location,
        });
    };

    return (
        <form className="form-stack" onSubmit={handleSubmit}>
            <div>
                <label className="label">ชื่ออีเวนต์</label>
                <input
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น ประชุมโปรเจกต์ MeetSync"
                />
            </div>

            <div className="form-grid">
                <div>
                    <label className="label">วันเริ่มต้น</label>
                    <input
                        className="input"
                        type="date"
                        value={dateStart}
                        onChange={(e) => setDateStart(e.target.value)}
                    />
                </div>

                <div>
                    <label className="label">วันสิ้นสุด</label>
                    <input
                        className="input"
                        type="date"
                        value={dateEnd}
                        onChange={(e) => setDateEnd(e.target.value)}
                    />
                </div>
            </div>

            <div className="form-grid">
                <div>
                    <label className="label">เวลาเริ่มต้น</label>
                    <input
                        className="input"
                        type="time"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                    />
                </div>

                <div>
                    <label className="label">เวลาสิ้นสุด</label>
                    <input
                        className="input"
                        type="time"
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="label">สถานที่</label>
                <input
                    className="input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="เช่น Google Meet / ห้องประชุม 1"
                />
            </div>

            <div className="hero-actions">
                <button type="submit" className="btn btn-primary">
                    Create Event
                </button>
            </div>
        </form>
    );
}