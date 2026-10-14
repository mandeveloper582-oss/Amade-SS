import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Code2, ExternalLink } from "lucide-react";
import { projects } from "../data/projects";
import api from "../services/api";

function ProjectDetails() {
  const { id } = useParams();

  const staticProject = useMemo(
    () => projects.find((item) => String(item.id) === String(id)),
    [id],
  );
  const [remoteProject, setRemoteProject] = useState(null);

  useEffect(() => {
    if (staticProject) return undefined;

    const controller = new AbortController();
    api.get(`/projects/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(({ data }) => setRemoteProject({
        id,
        project: {
          ...data.data,
          image: data.data.image || "",
          description: data.data.overview || data.data.description,
          technologies: data.data.technologies || [],
          features: data.data.features || [],
        },
      }))
      .catch((error) => {
        if (error.name !== "CanceledError") {
          setRemoteProject({ id, project: null });
          console.error("Unable to load project details.", error);
        }
      });
    return () => controller.abort();
  }, [id, staticProject]);
  const project = staticProject || (remoteProject?.id === id ? remoteProject.project : null);
  const isLoading = !staticProject && remoteProject?.id !== id;

  if (isLoading) {
    return <section className="mx-auto max-w-4xl px-4 py-24 text-center text-slate-500">Loading project...</section>;
  }

  if (!project) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-500">404</p>
          <h1 className="mt-4 text-4xl font-black text-slate-950 dark:text-white">Project not found</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">The requested project could not be found.</p>
          <Link to="/projects" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 font-bold text-slate-950">
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <img src={project.image} alt={project.title} className="h-72 w-full object-cover sm:h-96" />

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-500">{project.category}</p>
                <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">{project.title}</h1>
              </div>
              <div className="flex gap-3">
                {project.liveDemo && (
                  <a href={project.liveDemo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    Live Demo <ExternalLink size={16} />
                  </a>
                )}
                {project.github && (
                  <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                    GitHub <Code2 size={16} />
                  </a>
                )}
              </div>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
              <div>
                <div className="mb-8">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">Overview</h2>
                  <p className="mt-3 leading-8 text-slate-600 dark:text-slate-400">{project.description}</p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">Problem</h2>
                  <p className="mt-3 leading-8 text-slate-600 dark:text-slate-400">{project.problem}</p>
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">Solution</h2>
                  <p className="mt-3 leading-8 text-slate-600 dark:text-slate-400">{project.solution}</p>
                </div>
              </div>

              <aside className="space-y-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Technologies</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Key Features</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {project.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProjectDetails;
