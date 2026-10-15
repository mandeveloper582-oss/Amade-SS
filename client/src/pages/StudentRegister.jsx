import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, UserRoundPlus } from "lucide-react";
import ThemeSelector from "../components/ThemeSelector";
import { useStudentAuth } from "../context/studentAuthContextValue";

function StudentRegister() {
  const { user, register, isLoading } = useStudentAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Restoring secure session...</div>;
  }
  if (user) {
    return <Navigate to="/student/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(form.password)) {
      setError("Use 8–128 characters with an uppercase letter, a lowercase letter, and a number.");
      return;
    }
    if (!form.acceptedTerms) {
      setError("Please accept the terms and conditions to create an account.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        acceptedTerms: form.acceptedTerms,
      });
      navigate("/student/login", {
        replace: true,
        state: {
          ...location.state,
          registrationComplete: true,
        },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Your account could not be created. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center bg-slate-100 px-4 pb-12 pt-20 dark:bg-slate-950">
      <div className="absolute right-4 top-4 z-10">
        <ThemeSelector />
      </div>
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <Link to="/" className="inline-flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white">
          <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-green-400">
            <GraduationCap aria-hidden="true" size={22} />
          </span>
          AMADE <span className="font-medium text-slate-500">Student Portal</span>
        </Link>

        <p className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">Student registration</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Join AMADE Academy and continue your learning journey.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Full name
            <input autoComplete="name" maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Email address
            <input autoComplete="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Phone number <span className="font-normal text-slate-500">(optional)</span>
            <input autoComplete="tel" type="tel" maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Password
            <input autoComplete="new-password" type="password" minLength={8} maxLength={128} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            <span className="mt-1 block text-xs font-normal text-slate-500">At least 8 characters, with uppercase, lowercase, and a number.</span>
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Confirm password
            <input autoComplete="new-password" type="password" minLength={8} maxLength={128} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </label>

          <label className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={form.acceptedTerms} onChange={(event) => setForm({ ...form, acceptedTerms: event.target.checked })} className="mt-1 size-4 shrink-0 accent-green-600" />
            <span>I agree to the terms and conditions for using the AMADE student portal.</span>
          </label>

          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-500 dark:text-slate-950 dark:hover:bg-green-400">
            <UserRoundPlus aria-hidden="true" size={18} />
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
          Already registered?{" "}
          <Link to="/student/login" state={location.state} className="font-bold text-green-700 hover:underline dark:text-green-400">Sign in</Link>
        </p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-green-700 dark:text-slate-300 dark:hover:text-green-400">
          <ArrowLeft aria-hidden="true" size={16} /> Back to AMADE website
        </Link>
      </section>
    </main>
  );
}

export default StudentRegister;
