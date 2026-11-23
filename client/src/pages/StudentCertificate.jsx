import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Award, Printer, ShieldCheck } from "lucide-react";
import ThemeSelector from "../components/ThemeSelector";
import { useStudentAuth } from "../context/studentAuthContextValue";
import api from "../services/api";

function StudentCertificate() {
  const { courseId } = useParams();
  const { user, isLoading: isAuthLoading } = useStudentAuth();
  const studentId = user?._id;
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId || isAuthLoading) return undefined;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.post(
          `/students/courses/${courseId}/certificate`,
          {},
          { authTokenKey: "amade_student_token" },
        );
        if (active) setCertificate(response.data.data);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Certificate could not be issued.");
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [courseId, isAuthLoading, studentId]);

  if (isAuthLoading) return <div className="grid min-h-screen place-items-center">Restoring secure session...</div>;
  if (!user) return <Navigate to="/student/login" replace />;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body { background: white !important; }
          body * { visibility: hidden; }
          #amade-certificate, #amade-certificate * { visibility: visible; }
          #amade-certificate { position: fixed; inset: 3%; width: 94%; height: 94%; box-shadow: none !important; }
          .certificate-no-print { display: none !important; }
        }
      `}</style>
      <header className="certificate-no-print mx-auto mb-6 flex max-w-5xl items-center justify-between gap-4">
        <Link to="/student/courses" className="text-sm font-bold text-green-700 underline dark:text-green-400">Back to My Courses</Link>
        <ThemeSelector />
      </header>

      {error ? (
        <section role="alert" className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-slate-900">
          <h1 className="text-2xl font-black">Certificate unavailable</h1>
          <p className="mt-3 text-red-700 dark:text-red-300">{error}</p>
          <Link to="/student/courses" className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">Return to My Courses</Link>
        </section>
      ) : !certificate ? (
        <p role="status" className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center dark:bg-slate-900">Verifying course completion and preparing your certificate...</p>
      ) : (
        <>
          <section id="amade-certificate" className="mx-auto grid min-h-[34rem] max-w-5xl place-items-center border-[10px] border-double border-green-700 bg-white p-8 text-center shadow-xl dark:bg-white sm:p-14">
            <div className="w-full border border-green-200 p-6 text-slate-900 sm:p-12">
              <ShieldCheck aria-hidden="true" size={38} className="mx-auto text-green-700" />
              <p className="mt-4 text-sm font-black uppercase tracking-[0.3em] text-green-800">AMADE Software Solutions</p>
              <h1 className="mt-6 font-serif text-4xl font-black sm:text-6xl">Certificate of Completion</h1>
              <p className="mt-7 text-lg text-slate-600">This certificate is awarded to</p>
              <p className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">{certificate.studentName}</p>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">for successfully completing all published lessons and passing the required quizzes in</p>
              <p className="mt-3 text-2xl font-extrabold text-green-800 sm:text-3xl">{certificate.courseTitle}</p>
              <div className="mt-9 flex flex-col items-center justify-center gap-6 text-sm sm:flex-row sm:justify-between">
                <div><p className="font-bold">{new Date(certificate.issuedAt).toLocaleDateString()}</p><p className="mt-1 text-slate-500">Date issued</p></div>
                <Award aria-hidden="true" size={52} className="text-green-700" />
                <div><p className="font-bold">{certificate.certificateNumber}</p><p className="mt-1 text-slate-500">Certificate ID</p></div>
              </div>
            </div>
          </section>
          <div className="certificate-no-print mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <Link to={`/certificate/verify/${certificate.certificateNumber}`} className="text-sm font-semibold text-green-700 underline dark:text-green-400">Verify certificate</Link>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">
              <Printer aria-hidden="true" size={16} /> Print or save as PDF
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default StudentCertificate;
