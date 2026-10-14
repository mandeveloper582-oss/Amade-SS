import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, GraduationCap, LogOut, Search, ShieldCheck, Users } from "lucide-react";
import { useAdminAuth } from "../context/adminAuthContextValue";
import api from "../services/api";

function AdminStudents() {
  const { user, isLoading: isAuthLoading, logout } = useAdminAuth();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

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
    const loadStudents = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/students/admin", {
          params: { page, limit: 10, search, status },
          signal: controller.signal,
        });
        setResult(response.data.data);
      } catch (requestError) {
        if (requestError.name !== "CanceledError") {
          setError(requestError.response?.data?.message || "Students could not be loaded. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadStudents();
    return () => controller.abort();
  }, [page, search, status, user]);

  if (isAuthLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const openStudent = async (studentId) => {
    setSelectedStudent(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const response = await api.get(`/students/admin/${studentId}`);
      setSelectedStudent(response.data.data);
    } catch (requestError) {
      setDetailError(requestError.response?.data?.message || "Student details could not be loaded.");
    } finally {
      setDetailLoading(false);
    }
  };

  const changeStatus = async (student) => {
    setUpdatingId(student._id);
    setError("");
    try {
      await api.patch(`/students/admin/${student._id}/status`, { isActive: !student.isActive });
      const response = await api.get("/students/admin", {
        params: { page, limit: 10, search, status },
      });
      setResult(response.data.data);
      if (response.data.data.pagination.pages > 0 && page > response.data.data.pagination.pages) {
        setPage(response.data.data.pagination.pages);
      }
      setSelectedStudent((current) => current?._id === student._id
        ? { ...current, isActive: !current.isActive }
        : current);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Student status could not be updated.");
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
          <Link to="/admin/students" aria-current="page" className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"><Users aria-hidden="true" size={18} /> Students</Link>
          <Link to="/admin/enrollments" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><GraduationCap aria-hidden="true" size={18} /> Enrollments</Link>
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="mb-3 truncate px-2 text-sm font-medium text-slate-300">{user.name}</div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><LogOut aria-hidden="true" size={18} /> Sign out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">People</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Students</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Find student accounts, review enrollments, and manage account access.</p>
          </div>
          <button onClick={logout} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white lg:hidden">Sign out</button>
        </header>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <label className="sr-only" htmlFor="student-search">Search students by name or email</label>
              <input id="student-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name or email..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950" />
            </div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Account status
              <select value={status} onChange={(event) => changeFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="all">All students</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          {error && <p role="alert" className="mx-4 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200 sm:mx-5">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                <tr><th scope="col" className="px-5 py-3">Student</th><th scope="col" className="px-5 py-3">Enrollments</th><th scope="col" className="px-5 py-3">Joined</th><th scope="col" className="px-5 py-3">Status</th><th scope="col" className="px-5 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-500">Loading students...</td></tr>}
                {!isLoading && !error && result?.data.length === 0 && <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-500">No students match these filters.</td></tr>}
                {!isLoading && !error && result?.data.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <span className="font-bold">{student.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{student.email}</span>
                    </td>
                    <td className="px-5 py-4 tabular-nums">{student.enrollmentCount}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300"><time dateTime={student.createdAt}>{new Date(student.createdAt).toLocaleDateString()}</time></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${student.isActive ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{student.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openStudent(student._id)} className="font-bold text-blue-700 hover:underline dark:text-blue-300">Details</button>
                        <button onClick={() => changeStatus(student)} disabled={updatingId === student._id} className="font-semibold text-slate-600 hover:underline disabled:opacity-50 dark:text-slate-300">{updatingId === student._id ? "Saving..." : student.isActive ? "Deactivate" : "Activate"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <p className="text-sm text-slate-500">{result ? `${result.pagination.total} student${result.pagination.total === 1 ? "" : "s"}` : " "}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading} aria-label="Previous page" className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-700"><ChevronLeft aria-hidden="true" size={18} /></button>
              <span className="min-w-20 text-center text-sm text-slate-600 dark:text-slate-300">Page {result?.pagination.page || page} of {Math.max(1, result?.pagination.pages || 1)}</span>
              <button onClick={() => setPage((current) => current + 1)} disabled={isLoading || page >= (result?.pagination.pages || 1)} aria-label="Next page" className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-700"><ChevronRight aria-hidden="true" size={18} /></button>
            </div>
          </div>
        </section>

        {detailLoading && <p role="status" className="mt-6 text-sm text-slate-500">Loading student details...</p>}
        {detailError && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{detailError}</p>}
        {selectedStudent && (
          <section aria-label="Student details" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">Student profile</p><h2 className="mt-1 text-xl font-extrabold">{selectedStudent.name}</h2><p className="mt-1 text-sm text-slate-500">{selectedStudent.email}{selectedStudent.phone ? ` · ${selectedStudent.phone}` : ""}</p></div>
              <button onClick={() => setSelectedStudent(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Close details</button>
            </div>
            <h3 className="mt-6 flex items-center gap-2 font-bold"><GraduationCap aria-hidden="true" size={19} /> Enrollments ({selectedStudent.enrollments.length})</h3>
            {selectedStudent.enrollments.length ? (
              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {selectedStudent.enrollments.map((enrollment) => (
                  <li key={enrollment._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="font-semibold">{enrollment.course?.title || "Course unavailable"}<span className="mt-1 block text-xs font-normal text-slate-500">{enrollment.course?.status || "Course record missing"}</span></span>
                    <span className="text-slate-600 dark:text-slate-300">{enrollment.status} · {enrollment.progress}%</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500 dark:bg-slate-950">This student has no enrollments.</p>}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminStudents;
