import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Award, LogOut, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../context/adminAuthContextValue";
import api from "../services/api";

function AdminCertificateRequests() {
  const { user, isLoading: isAuthLoading, logout } = useAdminAuth();
  const [status, setStatus] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reasonByRequest, setReasonByRequest] = useState({});
  const [busyId, setBusyId] = useState("");

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/certificates/requests", {
        params: { status },
        authTokenKey: "amade_admin_token",
      });
      setRequests(response.data.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Certificate requests could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(loadRequests, 0);
    return () => window.clearTimeout(timer);
  }, [loadRequests, user]);

  if (isAuthLoading) return <div className="grid min-h-screen place-items-center">Restoring secure session...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const approve = async (requestId) => {
    setBusyId(requestId);
    setError("");
    try {
      await api.patch(`/certificates/requests/${requestId}/approve`, {}, { authTokenKey: "amade_admin_token" });
      await loadRequests();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Certificate could not be approved.");
    } finally {
      setBusyId("");
    }
  };

  const reject = async (requestId) => {
    setBusyId(requestId);
    setError("");
    try {
      await api.patch(
        `/certificates/requests/${requestId}/reject`,
        { rejectionReason: reasonByRequest[requestId] || "" },
        { authTokenKey: "amade_admin_token" },
      );
      await loadRequests();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Certificate could not be rejected.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex dark:bg-slate-950 dark:text-slate-100">
      <aside className="bg-slate-950 p-5 text-white lg:min-h-screen lg:w-64">
        <Link to="/admin" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-green-400 text-slate-950"><ShieldCheck size={22} /></span>
          <span><strong>AMADE</strong><small className="block text-slate-400">Admin workspace</small></span>
        </Link>
        <nav className="mt-6 space-y-2">
          <Link to="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-300"><ArrowLeft size={16} /> Dashboard</Link>
          <Link to="/admin/certificate-requests" aria-current="page" className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 font-semibold"><Award size={16} /> Certificates</Link>
        </nav>
        <button onClick={logout} className="mt-6 flex items-center gap-2 text-sm text-slate-300"><LogOut size={16} /> Sign out</button>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <h1 className="text-3xl font-black">Certificate requests</h1>
        <div className="mt-5 flex gap-2">
          {["pending", "approved", "rejected", "all"].map((item) => (
            <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${status === item ? "bg-slate-950 text-white dark:bg-green-500 dark:text-slate-950" : "border border-slate-300 dark:border-slate-700"}`}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
        {isLoading ? (
          <p className="mt-6">Loading requests...</p>
        ) : requests.length ? (
          <div className="mt-6 space-y-4">
            {requests.map((request) => (
              <article key={request._id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">{request.student?.name || "Student"}</h2>
                    <p className="text-sm text-slate-500">{request.student?.email} · {request.course?.title || "Course"}</p>
                    <p className="mt-1 text-xs text-slate-500">Requested {new Date(request.requestedAt).toLocaleString()} · Status: {request.status}</p>
                  </div>
                  {request.certificate && <p className="text-sm font-bold">{request.certificate.certificateNumber}</p>}
                </div>

                {request.status === "pending" && (
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <textarea
                      rows={2}
                      value={reasonByRequest[request._id] || ""}
                      onChange={(event) => setReasonByRequest((current) => ({ ...current, [request._id]: event.target.value }))}
                      placeholder="Optional rejection reason"
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                    <button type="button" disabled={busyId === request._id} onClick={() => approve(request._id)} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Approve</button>
                    <button type="button" disabled={busyId === request._id} onClick={() => reject(request._id)} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300">Reject</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">No certificate requests in this category.</p>
        )}
      </main>
    </div>
  );
}

export default AdminCertificateRequests;
