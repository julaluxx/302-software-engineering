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
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
        });
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
    },
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);