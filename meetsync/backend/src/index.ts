import { serve } from "bun";
import { db, auth, admin } from "./db/firestore";
import { getUserFromRequest } from "./middleware/auth";

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

function calculateOverlap(availabilities: AvailabilityDoc[]) {
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

  return Array.from(map.entries())
    .map(([key, count]): { date: string; time: string; count: number } => {
      const parts = key.split("_");

      if (parts.length !== 2) {
        throw new Error(`Invalid overlap key: ${key}`);
      }

      const date = parts[0]!;
      const time = parts[1]!;

      return { date, time, count };
    })
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }

      return a.time.localeCompare(b.time);
    });
}

const server = serve({
  port: Number(process.env.PORT) || 3000,

  routes: {
    "/api/hello": {
      async GET() {
        return jsonWithCors({
          message: "Hello, world!",
          method: "GET",
        });
      },
    },

    "/api/health/db": {
      async GET() {
        try {
          const snapshot = await db.collection("users").limit(10).get();

          return jsonWithCors({
            ok: true,
            message: "Firestore connected",
            usersCount: snapshot.size,
          });
        } catch (error) {
          return jsonWithCors(
            {
              ok: false,
              message: "Firestore connection failed",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      },
    },

    "/api/auth/google": {
      async OPTIONS() {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
        });
      },

      async POST(req) {
        try {
          const body = await req.json();
          const idToken = body?.idToken;

          if (!idToken) {
            return jsonWithCors(
              { ok: false, message: "Missing idToken" },
              { status: 400 }
            );
          }

          const decodedToken = await auth.verifyIdToken(idToken);
          const uid = decodedToken.uid;
          const name = decodedToken.name ?? "";
          const email = decodedToken.email ?? "";

          await db.collection("users").doc(uid).set(
            {
              uid,
              name,
              email,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          return jsonWithCors({
            ok: true,
            message: "Google auth success",
            token: idToken,
            user: { uid, name, email },
          });
        } catch (error) {
          return jsonWithCors(
            {
              ok: false,
              message: "Invalid or expired token",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 401 }
          );
        }
      },
    },

    "/api/events": {
      async OPTIONS() {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          },
        });
      },

      async GET(req) {
        try {
          const user = await getUserFromRequest(req);
          
          // 1. Fetch hosted events
          const hostedSnapshot = await db
            .collection("events")
            .where("hostId", "==", user.uid)
            .get();

          const hostedEvents = hostedSnapshot.docs.map((doc) => doc.data());
          const eventIds = new Set(hostedEvents.map((e) => e.eventId));

          // 2. Fetch participated events via availability
          const availSnapshot = await db
            .collection("availability")
            .where("userId", "==", user.uid)
            .get();

          const availDocs = availSnapshot.docs.map((doc) => doc.data());
          const participatedEventIds = new Set(availDocs.map(a => a.eventId));

          // 3. Keep only eventIds not already in hostedEvents
          const newEventIds = Array.from(participatedEventIds).filter(id => !eventIds.has(id));

          // 4. Fetch the events for these new IDs mapping over them (Firestore 'in' query has 10 item limit limit)
          const participatedEvents = [];
          if (newEventIds.length > 0) {
            // chunk into batches of 10 for 'in' query if needed, or fetch individually
            const chunks = [];
            for (let i = 0; i < newEventIds.length; i += 10) {
              chunks.push(newEventIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
              const partSnapshot = await db
                .collection("events")
                .where("eventId", "in", chunk)
                .get();
              
              participatedEvents.push(...partSnapshot.docs.map(doc => doc.data()));
            }
          }

          // 5. Combine and sort by createdAt desc
          const allEvents = [...hostedEvents, ...participatedEvents];
          allEvents.sort((a, b) => {
             // Handle case where createdAt might be a server timestamp object
             const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
             const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
             return timeB - timeA;
          });

          return jsonWithCors({
            ok: true,
            events: allEvents,
          });
        } catch (error) {
          console.error("GET /api/events error:", error);

          return jsonWithCors(
            {
              ok: false,
              message: "Failed to fetch events",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      },

      async POST(req) {
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
              {
                ok: false,
                message: "dateRange.start and dateRange.end are required",
              },
              { status: 400 }
            );
          }

          if (!timeRange?.start || !timeRange?.end) {
            return jsonWithCors(
              {
                ok: false,
                message: "timeRange.start and timeRange.end are required",
              },
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
          console.error("POST /api/events error:", error);

          return jsonWithCors(
            {
              ok: false,
              message: "Unauthorized or invalid request",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 401 }
          );
        }
      },
    },

    "/api/availability": {
      async OPTIONS() {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
        });
      },

      async POST(req) {
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
      },
    },

    "/api/events/:id": {
      async GET(req: Request & { params: { id: string } }) {
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
      },

      async OPTIONS() {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          },
        });
      },

      async POST(req: Request & { params: { id: string } }) {
        const pathname = new URL(req.url).pathname;

        if (!pathname.endsWith("/finalize")) {
          return jsonWithCors(
            { ok: false, message: "Unsupported POST route" },
            { status: 404 }
          );
        }

        try {
          const eventId = req.params.id;
          const user = await getUserFromRequest(req);
          const body = await req.json();

          const date = body?.date;
          const startTime = body?.startTime;
          const endTime = body?.endTime;

          if (!date || !startTime || !endTime) {
            return jsonWithCors(
              {
                ok: false,
                message: "date, startTime, endTime are required",
              },
              { status: 400 }
            );
          }

          if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
            return jsonWithCors(
              {
                ok: false,
                message: "startTime must be earlier than endTime",
              },
              { status: 400 }
            );
          }

          const eventRef = db.collection("events").doc(eventId);
          const eventDoc = await eventRef.get();

          if (!eventDoc.exists) {
            return jsonWithCors(
              { ok: false, message: "Event not found" },
              { status: 404 }
            );
          }

          const eventData = eventDoc.data() as any;

          if (eventData.hostId !== user.uid) {
            return jsonWithCors(
              { ok: false, message: "Only host can finalize this event" },
              { status: 403 }
            );
          }

          await eventRef.update({
            status: "finalized",
            finalizedSlot: {
              date,
              startTime,
              endTime,
            },
            finalizedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          const updatedDoc = await eventRef.get();

          return jsonWithCors({
            ok: true,
            message: "Event finalized successfully",
            event: updatedDoc.data(),
          });
        } catch (error) {
          console.error("finalize error:", error);

          return jsonWithCors(
            {
              ok: false,
              message: "Failed to finalize event",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      },
    },

    "/api/events/:id/overlap": {
      async GET(req: Request & { params: { id: string } }) {
        try {
          const eventId = req.params.id;

          const snapshot = await db
            .collection("availability")
            .where("eventId", "==", eventId)
            .get();

          const availabilities = snapshot.docs.map(
            (doc) => doc.data()
          ) as AvailabilityDoc[];

          const overlap = calculateOverlap(availabilities);

          return jsonWithCors({
            ok: true,
            overlap,
          });
        } catch (error) {
          return jsonWithCors(
            {
              ok: false,
              message: "Failed to calculate overlap",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      },
    },

    "/api/events/:id/finalize": {
      async OPTIONS() {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
        });
      },

      async POST(req: Request & { params: { id: string } }) {
        try {
          const eventId = req.params.id;
          const user = await getUserFromRequest(req);
          const body = await req.json();

          const date = body?.date;
          const startTime = body?.startTime;
          const endTime = body?.endTime;

          if (!date || !startTime || !endTime) {
            return jsonWithCors(
              {
                ok: false,
                message: "date, startTime, endTime are required",
              },
              { status: 400 }
            );
          }

          if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
            return jsonWithCors(
              {
                ok: false,
                message: "startTime must be earlier than endTime",
              },
              { status: 400 }
            );
          }

          const eventRef = db.collection("events").doc(eventId);
          const eventDoc = await eventRef.get();

          if (!eventDoc.exists) {
            return jsonWithCors(
              { ok: false, message: "Event not found" },
              { status: 404 }
            );
          }

          const eventData = eventDoc.data() as any;

          if (eventData.hostId !== user.uid) {
            return jsonWithCors(
              { ok: false, message: "Only host can finalize this event" },
              { status: 403 }
            );
          }

          await eventRef.update({
            status: "finalized",
            finalizedSlot: {
              date,
              startTime,
              endTime,
            },
            finalizedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          const updatedDoc = await eventRef.get();

          return jsonWithCors({
            ok: true,
            message: "Event finalized successfully",
            event: updatedDoc.data(),
          });
        } catch (error) {
          console.error("POST /api/events/:id/finalize error:", error);

          return jsonWithCors(
            {
              ok: false,
              message: "Failed to finalize event",
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);