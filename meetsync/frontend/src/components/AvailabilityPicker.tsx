import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { AvailabilitySlot, EventData } from "../types";

export interface AvailabilityPickerProps {
    event: EventData;
    onSlotsChange: Dispatch<SetStateAction<AvailabilitySlot[]>>;
}

function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

export default function AvailabilityPicker({ event, onSlotsChange }: AvailabilityPickerProps) {
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

    useEffect(() => {
        onSlotsChange(slots);
    }, [slots, onSlotsChange]);

    const handleAddSlot = () => {
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

    return (
        <div className="availability-picker">
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
        </div>
    );
}