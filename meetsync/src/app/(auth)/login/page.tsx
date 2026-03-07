"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin:        "เกิดข้อผิดพลาดในการเชื่อมต่อ Google",
  OAuthCallback:      "Google ตอบกลับผิดพลาด กรุณาลองใหม่",
  OAuthCreateAccount: "ไม่สามารถสร้างบัญชีได้",
  Callback:           "เกิดข้อผิดพลาด กรุณาลองใหม่",
  CredentialsSignin:  "กรุณากรอกชื่อก่อนเข้าใช้",
  Default:            "เกิดข้อผิดพลาด กรุณาลองใหม่",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const errorParam   = searchParams.get("error");
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/events";

  const [guestName,      setGuestName]      = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [loading,        setLoading]        = useState<"google" | "guest" | null>(null);
  const [error,          setError]          = useState<string | null>(
    errorParam ? (ERROR_MESSAGES[errorParam] ?? ERROR_MESSAGES.Default) : null
  );

  const handleGoogle = async () => {
    setError(null);
    setLoading("google");
    await signIn("google", { callbackUrl });
  };

  const handleGuest = async () => {
    setError(null);
    if (!showGuestInput) {
      setShowGuestInput(true);
      return;
    }
    if (!guestName.trim()) {
      setError("กรุณากรอกชื่อก่อนเข้าใช้");
      return;
    }
    setLoading("guest");
    const result = await signIn("guest", {
      name:     guestName.trim(),
      callbackUrl,
      redirect: false,
    });
    if (result?.error) {
      setError(ERROR_MESSAGES.CredentialsSignin);
      setLoading(null);
      return;
    }
    window.location.href = callbackUrl;
  };

  const handleCreateEvent = () => {
    signIn(undefined, { callbackUrl: "/events/new" });
  };

  const isDisabled = loading !== null;

  return (
    <div className="login-page">

      {/* Card */}
      <div className="login-card">

        {/* Top accent bar */}
        <div className="login-card__accent" />

        <div className="login-card__body">

          {/* Logo + Hero */}
          <div className="fade-up login-hero">
            <div className="login-hero__label">MeetSync</div>
            <span className="bounce-emoji login-hero__emoji">📅</span>
            <div className="login-hero__title">
              หาเวลา<span className="login-hero__highlight">ว่างตรงกัน</span>
            </div>
            <div className="login-hero__sub">ง่าย ไว นัดกันทันใจ</div>
          </div>

          {/* Error */}
          {error && (
            <div className="shake login-error">⚠️ {error}</div>
          )}

          {/* Google */}
          <button className="btn btn-google fade-up d1" onClick={handleGoogle} disabled={isDisabled}>
            {loading === "google"
              ? <span className="spinner" />
              : <span className="login-google-icon">G</span>
            }
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="fade-up d2 login-divider">
            <div className="login-divider__line" />
            หรือ
            <div className="login-divider__line" />
          </div>

          {/* Guest */}
          <div className="fade-up d3 login-guest">
            {showGuestInput && (
              <input
                autoFocus
                type="text"
                className="text-input"
                placeholder="ชื่อของคุณ..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuest()}
                disabled={isDisabled}
              />
            )}
            <button
              className="btn btn-guest"
              onClick={handleGuest}
              disabled={isDisabled || (showGuestInput && !guestName.trim())}
            >
              {loading === "guest" ? <span className="spinner" /> : "👤"}
              {showGuestInput ? "เข้าใช้เลย" : "เข้าใช้ด้วยชื่อ (Guest Mode)"}
            </button>
          </div>

          {/* Separator */}
          <div className="fade-up d4 login-separator" />

          {/* Terms */}
          <p className="login-terms">
            การเข้าใช้งาน ถือว่ายอมรับ Terms of Service และ Privacy Policy
          </p>

        </div>
      </div>
    </div>
  );
}