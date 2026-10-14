import { ArrowUpRight, BriefcaseBusiness, Globe, Send, Code2 } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500 font-black text-slate-950">
                A
              </div>

              <div>
                <h2 className="text-xl font-black">AMADE</h2>
                <p className="text-xs text-slate-400">Software Solutions</p>
              </div>
            </div>

            <p className="mt-6 max-w-md leading-7 text-slate-400">
              AMADE Software Solutions builds modern digital products, supports practical
              technology learning, and helps people and businesses turn ideas into real solutions.
            </p>

            <p className="mt-5 font-semibold text-green-400">Build. Learn. Innovate. Grow.</p>
          </div>

          <div>
            <h3 className="font-bold text-white">Quick Links</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
              <Link to="/about" className="transition hover:text-green-400">
                About
              </Link>
              <Link to="/services" className="transition hover:text-green-400">
                Services
              </Link>
              <Link to="/academy" className="transition hover:text-green-400">
                Academy
              </Link>
              <Link to="/projects" className="transition hover:text-green-400">
                Projects
              </Link>
              <Link to="/blog" className="transition hover:text-green-400">
                Blog
              </Link>
              <Link to="/contact" className="transition hover:text-green-400">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white">Academy</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
              <span>MERN Full-Stack</span>
              <span>Computer Skills</span>
              <span>Entrepreneurship</span>
              <Link to="/academy" className="inline-flex items-center gap-1 text-green-400">
                Explore Academy
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white">Connect</h3>
            <p className="mt-5 text-sm leading-6 text-slate-400">
              Follow AMADE for digital knowledge, practical learning, and entrepreneurship support.
            </p>

            <div className="mt-5 flex gap-3">
              <a href="https://www.linkedin.com/in/lencho-ahmed-4a850136b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" aria-label="LinkedIn" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-800 p-3 transition hover:border-green-500 hover:text-green-400">
                <BriefcaseBusiness size={18} />
              </a>
              <a href="https://www.facebook.com/d.leencoo" aria-label="Facebook" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-800 p-3 transition hover:border-green-500 hover:text-green-400">
                <Globe size={18} />
              </a>
              <a href="t.me/lench34" aria-label="Telegram" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-800 p-3 transition hover:border-green-500 hover:text-green-400">
                <Send size={18} />
              </a>
              <a href="https://github.com/mandeveloper582-oss" aria-label="GitHub" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-800 p-3 transition hover:border-green-500 hover:text-green-400">
                <Code2 size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} AMADE Software Solutions. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;