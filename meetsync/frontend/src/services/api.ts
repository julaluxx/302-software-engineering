import type {
    AvailabilitySlot,
    EventData,
    OverlapItem,
    UserInfo,
    FinalizedSlot,
} from "../types";

const API_BASE = "http://localhost:3000/api";

async function parseJson<T>(res: Response): Promise<T> {
    const data = await res.json();

    if (!res.ok || data.ok === false) {
        throw new Error(data.message || "Request failed");
    }

    return data as T;
}

export async function loginWithGoogle(idToken: string): Promise<{
    ok: true;
    message: string;
    token: string;
    user: UserInfo;
}> {
    const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
    });

    return parseJson(res);
}

export async function createEvent(
    token: string,
    payload: {
        title: string;
        dateRange: { start: string; end: string };
        timeRange: { start: string; end: string };
        location: string;
    }
): Promise<{
    ok: true;
    message: string;
    event: EventData;
}> {
    const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    return parseJson(res);
}

export async function getEvent(eventId: string): Promise<{
    ok: true;
    event: EventData;
}> {
    const res = await fetch(`${API_BASE}/events/${eventId}`);
    return parseJson(res);
}

export async function submitAvailability(
    token: string,
    eventId: string,
    slots: AvailabilitySlot[]
): Promise<{
    ok: true;
    message: string;
    availabilityId: string;
}> {
    const res = await fetch(`${API_BASE}/availability`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            eventId,
            slots,
        }),
    });

    return parseJson(res);
}

export async function getOverlap(eventId: string): Promise<{
    ok: true;
    overlap: OverlapItem[];
}> {
    const res = await fetch(`${API_BASE}/events/${eventId}/overlap`);
    return parseJson(res);
}

export async function finalizeEvent(
    token: string,
    eventId: string,
    slot: FinalizedSlot
): Promise<{
    ok: true;
    message: string;
    event: EventData;
}> {
    const res = await fetch(`${API_BASE}/events/${eventId}/finalize`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(slot),
    });

    return parseJson(res);
}