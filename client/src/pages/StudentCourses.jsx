import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BookOpen, GraduationCap, LogOut } from "lucide-react";
import { useStudentAuth } from "../context/studentAuthContextValue";
import api from "../services/api";

function StudentCourses() {
  const { user, isLoading: isAuthLoading, logout } = useStudentAuth();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;

    const loadCourses = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/enrollments/my-courses");
        setCourses(response.data.data || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Your enrolled courses could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
    return undefined;
  }, [user]);

  if (isAuthLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/student/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">Student portal</p>
            <h1 className="mt-1 text-2xl font-black">My courses</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/student/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Dashboard</Link>
            <Link to="/academy" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Explore courses</Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">
              <LogOut aria-hidden="true" size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</div>}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Loading your enrolled courses...</div>
        ) : courses.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.filter((enrollment) => enrollment.course).map((enrollment) => {
              const course = enrollment.course;
              return (
                <article key={enrollment._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-green-100 via-white to-slate-100 text-slate-900 dark:from-green-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
                      <BookOpen aria-hidden="true" size={42} className="text-green-600 dark:text-green-400" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${enrollment.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}>{enrollment.status}</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{course.level || "Level not set"}</span>
                    </div>

                    <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">{course.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.instructor?.name ? `Instructor: ${course.instructor.name}` : "AMADE Academy"}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{course.description}</p>

                    <div className="mt-5 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-2"><GraduationCap aria-hidden="true" size={16} /> Progress</span>
                      <span className="font-bold tabular-nums">{enrollment.progress ?? 0}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, Math.max(0, enrollment.progress || 0))}%` }} />
                    </div>

                    <Link to={`/academy/${course._id}`} className="mt-5 block rounded-xl bg-slate-950 px-3 py-2.5 text-center text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-green-500 dark:text-slate-950 dark:hover:bg-green-400">
                      {enrollment.status === "completed" ? "Review course" : "Continue learning"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <BookOpen aria-hidden="true" size={36} className="mx-auto text-green-600 dark:text-green-400" />
            <h2 className="mt-4 text-xl font-extrabold">No enrolled courses yet</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Explore the Academy to find a published course to start learning.</p>
            <Link to="/academy" className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">Explore Academy</Link>
          </section>
        )}
      </main>
    </div>
  );
}

export default StudentCourses;
