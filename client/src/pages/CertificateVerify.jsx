import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShieldCheck, ShieldX } from "lucide-react";
import api from "../services/api";

function CertificateVerify() {
  const { certificateNumber } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get(`/certificates/verify/${encodeURIComponent(certificateNumber)}`);
        if (active) setResult({ certificate: response.data.data, error: "" });
      } catch (requestError) {
        if (active) {
          setResult({
            certificate: null,
            error: requestError.response?.data?.message || "Certificate verification could not be completed.",
          });
        }
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [certificateNumber]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
        {!result ? (
          <p role="status">Checking certificate record...</p>
        ) : result.certificate ? (
          <>
            <ShieldCheck aria-hidden="true" size={48} className="mx-auto text-green-600" />
            <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-green-700 dark:text-green-400">Verified</p>
            <h1 className="mt-2 text-3xl font-black">Certificate is valid</h1>
            <p className="mt-5 text-lg font-bold">{result.certificate.studentName}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{result.certificate.courseTitle}</p>
            <p className="mt-4 text-sm text-slate-500">Issued {new Date(result.certificate.issuedAt).toLocaleDateString()}</p>
            <p className="mt-2 break-all text-xs text-slate-500">{result.certificate.certificateNumber}</p>
          </>
        ) : (
          <>
            <ShieldX aria-hidden="true" size={48} className="mx-auto text-red-600" />
            <h1 className="mt-4 text-2xl font-black">Certificate not verified</h1>
            <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{result.error}</p>
          </>
        )}
        <Link to="/academy" className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">AMADE Academy</Link>
      </section>
    </main>
  );
}

export default CertificateVerify;
