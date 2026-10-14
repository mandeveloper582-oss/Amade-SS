import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-500">404</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950 dark:text-white sm:text-5xl">Page not found</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          The page you are looking for does not exist or has moved.
        </p>
        <Link to="/" className="mt-8 inline-flex items-center justify-center rounded-xl bg-green-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-green-400">
          Return home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
