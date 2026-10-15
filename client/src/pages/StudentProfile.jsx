import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { LogOut, Save, UserCircle2 } from "lucide-react";
import ThemeSelector from "../components/ThemeSelector";
import { useStudentAuth } from "../context/studentAuthContextValue";
import api from "../services/api";

function StudentProfile() {
  const { user, isLoading: isAuthLoading, logout } = useStudentAuth();
  const [profile, setProfile] = useState({ name: "", phone: "", email: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return undefined;

    const loadProfile = async () => {
      try {
        const response = await api.get("/students/profile");
        const currentProfile = response.data.data;
        setProfile({
          name: currentProfile.name || "",
          phone: currentProfile.phone || "",
          email: currentProfile.email || "",
        });
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Profile information could not be loaded.");
      }
    };

    loadProfile();
    return undefined;
  }, [user]);

  if (isAuthLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/student/login" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      await api.put("/students/profile", {
        name: profile.name,
        phone: profile.phone,
      });
      setSuccess("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Profile could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(passwordForm.newPassword)) {
      setPasswordError("Use 8–128 characters with an uppercase letter, a lowercase letter, and a number.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSuccess("Password changed successfully.");
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.message || "Password could not be changed. Check your current password and try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">Student portal</p>
            <h1 className="mt-1 text-2xl font-black">Profile settings</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <ThemeSelector />
            <Link to="/student/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Dashboard</Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">
              <LogOut aria-hidden="true" size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/60">
            <span className="grid size-12 place-items-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
              <UserCircle2 aria-hidden="true" size={24} />
            </span>
            <div>
              <h2 className="text-xl font-black">{profile.name || "Student profile"}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{profile.email || user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
            {success && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-200">{success}</p>}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Full name
                <input
                  type="text"
                  value={profile.name}
                  onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Phone number
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
              Email address remains tied to your student account and cannot be changed here.
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-500 dark:text-slate-950 dark:hover:bg-green-400"
            >
              <Save aria-hidden="true" size={18} />
              {isSaving ? "Saving changes..." : "Save profile"}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-black">Change password</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Confirm your current password before choosing a new one.</p>
          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
            {passwordError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{passwordError}</p>}
            {passwordSuccess && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-200">{passwordSuccess}</p>}
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Current password
                <input type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                New password
                <input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Confirm new password
                <input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
            </div>
            <button type="submit" disabled={isChangingPassword} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-500 dark:text-slate-950">
              {isChangingPassword ? "Updating password..." : "Update password"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default StudentProfile;
