import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, ChevronLeft, ChevronRight, LogOut, Plus, Search, ShieldCheck,
} from "lucide-react";
import { useAdminAuth } from "../context/adminAuthContextValue";
import api from "../services/api";

const emptyCourse = {
  title: "",
  description: "",
  thumbnail: "",
  category: "General",
  status: "draft",
  duration: "4 weeks",
  level: "Beginner",
  technologies: "",
  price: "0",
  isPublished: false,
};

function AdminCourses() {
  const { user, isLoading: isAuthLoading, logout } = useAdminAuth();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const loadCourses = useCallback(async (signal) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/courses/admin", {
        params: { page, limit: 10, search, status },
        signal,
      });
      setResult(response.data.data);
    } catch (requestError) {
      if (requestError.name !== "CanceledError") {
        setError(requestError.response?.data?.message || "Courses could not be loaded. Please try again.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    if (!user) return undefined;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => loadCourses(controller.signal), 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [loadCourses, refreshKey, user]);

  if (isAuthLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const startCreate = () => {
    setEditingCourse(null);
    setForm(emptyCourse);
    setFormError("");
  };

  const startEdit = (course) => {
    setEditingCourse(course);
    setForm({
      title: course.title || "",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      category: course.category || "General",
      status: course.status || "draft",
      duration: course.duration || "",
      level: course.level || "",
      technologies: (course.technologies || []).join(", "),
      price: String(course.price ?? 0),
      isPublished: Boolean(course.isPublished),
    });
    setFormError("");
  };

  const closeForm = () => {
    setEditingCourse(null);
    setForm(null);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError("");

    const payload = {
      ...form,
      price: Number(form.price),
      technologies: form.technologies.split(",").map((technology) => technology.trim()).filter(Boolean),
      isPublished: form.status === "published" && form.isPublished,
    };

    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse._id}`, payload);
      } else {
        await api.post("/courses", payload);
      }
      closeForm();
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || "Course could not be saved. Please check the fields and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = (nextStatus) => {
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
          <Link to="/admin/courses" aria-current="page" className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"><BookOpen aria-hidden="true" size={18} /> Courses</Link>
          <Link to="/admin/students" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">Students</Link>
          <Link to="/admin/enrollments" className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">Enrollments</Link>
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
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Courses</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Create and update course details and publishing status.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white lg:hidden">Sign out</button>
            <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-green-500 dark:text-slate-950">
              <Plus aria-hidden="true" size={17} /> Add course
            </button>
          </div>
        </header>

        {(formError || error) && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{formError || error}</p>}

        {form && (
          <section aria-label={editingCourse ? "Edit course" : "Create course"} className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">{editingCourse ? "Update course" : "New course"}</p>
                <h2 className="mt-1 text-xl font-extrabold">{editingCourse ? editingCourse.title : "Course details"}</h2>
              </div>
              <button type="button" onClick={closeForm} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold sm:col-span-1">Title
                <input required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-semibold">Category
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-semibold">Thumbnail URL
                <input type="url" value={form.thumbnail} onChange={(event) => setForm({ ...form, thumbnail: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-semibold">Duration
                <input value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-semibold">Level
                <input value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-semibold">Price
                <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-semibold">Status
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value, isPublished: event.target.value === "published" && form.isPublished })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950">
                  <option value="draft">Draft</option>
                  <option value="coming_soon">Coming soon</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">Technologies
                <input value={form.technologies} onChange={(event) => setForm({ ...form, technologies: event.target.value })} placeholder="Comma-separated list" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-semibold sm:col-span-2">Description
                <textarea required rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
                <input type="checkbox" checked={form.isPublished} disabled={form.status !== "published"} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} className="size-4 accent-green-600" />
                Publicly visible on the Academy
              </label>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button type="submit" disabled={isSaving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-500 dark:text-slate-950">{isSaving ? "Saving..." : editingCourse ? "Save changes" : "Create course"}</button>
                <button type="button" onClick={closeForm} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold dark:border-slate-700">Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <label className="sr-only" htmlFor="course-search">Search courses</label>
              <input id="course-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search title, category, or description..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950" />
            </div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Course status
              <select value={status} onChange={(event) => changeStatus(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="all">All courses</option>
                <option value="draft">Draft</option>
                <option value="coming_soon">Coming soon</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                <tr><th scope="col" className="px-5 py-3">Course</th><th scope="col" className="px-5 py-3">Category</th><th scope="col" className="px-5 py-3">Price</th><th scope="col" className="px-5 py-3">Visibility</th><th scope="col" className="px-5 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-500">Loading courses...</td></tr>}
                {!isLoading && !error && result?.data.length === 0 && <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-500">No courses match these filters.</td></tr>}
                {!isLoading && !error && result?.data.map((course) => (
                  <tr key={course._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4"><span className="font-bold">{course.title}</span><span className="mt-1 block text-xs text-slate-500">{course.duration || "Duration not set"} · {course.level || "Level not set"}</span></td>
                    <td className="px-5 py-4">{course.category || "General"}</td>
                    <td className="px-5 py-4 tabular-nums">{course.price ? `$${course.price}` : "Free"}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${course.isPublished ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{course.isPublished ? "Public" : course.status.replace("_", " ")}</span></td>
                    <td className="px-5 py-4"><button onClick={() => startEdit(course)} className="font-bold text-blue-700 hover:underline dark:text-blue-300">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <p className="text-sm text-slate-500">{result ? `${result.pagination.total} course${result.pagination.total === 1 ? "" : "s"}` : " "}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading} aria-label="Previous page" className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-700"><ChevronLeft aria-hidden="true" size={18} /></button>
              <span className="min-w-20 text-center text-sm text-slate-600 dark:text-slate-300">Page {result?.pagination.page || page} of {Math.max(1, result?.pagination.pages || 1)}</span>
              <button onClick={() => setPage((current) => current + 1)} disabled={isLoading || page >= (result?.pagination.pages || 1)} aria-label="Next page" className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-slate-700"><ChevronRight aria-hidden="true" size={18} /></button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminCourses;
