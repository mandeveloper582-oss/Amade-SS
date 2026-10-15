import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import ThemeSelector from "../components/ThemeSelector";
import { useAdminAuth } from "../context/adminAuthContextValue";

function AdminLogin() {
  const { user, login, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate("/admin", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center bg-slate-100 px-4 pb-12 pt-20 dark:bg-slate-950">
      <div className="absolute right-4 top-4 z-10">
        <ThemeSelector />
      </div>
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <a href="/" className="inline-flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white">
          <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-green-400">
            <ShieldCheck aria-hidden="true" size={23} />
          </span>
          AMADE <span className="font-medium text-slate-500">Software Solutions</span>
        </a>
        <p className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">Administrator access</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Sign in with an authorized administrator account to manage AMADE.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Email address
            <input
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Password
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-500 dark:text-slate-950 dark:hover:bg-green-400"
            type="submit"
            disabled={isSubmitting}
          >
            <LockKeyhole aria-hidden="true" size={18} />
            {isSubmitting ? "Signing in..." : "Sign in securely"}
          </button>
        </form>
        <a href="/" className="mt-6 inline-block text-sm font-semibold text-slate-600 hover:text-green-700 dark:text-slate-300 dark:hover:text-green-400">Back to AMADE website</a>
      </section>
    </main>
  );
}

export default AdminLogin;
