import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Code2, Sparkles } from "lucide-react";
import Button from "../Button";

const highlights = [
  "Modern Software Solutions",
  "Practical Technology Training",
  "Business & Entrepreneurship Support",
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-green-500/15 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200 backdrop-blur">
            <Sparkles size={16} className="text-green-400" />
            Technology • Software Solutions • Training • Entrepreneurship
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            Build Your
            <span className="block text-green-400">Digital Future</span>
            with AMADE.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            AMADE Software Solutions builds modern digital products, provides practical technology training,
            and helps individuals and businesses turn ideas into real solutions.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button to="/contact">Get Started</Button>
            <Button to="/services" variant="secondary">Explore Services</Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-green-400" />
              Practical solutions
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-green-400" />
              Modern technology
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500 text-slate-950">
                  <Code2 size={22} />
                </div>
                <div>
                  <p className="font-bold">AMADE Solutions</p>
                  <p className="text-xs text-slate-400">Digital Innovation</p>
                </div>
              </div>
              <span className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_18px_rgba(34,197,94,0.8)]" />
            </div>

            <div className="grid gap-4 py-6">
              {highlights.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 + index * 0.12 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-xs font-bold text-blue-300">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{item}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">Practical, modern and purpose-driven.</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <p className="text-sm text-slate-400">Build • Learn • Innovate • Grow</p>
              <ArrowRight className="text-green-400" size={20} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;