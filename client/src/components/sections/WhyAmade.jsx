import { motion } from "framer-motion";
import { BadgeCheck, BrainCircuit, Lightbulb, Users } from "lucide-react";
import SectionTitle from "../SectionTitle";

const reasons = [
  {
    icon: Lightbulb,
    title: "Practical Solutions",
    description: "We focus on real-world problems and build technology that solves them effectively.",
  },
  {
    icon: BrainCircuit,
    title: "Modern Technology",
    description: "We use modern tools and thoughtful development practices to deliver better experiences.",
  },
  {
    icon: BadgeCheck,
    title: "Practical Learning",
    description: "We combine hands-on learning, guidance, and real project experience to build confidence.",
  },
  {
    icon: Users,
    title: "Customer Focus",
    description: "Every solution is shaped around the user, the business need, and measurable impact.",
  },
];

function WhyAmade() {
  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Why AMADE"
          title="We help ideas become real opportunities."
          description="AMADE was built to connect technology, education, and entrepreneurship in a way that creates impact for individuals and businesses."
          centered
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {reasons.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-green-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyAmade;
