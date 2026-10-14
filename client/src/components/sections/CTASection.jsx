import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-4xl border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl sm:p-12 dark:border-slate-800">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-400">Have an Idea?</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Let&apos;s Build It.</h2>
              <p className="mt-4 text-base leading-8 text-slate-300 sm:text-lg">
                Have a project, business idea, or digital problem? Let&apos;s discuss it and turn your idea into a practical digital solution.
              </p>
            </div>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-4 text-base font-bold text-slate-950 transition hover:bg-green-400"
            >
              Start a Project
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
