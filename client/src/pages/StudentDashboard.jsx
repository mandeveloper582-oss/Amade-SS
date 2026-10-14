import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BookOpen, BriefcaseBusiness, GraduationCap, LogOut, UserCircle2 } from "lucide-react";
import { useStudentAuth } from "../context/studentAuthContextValue";
import api from "../services/api";

function StudentDashboard() {
  const { user, isLoading: isAuthLoading, logout } = useStudentAuth();
  const [dashboard, setDashboard] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [dashboardResponse, myCoursesResponse] = await Promise.all([
          api.get("/students/dashboard"),
          api.get("/students/my-courses"),
        ]);

        setDashboard(dashboardResponse.data.data);
        setCourses(myCoursesResponse.data.data || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Your student dashboard could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
    return undefined;
  }, [user]);

  if (isAuthLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/student/login" replace />;
  }

  const totalCompleted = dashboard?.totalCompleted ?? 0;
  const totalEnrollments = dashboard?.totalEnrollments ?? 0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">Student portal</p>
            <h1 className="mt-1 text-2xl font-black">Welcome, {user.name?.split(" ")[0] || "student"}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/student/profile" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <UserCircle2 aria-hidden="true" size={16} /> Profile
            </Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">
              <LogOut aria-hidden="true" size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Enrollments" value={totalEnrollments} icon={BookOpen} accent="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" />
          <StatCard title="Completed" value={totalCompleted} icon={GraduationCap} accent="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" />
          <StatCard title="In progress" value={dashboard?.totalInProgress ?? 0} icon={BriefcaseBusiness} accent="bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" />
          <StatCard title="Overall progress" value={dashboard ? `${dashboard.overallProgress ?? 0}%` : "—"} icon={BriefcaseBusiness} accent="bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">My learning</p>
                <h2 className="mt-1 text-xl font-extrabold">Current courses</h2>
              </div>
              <Link to="/student/courses" className="text-sm font-semibold text-green-700 dark:text-green-400">Browse courses</Link>
            </div>

            {isLoading ? (
              <div className="rounded-xl bg-slate-100 p-6 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">Loading your learning progress...</div>
            ) : courses.length ? (
              <div className="space-y-4">
                {courses.slice(0, 4).map((enrollment) => (
                  <div key={enrollment._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{enrollment.course?.title || "Course"}</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{enrollment.course?.level || "Beginner"}</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800 dark:bg-green-950 dark:text-green-300">{enrollment.status}</span>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${enrollment.progress ?? 0}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                      <span>{enrollment.progress ?? 0}% complete</span>
                      <Link to={`/academy/${enrollment.course?._id}`} className="font-semibold text-slate-900 dark:text-white">Open course</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-100 p-6 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">You have not enrolled in any courses yet. Browse available courses to get started.</div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">Quick links</p>
            <div className="mt-4 space-y-3">
              <Link to="/student/courses" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                Available courses <span>→</span>
              </Link>
              <Link to="/academy" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                Academy homepage <span>→</span>
              </Link>
              <Link to="/student/profile" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                Edit profile <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, accent }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
        <span className={`grid size-10 place-items-center rounded-xl ${accent}`}>
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-black tabular-nums">{value}</p>
    </article>
  );
}

export default StudentDashboard;
