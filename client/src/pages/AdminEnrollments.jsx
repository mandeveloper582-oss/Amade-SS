import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, GraduationCap, LogOut, Search, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../context/adminAuthContextValue";
import api from "../services/api";

function AdminEnrollments() {
  const { user, isLoading: isAuthLoading, logout } = useAdminAuth();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!user) return undefined;

    const controller = new AbortController();
    const loadEnrollments = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/enrollments/admin", {
          params: { page, limit: 10, search, status },
          signal: controller.signal,
        });
        setResult(response.data.data);
      } catch (requestError) {
        if (requestError.name !== "CanceledError") {
          setError(requestError.response?.data?.message || "Enrollments could not be loaded. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadEnrollments();
    return () => controller.abort();
  }, [page, search, status, user]);

  if (isAuthLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const changeEnrollmentStatus = async (enrollmentId, nextStatus) => {
    setUpdatingId(enrollmentId);
    setError("");
    try {
      await api.patch(`/enrollments/admin/${enrollmentId}/status`, { status: nextStatus });
      const response = await api.get("/enrollments/admin", {
        params: { page, limit: 10, search, status },
      });
      setResult(response.data.data);
      setSelectedEnrollment((current) => current?._id === enrollmentId
        ? { ...current, status: nextStatus, progress: nextStatus === "completed" ? 100 : current.progress }
        : current);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Enrollment status could not be updated.");
    } finally {
      setUpdatingId("");
    }
  };

  const changeFilter = (nextStatus) => {
    setPage(1);
    setStatus(nextStatus);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      <aside className="flex w-full flex-col bg-slate-950 text-white lg:min-h-screen lg:w-64 lg:shrink-0">
        <Link to="/admin" className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <span className="grid size-10 place-items-center rounded-xl bg-green-400 text-slate-950"><ShieldCheck aria-hidden="true" size={22} /></span>
          <span><span className="block font-black tracking-wide">AMADE</span><span className="text-xs text-slate-400">Admin workspace</span></span>
        </Link>
        <nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto p-4 lg:flex-1 lg:flex-col">
          <Link to="/admin" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><ArrowLeft aria-hidden="true" size={18} /> Dashboard</Link>
          <Link to="/admin/courses" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><BookOpen aria-hidden="true" size={18} /> Courses</Link>
          <Link to="/admin/students" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">Students</Link>
          <Link to="/admin/enrollments" aria-current="page" className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"><GraduationCap aria-hidden="true" size={18} /> Enrollments</Link>
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="mb-3 truncate px-2 text-sm font-medium text-slate-300">{user.name}</div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><LogOut aria-hidden="true" size={18} /> Sign out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">Academy</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Enrollments</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Review learner course registrations, progress, and enrollment status.</p>
          </div>
          <button onClick={logout} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white lg:hidden">Sign out</button>
        </header>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <label className="sr-only" htmlFor="enrollment-search">Search students or courses</label>
              <input id="enrollment-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search student or course..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950" />
            </div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Enrollment status
              <select value={status} onChange={(event) => changeFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          {error && <p role="alert" className="mx-4 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200 sm:mx-5">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                <tr><th scope="col" className="px-5 py-3">Student</th><th scope="col" className="px-5 py-3">Course</th><th scope="col" className="px-5 py-3">Progress</th><th scope="col" className="px-5 py-3">Enrolled</th><th scope="col" className="px-5 py-3">Status</th><th scope="col" className="px-5 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">Loading enrollments...</td></tr>}
                {!isLoading && !error && result?.data.length === 0 && <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">No enrollments match these filters.</td></tr>}
                {!isLoading && !error && result?.data.map((enrollment) => (
                  <tr key={enrollment._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4"><span className="font-bold">{enrollment.student?.name || "Student unavailable"}</span><span className="mt-1 block text-xs text-slate-500">{enrollment.student?.email || ""}</span></td>
                    <td className="px-5 py-4"><span className="font-semibold">{enrollment.course?.title || "Course unavailable"}</span><span className="mt-1 block text-xs capitalize text-slate-500">{enrollment.course?.status || "missing course"}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2"><div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, Math.max(0, enrollment.progress || 0))}%` }} /></div><span className="tabular-nums">{enrollment.progress || 0}%</span></div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300"><time dateTime={enrollment.enrolledAt || enrollment.createdAt}>{new Date(enrollment.enrolledAt || enrollment.createdAt).toLocaleDateString()}</time></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${enrollment.status === "completed" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : enrollment.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{enrollment.status}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={async () => {
                          try {
                            const response = await api.get(`/enrollments/${enrollment._id}`);
                            setSelectedEnrollment(response.data.data);
                          } catch (requestError) {
                            setError(requestError.response?.data?.message || "Enrollment details could not be loaded.");
                          }
                        }} className="font-bold text-blue-700 hover:underline dark:text-blue-300">Details</button>
                        <label className="sr-only" htmlFor={`status-${enrollment._id}`}>Change status for {enrollment.student?.name || "student"} in {enrollment.course?.title || "course"}</label>
                        <select id={`status-${enrollment._id}`} value={enrollment.status} disabled={updatingId === enrollment._id} onChange={(event) => changeEnrollmentStatus(enrollment._id, event.target.value)} className="max-w-32 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950">
                          <option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <p className="text-sm text-slate-500">{result ? `${result.pagination.total} enrollment${result.pagination.total === 1 ? "" : "s"}` : " "}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading} aria-label="Previous page" className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-700"><ChevronLeft aria-hidden="true" size={18} /></button>
              <span className="min-w-20 text-center text-sm text-slate-600 dark:text-slate-300">Page {result?.pagination.page || page} of {Math.max(1, result?.pagination.pages || 1)}</span>
              <button onClick={() => setPage((current) => current + 1)} disabled={isLoading || page >= (result?.pagination.pages || 1)} aria-label="Next page" className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-700"><ChevronRight aria-hidden="true" size={18} /></button>
            </div>
          </div>
        </section>

        {selectedEnrollment && (
          <section aria-label="Enrollment details" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">Enrollment details</p><h2 className="mt-1 text-xl font-extrabold">{selectedEnrollment.course?.title || "Course unavailable"}</h2><p className="mt-1 text-sm text-slate-500">{selectedEnrollment.student?.name || "Student unavailable"} · {selectedEnrollment.student?.email || ""}</p></div>
              <button onClick={() => setSelectedEnrollment(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Close details</button>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <p className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><span className="block text-xs text-slate-500">Status</span><span className="mt-1 block font-bold capitalize">{selectedEnrollment.status}</span></p>
              <p className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><span className="block text-xs text-slate-500">Progress</span><span className="mt-1 block font-bold">{selectedEnrollment.progress}% · {selectedEnrollment.completedLessons?.length || 0} completed lessons</span></p>
              <p className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><span className="block text-xs text-slate-500">Completed</span><span className="mt-1 block font-bold">{selectedEnrollment.completedAt ? new Date(selectedEnrollment.completedAt).toLocaleDateString() : "Not completed"}</span></p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminEnrollments;
