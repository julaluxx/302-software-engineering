import { db, admin } from "../db/firestore";
import { getUserFromRequest } from "../middleware/auth";

type Slot = {
    date: string;
    startTime: string;
    endTime: string;
};

type JsonResponseInit = ResponseInit | undefined;

function jsonWithCors(data: unknown, init?: JsonResponseInit) {
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

export async function submitAvailability(req: Request) {
    try {
        const user = await getUserFromRequest(req);
        const body = await req.json();

        const eventId = body?.eventId;
        const slots = body?.slots as Slot[];

        if (!eventId) {
            return jsonWithCors(
                { ok: false, message: "eventId is required" },
                { status: 400 }
            );
        }

        if (!Array.isArray(slots) || slots.length === 0) {
            return jsonWithCors(
                { ok: false, message: "slots must be a non-empty array" },
                { status: 400 }
            );
        }

        const eventDoc = await db.collection("events").doc(eventId).get();
        if (!eventDoc.exists) {
            return jsonWithCors(
                { ok: false, message: "Event not found" },
                { status: 404 }
            );
        }

        const ref = db.collection("availability").doc();

        await ref.set({
            availId: ref.id,
            eventId,
            userId: user.uid,
            userName: user.name,
            userEmail: user.email,
            slots,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return jsonWithCors({
            ok: true,
            message: "Availability submitted",
            availabilityId: ref.id,
        });
    } catch (error) {
        console.error("submitAvailability error:", error);

        return jsonWithCors(
            {
                ok: false,
                message: "Failed to submit availability",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

export async function getAvailabilityByEvent(eventId: string) {
    const snapshot = await db
        .collection("availability")
        .where("eventId", "==", eventId)
        .get();

    return snapshot.docs.map((doc) => doc.data());
}