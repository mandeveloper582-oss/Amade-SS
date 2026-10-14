import ContactSection from "../components/sections/ContactSection";

function Contact() {
  return (
    <>
      <div className="bg-slate-950 px-4 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-[0.18em] text-green-400">
            Contact AMADE
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
            Have an idea? Let's build it.
          </h1>
        </div>
      </div>

      <ContactSection />
    </>
  );
}

export default Contact;