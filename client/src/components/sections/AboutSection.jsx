import { motion } from "framer-motion";
import {
  Check,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";
import SectionTitle from "../SectionTitle";

const values = [
  "Innovation",
  "Quality",
  "Practical Learning",
  "Customer Focus",
  "Continuous Improvement",
  "Community Impact",
];

function AboutSection() {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">

        <div>
          <SectionTitle
            eyebrow="About AMADE"
            title="We build technology that creates opportunity."
            description="AMADE Software Solutions is built around a simple idea: technology should not only solve problems, but also create opportunities to learn, build and grow."
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {values.map((value) => (
              <div
                key={value}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <Check size={15} />
                </span>

                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-4xl bg-slate-950 p-8 text-white shadow-2xl sm:p-10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-400">
              Our Direction
            </p>

            <h3 className="mt-5 text-3xl font-black">
              Technology with purpose.
            </h3>

            <p className="mt-5 leading-8 text-slate-300">
              We aim to connect technology, practical education and
              entrepreneurship so people and organizations can turn
              ideas into useful digital solutions.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                [Lightbulb, "Innovate"],
                [Target, "Solve"],
                [TrendingUp, "Grow"],
              ].map(([Icon, text]) => (
                <div
                  key={text}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
                >
                  <Icon className="mx-auto text-green-400" size={22} />
                  <p className="mt-2 text-sm font-semibold">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;