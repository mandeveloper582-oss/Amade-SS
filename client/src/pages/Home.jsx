import Hero from "../components/sections/Hero";
import BuildLearnGrow from "../components/sections/BuildLearnGrow";
import ServicesSection from "../components/sections/ServicesSection";
import AboutSection from "../components/sections/AboutSection";
import WhyAmade from "../components/sections/WhyAmade";
import AcademySection from "../components/sections/AcademySection";
import LearningProcess from "../components/sections/LearningProcess";
import ProjectsSection from "../components/sections/ProjectsSection";
import BlogSection from "../components/sections/BlogSection";
import CTASection from "../components/sections/CTASection";
import ContactSection from "../components/sections/ContactSection";

function Home() {
  return (
    <>
      <Hero />
      <BuildLearnGrow />
      <ServicesSection />
      <AboutSection />
      <WhyAmade />
      <AcademySection />
      <LearningProcess />
      <ProjectsSection />
      <BlogSection />
      <CTASection />
      <ContactSection />
    </>
  );
}

export default Home;