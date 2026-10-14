import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Activity, BookOpen, BriefcaseBusiness, FileText, GraduationCap,
  LayoutDashboard, LogOut, Mail, RefreshCw, Settings, ShieldCheck,
  Users, Wrench,
} from "lucide-react";
import { useAdminAuth } from "../context/adminAuthContextValue";
import api, { getHealth } from "../services/api";

const cards = [
  { label: "Total users", key: "totalUsers", icon: Users, color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { label: "Students", key: "totalStudents", icon: GraduationCap, color: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  { label: "Courses", key: "totalCourses", icon: BookOpen, color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  { label: "Projects", key: "totalProjects", icon: BriefcaseBusiness, color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { label: "Services", key: "totalServices", icon: Wrench, color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
  { label: "Blog posts", key: "totalBlogPosts", icon: FileText, color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  { label: "Messages", key: "totalMessages", icon: Mail, color: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
];

function AdminDashboard() {
  const { user, isLoading: isAuthLoading, logout } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const [statsResult, healthResult] = await Promise.allSettled([
      api.get("/dashboard/stats"),
      getHealth(),
    ]);

    if (statsResult.status === "fulfilled") {
      setStats(statsResult.value.data.data);
      setError("");
    } else {
      setError(statsResult.reason.response?.data?.message || "Dashboard data could not be loaded. Check the API and database connection.");
    }

    setDatabaseConnected(
      healthResult.status === "fulfilled"
      && healthResult.value.success
      && healthResult.value.database === "connected",
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let timeout;
    if (user) {
      timeout = window.setTimeout(loadDashboard, 0);
    }
    return () => window.clearTimeout(timeout);
  }, [loadDashboard, user]);

  const refreshDashboard = () => {
    setError("");
    setIsLoading(true);
    loadDashboard();
  };

  if (isAuthLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      <aside className="flex w-full flex-col bg-slate-950 text-white lg:min-h-screen lg:w-64 lg:shrink-0">
        <Link to="/admin" className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <span className="grid size-10 place-items-center rounded-xl bg-green-400 text-slate-950"><ShieldCheck aria-hidden="true" size={22} /></span>
          <span><span className="block font-black tracking-wide">AMADE</span><span className="text-xs text-slate-400">Admin workspace</span></span>
        </Link>
        <nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto p-4 lg:flex-1 lg:flex-col">
          <a href="#overview" className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"><LayoutDashboard aria-hidden="true" size={18} /> Overview</a>
          <Link to="/admin/courses" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><BookOpen aria-hidden="true" size={18} /> Courses</Link>
          <Link to="/admin/students" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><Users aria-hidden="true" size={18} /> Students</Link>
          <Link to="/admin/enrollments" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><GraduationCap aria-hidden="true" size={18} /> Enrollments</Link>
          <Link to="/admin/projects" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><BriefcaseBusiness aria-hidden="true" size={18} /> Projects</Link>
          <Link to="/admin/services" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><Wrench aria-hidden="true" size={18} /> Services</Link>
          <Link to="/admin/blog" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><FileText aria-hidden="true" size={18} /> Blog posts</Link>
          <Link to="/admin/messages" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><Mail aria-hidden="true" size={18} /> Messages</Link>
          <a href="#activity" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><Activity aria-hidden="true" size={18} /> Recent activity</a>
          <Link to="/" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><Settings aria-hidden="true" size={18} /> View public site</Link>
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="mb-3 truncate px-2 text-sm font-medium text-slate-300">{user.name}</div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
            <LogOut aria-hidden="true" size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main id="overview" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">Overview</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Good to see you, {user.name.split(" ")[0]}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Live platform totals and the latest activity.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${databaseConnected ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
              <span className={`size-2 rounded-full ${databaseConnected ? "bg-green-500" : "bg-amber-500"}`} />
              Database {databaseConnected ? "connected" : "unavailable"}
            </div>
            <button onClick={refreshDashboard} disabled={isLoading} aria-label="Refresh dashboard" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <RefreshCw aria-hidden="true" size={17} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button onClick={logout} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white lg:hidden">Sign out</button>
          </div>
        </header>

        {error && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><span>{error}</span><button onClick={refreshDashboard} className="font-bold underline">Try again</button></div>}

        <section aria-label="Platform statistics" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, key, icon: Icon, color }) => (
            <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
                <span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon aria-hidden="true" size={19} /></span>
              </div>
              <p className="mt-4 text-3xl font-black tabular-nums">{isLoading ? "—" : stats ? (stats[key] ?? 0).toLocaleString() : "—"}</p>
            </article>
          ))}
        </section>

        <section id="activity" className="mt-9">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><h2 className="text-xl font-extrabold">Recent activity</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Latest records from the platform database.</p></div>
          </div>
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Loading recent activity...</div>
          ) : stats && (
            <div className="grid gap-5 xl:grid-cols-3">
              <ActivityList title="New users" empty="No users have registered yet." rows={stats.recentUsers} render={(row) => <><span className="font-semibold">{row.name}</span><span className="block truncate text-xs text-slate-500">{row.email} · {row.role}</span></>} />
              <ActivityList title="Enrollments" empty="No enrollments yet." rows={stats.recentEnrollments} render={(row) => <><span className="font-semibold">{row.student?.name || "Student record unavailable"}</span><span className="block truncate text-xs text-slate-500">{row.course?.title || "Course record unavailable"}</span></>} />
              <ActivityList title="Messages" empty="No messages received yet." rows={stats.recentMessages} render={(row) => <><span className="font-semibold">{row.fullName}</span><span className="block truncate text-xs text-slate-500">{row.email} · {row.status}</span></>} />
            </div>
          )}
        </section>
        <footer className="mt-10 border-t border-slate-200 py-5 text-sm text-slate-500 dark:border-slate-800">AMADE Software Solutions · Administrator workspace</footer>
      </main>
    </div>
  );
}

function ActivityList({ title, empty, rows = [], render }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="border-b border-slate-100 px-5 py-4 font-bold dark:border-slate-800">{title}</h3>
      {rows.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row) => <li key={row._id} className="px-5 py-4 text-sm">{render(row)}<time className="mt-1 block text-xs text-slate-400" dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleDateString()}</time></li>)}</ul> : <p className="px-5 py-8 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}

export default AdminDashboard;
