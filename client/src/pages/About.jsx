import AboutSection from "../components/sections/AboutSection";

function About() {
  return (
    <>
      <div className="bg-slate-950 px-4 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-[0.18em] text-green-400">
            About AMADE
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
            Technology with purpose.
          </h1>
        </div>
      </div>

      <AboutSection />
    </>
  );
}

export default About;