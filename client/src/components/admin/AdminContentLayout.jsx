import { Link, Navigate, NavLink } from "react-router-dom";
import {
  BookOpen, BriefcaseBusiness, FileText, GraduationCap, LayoutDashboard,
  LogOut, Mail, ShieldCheck, Users, Wrench,
} from "lucide-react";
import { useAdminAuth } from "../../context/adminAuthContextValue";

const navigation = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Courses", to: "/admin/courses", icon: BookOpen },
  { label: "Students", to: "/admin/students", icon: Users },
  { label: "Enrollments", to: "/admin/enrollments", icon: GraduationCap },
  { label: "Projects", to: "/admin/projects", icon: BriefcaseBusiness },
  { label: "Services", to: "/admin/services", icon: Wrench },
  { label: "Blog posts", to: "/admin/blog", icon: FileText },
  { label: "Messages", to: "/admin/messages", icon: Mail },
];

function AdminContentLayout({ children }) {
  const { user, isLoading, logout } = useAdminAuth();

  if (isLoading) {
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
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon aria-hidden="true" size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="mb-3 truncate px-2 text-sm font-medium text-slate-300">{user.name}</div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
            <LogOut aria-hidden="true" size={18} /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mb-5 flex justify-end lg:hidden">
          <button onClick={logout} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">Sign out</button>
        </div>
        {children}
      </main>
    </div>
  );
}

export default AdminContentLayout;
