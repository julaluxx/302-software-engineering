"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  title:     string;
  dateStart: string;
  dateEnd:   string;
  timeStart: string;
  timeEnd:   string;
  location:  string;
  description: string;
  tags: string;
}

interface FormErrors {
  title?:     string;
  dateStart?: string;
  dateEnd?:   string;
  timeStart?: string;
  timeEnd?:   string;
}

// ── Time options (every 30 min) ───────────────────────────────────────────────
const TIME_OPTIONS = Array.from({ length: 32 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim())     errors.title     = "กรุณากรอกชื่อ Event";
  if (!form.dateStart)        errors.dateStart = "กรุณาเลือกวันเริ่มต้น";
  if (!form.dateEnd)          errors.dateEnd   = "กรุณาเลือกวันสิ้นสุด";
  if (form.dateStart && form.dateEnd && form.dateEnd < form.dateStart)
    errors.dateEnd = "วันสิ้นสุดต้องหลังวันเริ่มต้น";
  if (!form.timeStart)        errors.timeStart = "กรุณาเลือกเวลาเริ่มต้น";
  if (!form.timeEnd)          errors.timeEnd   = "กรุณาเลือกเวลาสิ้นสุด";
  if (form.timeStart && form.timeEnd && form.timeEnd <= form.timeStart)
    errors.timeEnd = "เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น";
  return errors;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreateEventPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [form, setForm] = useState<FormData>({
    title:       "",
    dateStart:   "",
    dateEnd:     "",
    timeStart:   "08:00",
    timeEnd:     "20:00",
    location:    "",
    description: "",
    tags:        "",
  });

  const [errors,    setErrors]    = useState<FormErrors>({});
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    // TODO: เรียก API จริง POST /api/events
    await new Promise(r => setTimeout(r, 1200));

    // Mock: สร้าง event ID และ share link
    const mockId   = `evt_${Date.now()}`;
    const mockLink = `${window.location.origin}/events/${mockId}`;
    setShareLink(mockLink);
    setSubmitted(true);
    setLoading(false);
  };

  const handleCopy = () => {
    if (shareLink) navigator.clipboard.writeText(shareLink);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted && shareLink) {
    return (
      <div className="dashboard">
        <header className="topbar">
          <div className="topbar__inner">
            <span className="topbar__logo">🗓 MeetSync</span>
          </div>
        </header>
        <main className="dashboard__main" style={{ alignItems: "center", paddingTop: 48 }}>
          <div className="create-success fade-up">
            <span className="create-success__emoji">🎉</span>
            <div className="create-success__title">สร้าง Event สำเร็จ!</div>
            <div className="create-success__sub">แชร์ลิงก์นี้ให้สมาชิกเลือกเวลาว่างได้เลย</div>

            <div className="create-success__link-box">
              <span className="create-success__link-text">{shareLink}</span>
              <button className="create-success__copy-btn" onClick={handleCopy}>
                📋 Copy
              </button>
            </div>

            <div className="create-success__actions">
              <button className="btn btn-yellow" onClick={() => router.push(`/events/${shareLink.split("/").pop()}/availability`)}>
                🗓 เลือกเวลาว่างของฉัน
              </button>
              <button className="btn btn-outline-ink" onClick={() => router.push("/events")}>
                ← กลับหน้า Events
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar__inner">
          <button className="topbar__back" onClick={() => router.back()}>← ย้อนกลับ</button>
          <span className="topbar__logo">สร้าง Event ใหม่</span>
          <span style={{ minWidth: 80 }} />
        </div>
      </header>

      <main className="dashboard__main" style={{ maxWidth: 560 }}>
        <div className="create-form fade-up">

          {/* ── ชื่อ Event ── */}
          <div className="form-group">
            <label className="form-label">ชื่อ Event <span className="form-required">*</span></label>
            <input
              className={`form-field ${errors.title ? "form-field--error" : ""}`}
              placeholder="เช่น Project Meeting, Lunch Group"
              value={form.title}
              onChange={set("title")}
              maxLength={80}
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          {/* ── ช่วงวันที่ ── */}
          <div className="form-group">
            <label className="form-label">ช่วงวันที่ <span className="form-required">*</span></label>
            <div className="form-row">
              <div className="form-row__item">
                <input
                  type="date"
                  className={`form-field ${errors.dateStart ? "form-field--error" : ""}`}
                  value={form.dateStart}
                  onChange={set("dateStart")}
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.dateStart && <div className="form-error">{errors.dateStart}</div>}
              </div>
              <span className="form-row__sep">→</span>
              <div className="form-row__item">
                <input
                  type="date"
                  className={`form-field ${errors.dateEnd ? "form-field--error" : ""}`}
                  value={form.dateEnd}
                  onChange={set("dateEnd")}
                  min={form.dateStart || new Date().toISOString().split("T")[0]}
                />
                {errors.dateEnd && <div className="form-error">{errors.dateEnd}</div>}
              </div>
            </div>
          </div>

          {/* ── ช่วงเวลาต่อวัน ── */}
          <div className="form-group">
            <label className="form-label">ช่วงเวลาต่อวัน <span className="form-required">*</span></label>
            <div className="form-row">
              <div className="form-row__item">
                <select
                  className={`form-field ${errors.timeStart ? "form-field--error" : ""}`}
                  value={form.timeStart}
                  onChange={set("timeStart")}
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.timeStart && <div className="form-error">{errors.timeStart}</div>}
              </div>
              <span className="form-row__sep">→</span>
              <div className="form-row__item">
                <select
                  className={`form-field ${errors.timeEnd ? "form-field--error" : ""}`}
                  value={form.timeEnd}
                  onChange={set("timeEnd")}
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.timeEnd && <div className="form-error">{errors.timeEnd}</div>}
              </div>
            </div>
          </div>

          {/* ── สถานที่ ── */}
          <div className="form-group">
            <label className="form-label">สถานที่ / ลิงก์</label>
            <input
              className="form-field"
              placeholder="📍 ห้องประชุม A หรือ Zoom link"
              value={form.location}
              onChange={set("location")}
            />
          </div>

          {/* ── รายละเอียด ── */}
          <div className="form-group">
            <label className="form-label">รายละเอียด</label>
            <textarea
              className="form-field form-field--textarea"
              placeholder="อธิบายวัตถุประสงค์ของการประชุม..."
              value={form.description}
              onChange={set("description")}
              rows={3}
            />
          </div>

          {/* ── แท็ก ── */}
          <div className="form-group">
            <label className="form-label">แท็ก</label>
            <input
              className="form-field"
              placeholder="เช่น #การตลาด #ผลิตภัณฑ์"
              value={form.tags}
              onChange={set("tags")}
            />
          </div>

          {/* ── Submit ── */}
          <button
            className="btn btn-yellow"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <span className="spinner" /> : "✅ สร้าง Event และรับลิงก์แชร์"}
          </button>

        </div>
      </main>
    </div>
  );
}