import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, BriefcaseBusiness, CheckCircle2, Code2 } from "lucide-react";
import Button from "../Button";
import SectionTitle from "../SectionTitle";
import { courses } from "../../data/courses";
import api from "../../services/api";

const courseIcons = [Code2, BookOpen, BriefcaseBusiness];

function AcademySection() {
  const [databaseCourses, setDatabaseCourses] = useState([]);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/courses", { params: { limit: 100 } })
      .then(({ data }) => {
        if (active) setDatabaseCourses(data.data?.data || []);
      })
      .catch(() => {
        if (active) setCatalogError("The live course catalog is unavailable. Showing the existing Academy information.");
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleCourses = [
    ...courses.map((course) => ({ ...course, isDatabaseCourse: false })),
    ...databaseCourses.map((course) => ({ ...course, isDatabaseCourse: true })),
  ];

  return (
    <section className="bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="AMADE Academy"
          title="Learn. Practice. Build. Grow."
          description="Practical learning designed to help students and aspiring professionals develop useful skills in technology and entrepreneurship."
        />

        {catalogError && <p role="status" className="mt-8 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{catalogError}</p>}

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.map((course, index) => {
            const Icon = courseIcons[index % courseIcons.length];
            const isPublished = course.status === "published" && course.isPublished;
            const courseId = course._id || course.id;

            return (
              <motion.article
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur transition-all duration-300"
              >
                {course.thumbnail && <img src={course.thumbnail} alt="" className="mb-6 h-40 w-full rounded-2xl object-cover" />}
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-slate-950">
                    <Icon size={23} />
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${isPublished ? "bg-green-500 text-slate-950" : "bg-amber-400/10 text-amber-300"}`}>
                    {isPublished ? "Published" : "Coming Soon"}
                  </span>
                </div>

                <h3 className="mt-7 text-xl font-bold text-white">{course.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{course.description}</p>

                <div className="mt-6 flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-green-400" />
                  {course.category}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    <span className="block">{course.duration}</span>
                    {course.price > 0 && <span className="mt-1 block normal-case">${course.price}</span>}
                    {course.instructor?.name && <span className="mt-1 block normal-case">Instructor: {course.instructor.name}</span>}
                  </div>
                  {isPublished ? (
                    <Button to={`/academy/${courseId}`} variant="primary" icon={false} className="px-4 py-2.5 text-xs">
                      View Course
                    </Button>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">Coming Soon</span>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-10">
          <Button to="/academy">Explore Academy</Button>
        </div>
      </div>
    </section>
  );
}

export default AcademySection;