import { db, admin } from "../db/firestore";
import { getUserFromRequest } from "../middleware/auth";

function jsonWithCors(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        },
    });
}

export async function createEvent(req: Request) {
    try {
        const user = await getUserFromRequest(req);
        const body = await req.json();

        const title = body?.title?.trim();
        const dateRange = body?.dateRange;
        const timeRange = body?.timeRange;
        const location = body?.location?.trim() ?? "";

        if (!title) {
            return jsonWithCors(
                { ok: false, message: "title is required" },
                { status: 400 }
            );
        }

        if (!dateRange?.start || !dateRange?.end) {
            return jsonWithCors(
                { ok: false, message: "dateRange.start and dateRange.end are required" },
                { status: 400 }
            );
        }

        if (!timeRange?.start || !timeRange?.end) {
            return jsonWithCors(
                { ok: false, message: "timeRange.start and timeRange.end are required" },
                { status: 400 }
            );
        }

        const eventRef = db.collection("events").doc();

        const eventData = {
            eventId: eventRef.id,
            title,
            hostId: user.uid,
            hostName: user.name,
            hostEmail: user.email,
            dateRange: {
                start: dateRange.start,
                end: dateRange.end,
            },
            timeRange: {
                start: timeRange.start,
                end: timeRange.end,
            },
            location,
            status: "open",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await eventRef.set(eventData);

        return jsonWithCors({
            ok: true,
            message: "Event created successfully",
            event: {
                ...eventData,
                shareLink: `http://localhost:5173/event/${eventRef.id}`,
            },
        });
    } catch (error) {
        console.error("createEvent error:", error);

        return jsonWithCors(
            {
                ok: false,
                message: "Unauthorized or invalid request",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 401 }
        );
    }
}

export async function handleGetEvent(req: Request & { params: { id: string } }) {
    try {
        const eventId = req.params.id;
        const doc = await db.collection("events").doc(eventId).get();

        if (!doc.exists) {
            return jsonWithCors(
                { ok: false, message: "Event not found" },
                { status: 404 }
            );
        }

        return jsonWithCors({
            ok: true,
            event: doc.data(),
        });
    } catch (error) {
        return jsonWithCors(
            {
                ok: false,
                message: "Failed to fetch event",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}