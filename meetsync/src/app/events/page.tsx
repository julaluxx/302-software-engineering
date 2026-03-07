"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// ── Mock data (แทนที่ด้วย API call จริงทีหลัง) ──────────────────────────────
const MY_EVENTS = [
  {
    id: "1",
    title: "Project Meeting",
    dateRange: "20–25 ม.ค. 2569",
    responded: 5,
    total: 7,
    status: "open",      // open | finalized
    bestSlot: "อ. 21 ม.ค. | 08:00–10:00",
  },
  {
    id: "2",
    title: "Team Lunch",
    dateRange: "1–5 ก.พ. 2569",
    responded: 3,
    total: 5,
    status: "open",
    bestSlot: null,
  },
  {
    id: "3",
    title: "Sprint Review",
    dateRange: "10 ม.ค. 2569",
    responded: 6,
    total: 6,
    status: "finalized",
    bestSlot: "ศ. 10 ม.ค. | 14:00–15:00",
  },
];

const INVITED_EVENTS = [
  {
    id: "4",
    title: "Design Sync",
    host: "แอม",
    dateRange: "22–26 ม.ค. 2569",
    responded: 2,
    total: 4,
    status: "open",
    hasResponded: false,
  },
  {
    id: "5",
    title: "Quarterly Review",
    host: "บีม",
    dateRange: "15 ก.พ. 2569",
    responded: 8,
    total: 8,
    status: "finalized",
    hasResponded: true,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  return status === "finalized" ? (
    <span className="pill pill--finalized">✅ ยืนยันแล้ว</span>
  ) : (
    <span className="pill pill--open">⏳ รอเวลาว่าง</span>
  );
}

function ProgressBar({ responded, total }: { responded: number; total: number }) {
  const pct = Math.round((responded / total) * 100);
  return (
    <div className="progress">
      <div className="progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

function MyEventCard({ event }: { event: typeof MY_EVENTS[0] }) {
  const router = useRouter();
  return (
    <div className="event-card" onClick={() => router.push(`/events/${event.id}/heatmap`)}>
      <div className="event-card__top">
        <div>
          <div className="event-card__title">{event.title}</div>
          <div className="event-card__date">📅 {event.dateRange}</div>
        </div>
        <StatusPill status={event.status} />
      </div>

      <ProgressBar responded={event.responded} total={event.total} />
      <div className="event-card__meta">
        👥 {event.responded}/{event.total} คนลงแล้ว
      </div>

      {event.bestSlot && (
        <div className="event-card__slot">🏆 {event.bestSlot}</div>
      )}
    </div>
  );
}

function InvitedEventCard({ event }: { event: typeof INVITED_EVENTS[0] }) {
  const router = useRouter();
  return (
    <div className="event-card event-card--invited" onClick={() => router.push(`/events/${event.id}`)}>
      <div className="event-card__top">
        <div>
          <div className="event-card__title">{event.title}</div>
          <div className="event-card__date">📅 {event.dateRange} · โดย {event.host}</div>
        </div>
        <StatusPill status={event.status} />
      </div>

      <ProgressBar responded={event.responded} total={event.total} />
      <div className="event-card__meta">
        👥 {event.responded}/{event.total} คนลงแล้ว
      </div>

      {event.status === "open" && !event.hasResponded && (
        <div className="event-card__cta">✏️ ยังไม่ได้เลือกเวลาว่าง →</div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="dashboard-loading">
        <span className="spinner" />
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "คุณ";

  return (
    <div className="dashboard">

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar__inner">
          <span className="topbar__logo">🗓 MeetSync</span>
          <div className="topbar__user">
            <span className="topbar__name">👋 {firstName}</span>
            <button className="topbar__signout" onClick={() => router.push("/api/auth/signout")}>
              ออก
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="dashboard__main">

        {/* Create Event CTA */}
        <div className="fade-up dashboard-cta">
          <div className="dashboard-cta__text">
            <div className="dashboard-cta__title">สวัสดี, {firstName}! 👋</div>
            <div className="dashboard-cta__sub">พร้อมนัดหมายครั้งใหม่แล้วหรือยัง?</div>
          </div>
          <button className="btn btn-yellow dashboard-cta__btn" onClick={() => router.push("/events/new")}>
            ✨ สร้าง Event ใหม่
          </button>
        </div>

        {/* ── My Events ── */}
        <section className="fade-up d1 dashboard-section">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">📋 Events ของฉัน</h2>
            <span className="dashboard-section__count">{MY_EVENTS.length}</span>
          </div>

          {MY_EVENTS.length === 0 ? (
            <div className="empty-state">
              ยังไม่มี Event — <span className="empty-state__link" onClick={() => router.push("/events/new")}>สร้างเลย →</span>
            </div>
          ) : (
            <div className="event-list">
              {MY_EVENTS.map(e => <MyEventCard key={e.id} event={e} />)}
            </div>
          )}
        </section>

        {/* ── Invited Events ── */}
        <section className="fade-up d2 dashboard-section">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">📨 ได้รับคำเชิญ</h2>
            <span className="dashboard-section__count">{INVITED_EVENTS.length}</span>
          </div>

          {INVITED_EVENTS.length === 0 ? (
            <div className="empty-state">ยังไม่มีคำเชิญ</div>
          ) : (
            <div className="event-list">
              {INVITED_EVENTS.map(e => <InvitedEventCard key={e.id} event={e} />)}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}