import { auth } from "../db/firestore";

export async function getUserFromRequest(req: Request) {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    const decodedToken = await auth.verifyIdToken(idToken);

    return {
        uid: decodedToken.uid,
        email: decodedToken.email ?? "",
        name: decodedToken.name ?? "",
    };
}