"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PublicSighting, SessionUser, Severity, SightingCategory } from "@/lib/types";

type NewSightingForm = {
  category: SightingCategory;
  type: string;
  location: string;
  notes: string;
  severity: Severity;
};

const initialForm: NewSightingForm = {
  category: "Animal",
  type: "",
  location: "",
  notes: "",
  severity: "Low",
};

export function WildWatchApp() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sightings, setSightings] = useState<PublicSighting[]>([]);
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [form, setForm] = useState<NewSightingForm>(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const isFacultyView = useMemo(() => user?.role === "faculty" || user?.role === "admin", [user?.role]);

  async function refreshSessionAndData() {
    setLoading(true);

    const sessionRes = await fetch("/api/session", { cache: "no-store" });
    const sessionData = (await sessionRes.json()) as { user: SessionUser | null };
    setUser(sessionData.user);

    if (sessionData.user) {
      const sightingsRes = await fetch("/api/sightings", { cache: "no-store" });
      const sightingsData = (await sightingsRes.json()) as { sightings?: PublicSighting[] };
      setSightings(sightingsData.sightings ?? []);
    } else {
      setSightings([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await refreshSessionAndData();
    })();
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: loginName, email: loginEmail }),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? "Login failed");
      return;
    }

    setLoginName("");
    setLoginEmail("");
    await refreshSessionAndData();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setForm(initialForm);
    await refreshSessionAndData();
  }

  async function handleSubmitSighting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const res = await fetch("/api/sightings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = (await res.json()) as { error?: string; message?: string };
    if (!res.ok) {
      setMessage(data.error ?? "Failed to submit report.");
      return;
    }

    setForm(initialForm);
    setMessage(data.message ?? "Sighting submitted.");
    await refreshSessionAndData();
  }

  if (loading) {
    return <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-8">Loading BC WildWatch...</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-8">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">BC WildWatch</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with your campus Microsoft account to view and report sightings.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Full name"
              value={loginName}
              onChange={(event) => setLoginName(event.target.value)}
              required
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="email"
              placeholder="Campus Microsoft email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
            />
            <button className="w-full rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700" type="submit">
              Continue with Microsoft Account
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-500">Only campus-managed Microsoft emails are accepted.</p>
          {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="flex flex-col gap-3 rounded-xl bg-slate-900 p-6 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">BC WildWatch</h1>
          <p className="text-sm text-slate-200">Live campus hazard reporting for students, faculty, and security.</p>
        </div>
        <div className="text-sm">
          <p>
            Signed in as <strong>{user.name}</strong> ({user.role})
          </p>
          <button onClick={handleLogout} className="mt-2 rounded-md bg-white px-3 py-1 font-medium text-slate-900">
            Sign out
          </button>
        </div>
      </header>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <form onSubmit={handleSubmitSighting} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">Report a Sighting</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">High severity routes alerts to security guards via WhatsApp/SMS.</p>

          <div className="space-y-3">
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as SightingCategory }))}
            >
              <option value="Animal">Animal</option>
              <option value="Danger">Danger</option>
            </select>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Type (e.g., Snake, Bees, Fire)"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              required
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Campus location"
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              required
            />
            <textarea
              className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Additional notes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.severity}
              onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value as Severity }))}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <button className="w-full rounded-md bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700" type="submit">
              Submit Report
            </button>
          </div>
          {message ? <p className="mt-3 text-sm text-blue-700">{message}</p> : null}
        </form>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Campus Sightings Feed</h2>
          <p className="mt-1 text-xs text-slate-500">
            Students remain anonymous in this feed. Faculty/admin can view reporter identity for follow-up.
          </p>

          <div className="mt-4 space-y-3">
            {sightings.length === 0 ? <p className="text-sm text-slate-600">No reports yet.</p> : null}
            {sightings.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.type} <span className="font-normal text-slate-500">({item.category})</span>
                    </h3>
                    <p className="text-sm text-slate-700">Location: {item.location}</p>
                    <p className="text-sm text-slate-600">Reporter: {item.reporter}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.severity}</span>
                </div>
                {item.notes ? <p className="mt-2 text-sm text-slate-700">{item.notes}</p> : null}
                <p className="mt-2 text-xs text-slate-500">
                  Routed to: {item.notificationTarget} ({item.notificationChannel})
                </p>
                {isFacultyView ? <p className="text-xs text-slate-500">Logged at {new Date(item.createdAt).toLocaleString()}</p> : null}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
