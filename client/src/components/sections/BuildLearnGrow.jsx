import { motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, Code2, TrendingUp } from "lucide-react";
import SectionTitle from "../SectionTitle";

const pillars = [
  {
    number: "BUILD",
    icon: Code2,
    title: "Build",
    description: "Build software and digital solutions that solve real problems.",
  },
  {
    number: "LEARN",
    icon: BriefcaseBusiness,
    title: "Learn",
    description: "Develop practical technology, computer and entrepreneurship skills.",
  },
  {
    number: "GROW",
    icon: TrendingUp,
    title: "Grow",
    description: "Use technology and knowledge to create opportunities and sustainable growth.",
  },
];

function BuildLearnGrow() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Build • Learn • Grow"
          title="Technology that creates opportunity."
          description="AMADE connects software development, practical learning, and entrepreneurship to help people and businesses move forward."
          centered
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;

            return (
              <motion.article
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-green-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:hover:border-green-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black tracking-[0.18em] text-green-500">{pillar.number}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600 transition group-hover:bg-green-500 group-hover:text-slate-950 dark:bg-green-500/10 dark:text-green-400">
                    <Icon size={22} />
                  </div>
                </div>

                <h3 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">{pillar.title}</h3>
                <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">{pillar.description}</p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                  Explore <ArrowRight size={16} />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default BuildLearnGrow;
