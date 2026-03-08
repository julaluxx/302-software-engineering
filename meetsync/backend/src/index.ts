import { serve } from "bun";
import { db, auth, admin } from "./db/firestore";
import { createEvent, handleGetEvent } from "./routes/events";
import {
  submitAvailability,
  getAvailabilityByEvent,
} from "./routes/availability";
import { calculateOverlap } from "./services/overlapService";

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
          console.error("POST /api/auth/google error:", error);

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
        return createEvent(req);
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
        return submitAvailability(req);
      },
    },

    "/api/events/:id": async (req: Request & { params: { id: string } }) => {
      return handleGetEvent(req);
    },

    "/api/events/:id/overlap": async (req: Request & { params: { id: string } }) => {
      try {
        const eventId = req.params.id;
        const availabilities = await getAvailabilityByEvent(eventId);
        const overlap = calculateOverlap(availabilities as any);

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
});

console.log(`🚀 Server running at http://localhost:${server.port}`);