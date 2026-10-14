import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import SectionTitle from "../SectionTitle";
import { submitContactMessage } from "../../services/api";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  service: "",
  subject: "",
  message: "",
};

const serviceOptions = [
  "Website Development",
  "Custom Software",
  "E-Commerce",
  "Mobile App",
  "School Management",
  "Consultation",
  "Other",
];

function ContactSection() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    if (status.type !== "idle") {
      setStatus({ type: "idle", message: "" });
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.service) {
      nextErrors.service = "Please select a service.";
    }

    if (form.subject.trim().length < 2) {
      nextErrors.subject = "Subject must be at least 2 characters.";
    }

    if (!form.message.trim()) {
      nextErrors.message = "Message is required.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({ type: "error", message: "Please fix the highlighted fields and try again." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await submitContactMessage({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        service: form.service,
        subject: form.subject,
        message: form.message,
      });

      if (!response.success) {
        throw new Error(response.message || "Unable to send message.");
      }

      setForm(initialForm);
      setStatus({
        type: "success",
        message: "Your message was sent successfully. We will follow up soon.",
      });
      setErrors({});
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong while sending your message.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionTitle
            eyebrow="Let&apos;s Work Together"
            title="Have an idea? Let&apos;s build it."
            description="Tell us about your project, business challenge, or digital idea. We will start with a conversation and explore a practical solution."
          />

          <div className="mt-10 space-y-4">
            <div className="flex gap-4 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <Mail className="mt-1 text-green-500" />
              <div>
                <p className="font-bold text-slate-950 dark:text-white">Email</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">lenchoa391@gmail.com</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <Phone className="mt-1 text-green-500" />
              <div>
                <p className="font-bold text-slate-950 dark:text-white">Phone</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">+251 921399695</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <MapPin className="mt-1 text-green-500" />
              <div>
                <p className="font-bold text-slate-950 dark:text-white">Location</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ethiopia</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 dark:border-slate-700 dark:bg-slate-900"
              />
              {errors.fullName && <p className="mt-2 text-sm text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 dark:border-slate-700 dark:bg-slate-900"
              />
              {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+251..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div>
              <label htmlFor="service" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Service
              </label>
              <select
                id="service"
                name="service"
                value={form.service}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select service</option>
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.service && <p className="mt-2 text-sm text-red-500">{errors.service}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                maxLength={180}
                value={form.subject}
                onChange={handleChange}
                placeholder="How can we help?"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 dark:border-slate-700 dark:bg-slate-900"
              />
              {errors.subject && <p className="mt-2 text-sm text-red-500">{errors.subject}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="message" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your project..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-900"
              />
              {errors.message && <p className="mt-2 text-sm text-red-500">{errors.message}</p>}
            </div>
          </div>

          {status.type !== "idle" && (
            <div className={`mt-5 rounded-xl p-4 text-sm font-semibold ${status.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"}`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  );
}

export default ContactSection;