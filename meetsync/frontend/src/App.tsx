import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";

export default function App() {
  const [token, setToken] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      console.log("login response:", data);

      if (data.ok) {
        setToken(idToken);
        setUserInfo(data.user);
        alert("login success");
      } else {
        alert(data.message || "login failed");
      }
    } catch (error) {
      console.error(error);
      alert("login failed");
    }
  };

  const handleCreateEvent = async () => {
    try {
      if (!token) {
        alert("กรุณา login ก่อน");
        return;
      }

      const res = await fetch("http://localhost:3000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "ประชุมโปรเจกต์ MeetSync",
          dateRange: {
            start: "2026-03-10",
            end: "2026-03-12",
          },
          timeRange: {
            start: "09:00",
            end: "18:00",
          },
          location: "Google Meet",
        }),
      });

      const data = await res.json();
      console.log("create event response:", data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(error);
      alert("create event failed");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>MeetSync Login</h1>

      <button onClick={handleLogin}>Sign in with Google</button>

      <div style={{ marginTop: 16 }}>
        <button onClick={handleCreateEvent}>Create Test Event</button>
      </div>

      {userInfo && (
        <pre style={{ marginTop: 16 }}>
          {JSON.stringify(userInfo, null, 2)}
        </pre>
      )}
    </div>
  );
}