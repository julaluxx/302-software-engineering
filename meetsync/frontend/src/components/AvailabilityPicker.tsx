import { useEffect, useMemo, useState } from "react";
import type { AvailabilitySlot, EventData } from "../types";

type Props = {
    event: EventData;
    onSlotsChange: (slots: AvailabilitySlot[]) => void;
};

function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
}

function formatDateLabel(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString("th-TH", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

function getDatesInRange(start: string, end: string) {
    const result: string[] = [];
    const current = new Date(start);
    const last = new Date(end);

    while (current <= last) {
        result.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
    }

    return result;
}

function buildTimeSlots(startTime: string, endTime: string, step = 15) {
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    const result: string[] = [];
    for (let t = start; t < end; t += step) {
        result.push(minutesToTime(t));
    }

    return result;
}

function keyOf(date: string, time: string) {
    return `${date}_${time}`;
}

function selectedKeysToRanges(
    selectedKeys: Set<string>,
    dates: string[],
    times: string[]
): AvailabilitySlot[] {
    const ranges: AvailabilitySlot[] = [];

    for (const date of dates) {
        let currentStart: string | null = null;
        let previousTime: string | null = null;

        for (let i = 0; i < times.length; i++) {
            const time = times[i];
            const isSelected = selectedKeys.has(keyOf(date, time));

            if (isSelected && currentStart === null) {
                currentStart = time;
            }

            if (isSelected) {
                previousTime = time;
            }

            const nextTime = times[i + 1];
            const nextSelected = nextTime
                ? selectedKeys.has(keyOf(date, nextTime))
                : false;

            if (isSelected && !nextSelected && currentStart && previousTime) {
                const endTime = minutesToTime(toMinutes(previousTime) + 15);

                ranges.push({
                    date,
                    startTime: currentStart,
                    endTime,
                });

                currentStart = null;
                previousTime = null;
            }
        }
    }

    return ranges;
}

export default function AvailabilityPicker({ event, onSlotsChange }: Props) {
    const dates = useMemo(
        () => getDatesInRange(event.dateRange.start, event.dateRange.end),
        [event.dateRange.start, event.dateRange.end]
    );

    const times = useMemo(
        () => buildTimeSlots(event.timeRange.start, event.timeRange.end, 15),
        [event.timeRange.start, event.timeRange.end]
    );

    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null);

    useEffect(() => {
        const handlePointerUp = () => {
            setIsDragging(false);
            setDragMode(null);
        };

        window.addEventListener("pointerup", handlePointerUp);
        return () => window.removeEventListener("pointerup", handlePointerUp);
    }, []);

    useEffect(() => {
        const ranges = selectedKeysToRanges(selectedKeys, dates, times);
        onSlotsChange(ranges);
    }, [selectedKeys, dates, times, onSlotsChange]);

    const applyCell = (date: string, time: string, mode: "add" | "remove") => {
        const key = keyOf(date, time);

        setSelectedKeys((prev) => {
            const next = new Set(prev);

            if (mode === "add") {
                next.add(key);
            } else {
                next.delete(key);
            }

            return next;
        });
    };

    const handlePointerDown = (date: string, time: string) => {
        const cellKey = keyOf(date, time);
        const alreadySelected = selectedKeys.has(cellKey);
        const nextMode: "add" | "remove" = alreadySelected ? "remove" : "add";

        setIsDragging(true);
        setDragMode(nextMode);
        applyCell(date, time, nextMode);
    };

    const handlePointerEnter = (date: string, time: string) => {
        if (!isDragging || !dragMode) return;
        applyCell(date, time, dragMode);
    };

    const clearAll = () => {
        setSelectedKeys(new Set());
    };

    const selectedRanges = selectedKeysToRanges(selectedKeys, dates, times);

    return (
        <div className="availability-picker">
            <div className="picker-toolbar">
                <div>
                    <h3>เลือกเวลาว่างด้วยการลาก</h3>
                    <p className="muted">
                        ลากบนตารางเพื่อเลือกช่วงเวลาว่าง ถ้าลากบนช่องที่เลือกแล้ว ระบบจะลบช่วงนั้นออก
                    </p>
                </div>

                <div className="picker-toolbar-actions">
                    <button className="btn btn-secondary" onClick={clearAll}>
                        Clear All
                    </button>
                </div>
            </div>

            <div className="picker-grid-shell">
                <div
                    className="picker-grid"
                    style={{
                        gridTemplateColumns: `110px repeat(${dates.length}, minmax(140px, 1fr))`,
                    }}
                >
                    <div className="picker-corner">เวลา</div>

                    {dates.map((date) => (
                        <div key={date} className="picker-date-header">
                            <div>{formatDateLabel(date)}</div>
                            <small>{date}</small>
                        </div>
                    ))}

                    {times.map((time) => (
                        <div key={`row-${time}`} style={{ display: "contents" }}>
                            <div className="picker-time-label">{time}</div>

                            {dates.map((date) => {
                                const key = keyOf(date, time);
                                const selected = selectedKeys.has(key);

                                return (
                                    <div
                                        key={key}
                                        className={`picker-cell ${selected ? "selected" : ""}`}
                                        onPointerDown={() => handlePointerDown(date, time)}
                                        onPointerEnter={() => handlePointerEnter(date, time)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="selected-ranges-box">
                <h4>ช่วงเวลาที่เลือก</h4>

                {selectedRanges.length === 0 ? (
                    <p className="muted">ยังไม่ได้เลือกเวลาว่าง</p>
                ) : (
                    <div className="slot-list">
                        {selectedRanges.map((slot, index) => (
                            <div
                                key={`${slot.date}-${slot.startTime}-${slot.endTime}-${index}`}
                                className="slot-item"
                            >
                                <div>
                                    <strong>{slot.date}</strong> | {slot.startTime} - {slot.endTime}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}