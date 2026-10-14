import { motion } from "framer-motion";

const steps = [
  { number: "01", title: "Learn", description: "Build foundational knowledge in technology, skills, and problem-solving." },
  { number: "02", title: "Practice", description: "Apply ideas through guided exercises and practical work." },
  { number: "03", title: "Build", description: "Turn concepts into digital products that solve real challenges." },
  { number: "04", title: "Grow", description: "Create value, opportunities, and sustainable impact over time." },
];

function LearningProcess() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-green-500">Learning Process</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white">
            From learning to building, and beyond.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-green-500">{step.number}</span>
                <span className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <h3 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">{step.title}</h3>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LearningProcess;
