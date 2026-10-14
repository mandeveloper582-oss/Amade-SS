import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Globe,
  GraduationCap,
  Lightbulb,
  ShoppingCart,
  Smartphone,
} from "lucide-react";
import { services } from "../../data/services";
import api from "../../services/api";
import SectionTitle from "../SectionTitle";

const serviceIcons = [Globe, Code2, ShoppingCart, Smartphone, GraduationCap, Lightbulb];

function ServicesSection() {
  const [visibleServices, setVisibleServices] = useState(services);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/services", { params: { limit: 100 }, signal: controller.signal })
      .then(({ data }) => {
        const published = data.data?.data || [];
        if (published.length) {
          setVisibleServices(published.map((service) => ({
            ...service,
            id: service.slug || service._id,
            description: service.shortDescription || service.description,
          })));
        }
      })
      .catch((error) => {
        if (error.name !== "CanceledError") {
          console.error("Unable to load published services.", error);
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="What We Do"
          title="Digital solutions built for real needs."
          description="We turn ideas, challenges, and opportunities into practical digital products using modern technologies."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleServices.map((service, index) => {
            const Icon = serviceIcons[index % serviceIcons.length];

            return (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                whileHover={{ y: -6 }}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:border-green-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:hover:border-green-900"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 transition group-hover:bg-green-500 group-hover:text-slate-950 dark:bg-green-500/10 dark:text-green-400">
                  <Icon size={24} />
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-950 dark:text-white">{service.title}</h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{service.description}</p>

                <div className="mt-6 text-sm font-bold text-green-600 dark:text-green-400">Learn more →</div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;