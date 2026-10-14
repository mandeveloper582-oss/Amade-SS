import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Code2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { projects } from "../../data/projects";
import api from "../../services/api";
import Button from "../Button";
import SectionTitle from "../SectionTitle";

function ProjectsSection() {
  const [visibleProjects, setVisibleProjects] = useState(projects);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/projects", { params: { limit: 100 }, signal: controller.signal })
      .then(({ data }) => {
        const published = data.data?.data || [];
        if (published.length) {
          setVisibleProjects(published.map((project) => ({
            ...project,
            id: project.slug || project._id,
            technologies: project.technologies || [],
          })));
        }
      })
      .catch((error) => {
        if (error.name !== "CanceledError") {
          console.error("Unable to load published projects.", error);
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Featured Projects"
          title="Ideas turned into digital products."
          description="Explore the types of digital products and systems AMADE can design and build for real opportunities."
        />

        <div className="mt-14 grid gap-7 lg:grid-cols-3">
          {visibleProjects.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="relative">
                <img src={project.image} alt={project.title} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                <div className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-green-400 backdrop-blur">
                  {project.category}
                </div>
              </div>

              <div className="p-7">
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">{project.title}</h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{project.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span key={tech} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-between gap-3">
                  <div className="flex gap-3">
                    {project.liveDemo && (
                      <a href={project.liveDemo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                        Live Demo <ExternalLink size={15} />
                      </a>
                    )}
                    {project.github && (
                      <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                        Code <Code2 size={15} />
                      </a>
                    )}
                  </div>

                  <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400">
                    View Project <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-10">
          <Button to="/projects">View All Projects</Button>
        </div>
      </div>
    </section>
  );
}

export default ProjectsSection;