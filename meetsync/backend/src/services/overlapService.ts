type Slot = {
    date: string;
    startTime: string;
    endTime: string;
};

type AvailabilityDoc = {
    userId: string;
    slots: Slot[];
};

function timeToMinutes(time: string) {
    const parts = time.split(":");

    if (parts.length !== 2) {
        throw new Error(`Invalid time format: ${time}`);
    }

    const h = Number(parts[0]);
    const m = Number(parts[1]);

    if (Number.isNaN(h) || Number.isNaN(m)) {
        throw new Error(`Invalid time value: ${time}`);
    }

    return h * 60 + m;
}

function minutesToTime(minutes: number) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
}

export function calculateOverlap(availabilities: AvailabilityDoc[]) {
    const map = new Map<string, number>();

    for (const entry of availabilities) {
        for (const slot of entry.slots) {
            const start = timeToMinutes(slot.startTime);
            const end = timeToMinutes(slot.endTime);

            for (let t = start; t < end; t += 15) {
                const key = `${slot.date}_${minutesToTime(t)}`;
                map.set(key, (map.get(key) ?? 0) + 1);
            }
        }
    }

    return Array.from(map.entries()).map(([key, count]) => {
        const [date, time] = key.split("_");
        return { date, time, count };
    });
}