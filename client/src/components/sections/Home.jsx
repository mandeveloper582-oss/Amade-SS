import Hero from "../sections/Hero";
import ServicesSection from "../sections/ServicesSection";
import AboutSection from "../sections/AboutSection";
import AcademySection from "../sections/AcademySection";
import ProjectsSection from "../sections/ProjectsSection";
import BlogSection from "../sections/BlogSection";
import ContactSection from "../sections/ContactSection";
import SectionTitle from "../components/SectionTitle";

function Home() {
  return (
    <>
      <Hero />

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Build • Learn • Grow"
            title="Technology that creates opportunity."
            description="AMADE connects software development, practical learning and entrepreneurship to help people and businesses move forward."
            centered
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Build",
                text: "Turn ideas and real-world problems into useful digital solutions.",
              },
              {
                number: "02",
                title: "Learn",
                text: "Develop practical technology, computer and entrepreneurship skills.",
              },
              {
                number: "03",
                title: "Grow",
                text: "Use technology and knowledge to create opportunities and grow.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="text-sm font-black text-green-500">
                  {item.number}
                </span>

                <h3 className="mt-5 text-2xl font-black">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServicesSection />
      <AboutSection />
      <AcademySection />
      <ProjectsSection />
      <BlogSection />
      <ContactSection />
    </>
  );
}

export default Home;