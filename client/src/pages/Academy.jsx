import AcademySection from "../components/sections/AcademySection";

function Academy() {
  return (
    <>
      <div className="bg-slate-950 px-4 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-[0.18em] text-green-400">
            AMADE Academy
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
            Learn. Practice. Build. Grow.
          </h1>
        </div>
      </div>

      <AcademySection />
    </>
  );
}

export default Academy;