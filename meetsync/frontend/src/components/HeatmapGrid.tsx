import type { FinalizedSlot, OverlapItem } from "../types";

function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function addMinutes(time: string, minutes: number) {
    const total = toMinutes(time) + minutes;
    const h = String(Math.floor(total / 60)).padStart(2, "0");
    const m = String(total % 60).padStart(2, "0");
    return `${h}:${m}`;
}

function getCellStyle(count: number, selected: boolean) {
    let background = "#f3f4f6";

    if (count === 1) background = "#dbeafe";
    if (count === 2) background = "#93c5fd";
    if (count === 3) background = "#60a5fa";
    if (count >= 4) background = "#2563eb";

    return {
        background: selected ? "#111827" : background,
        color: selected || count >= 3 ? "#ffffff" : "#111827",
        border: selected ? "2px solid #f59e0b" : "1px solid #e5e7eb",
        padding: "10px 10px",
        textAlign: "center" as const,
        borderRadius: 12,
        minWidth: 88,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
    };
}

type Props = {
    overlap: OverlapItem[];
    isHost: boolean;
    isFinalized: boolean;
    selectedFinalizeSlot: FinalizedSlot | null;
    onSelectSlot: (slot: FinalizedSlot) => void;
};

export default function HeatmapGrid({
    overlap,
    isHost,
    isFinalized,
    selectedFinalizeSlot,
    onSelectSlot,
}: Props) {
    const grouped = overlap.reduce<Record<string, OverlapItem[]>>((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
    }, {});

    for (const key of Object.keys(grouped)) {
        grouped[key].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
    }

    if (overlap.length === 0) {
        return <p className="muted" style={{ marginTop: 16 }}>ยังไม่มีข้อมูล overlap ให้แสดง</p>;
    }

    return (
        <div style={{ marginTop: 20, display: "grid", gap: 20 }}>
            {Object.entries(grouped).map(([dateKey, items]) => (
                <div key={dateKey}>
                    <h4 style={{ marginBottom: 10 }}>{dateKey}</h4>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                            gap: 10,
                        }}
                    >
                        {items.map((item) => {
                            const slot = {
                                date: item.date,
                                startTime: item.time,
                                endTime: addMinutes(item.time, 15),
                            };

                            const selected =
                                selectedFinalizeSlot?.date === slot.date &&
                                selectedFinalizeSlot?.startTime === slot.startTime &&
                                selectedFinalizeSlot?.endTime === slot.endTime;

                            return (
                                <div
                                    key={`${item.date}-${item.time}`}
                                    style={getCellStyle(item.count, selected)}
                                    title={`${item.time} ว่าง ${item.count} คน`}
                                    onClick={() => {
                                        if (isHost && !isFinalized) onSelectSlot(slot);
                                    }}
                                >
                                    <div>{item.time}</div>
                                    <div style={{ fontSize: 12, marginTop: 4 }}>{item.count} คน</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}