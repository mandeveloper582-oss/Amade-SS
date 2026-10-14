import { useEffect, useState } from "react";
import { Mail, Search, Trash2, X } from "lucide-react";
import AdminContentLayout from "../components/admin/AdminContentLayout";
import api from "../services/api";

function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/messages", {
        params: { page, limit: 10, search, status },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setMessages(data.data.data || []);
        setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "CanceledError") {
          setError(requestError.response?.data?.message || "Messages could not be loaded.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [page, search, status, refreshKey]);

  const openMessage = async (message) => {
    setSelected(message);
    setIsLoadingDetail(true);
    setError("");
    try {
      const { data } = await api.get(`/messages/${message._id}`);
      setSelected(data.data);
    } catch (requestError) {
      setSelected(null);
      setError(requestError.response?.data?.message || "Message details could not be loaded.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const updateStatus = async (message, nextStatus) => {
    setError("");
    setNotice("");
    try {
      const { data } = await api.put(`/messages/${message._id}`, { status: nextStatus });
      setSelected(data.data);
      setNotice(`Message marked ${nextStatus === "new" ? "unread" : nextStatus}.`);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Message status could not be updated.");
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm(`Delete the message from ${message.fullName}? This action cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`/messages/${message._id}`);
      setSelected(null);
      setNotice("Message deleted.");
      if (messages.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Message could not be deleted.");
    }
  };

  const dateTime = (value) => value ? new Date(value).toLocaleString() : "—";

  return (
    <AdminContentLayout>
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">Contact inbox</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Messages</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Review incoming messages and manage their read status.</p>
      </header>

      {notice && <p role="status" className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-200">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

      <section className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search aria-hidden="true" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchInput} onChange={(event) => { setSearchInput(event.target.value); setPage(1); }} maxLength={100} placeholder="Search sender, email, or subject..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <select aria-label="Filter messages" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="all">All messages</option><option value="unread">Unread</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option>
        </select>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <p className="p-10 text-center text-sm text-slate-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="p-10 text-center"><Mail aria-hidden="true" size={30} className="mx-auto text-slate-400" /><h2 className="mt-3 font-bold">No messages found</h2><p className="mt-1 text-sm text-slate-500">New contact requests will appear here.</p></div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {messages.map((message) => (
              <article key={message._id} className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${message.status === "new" ? "bg-green-50/60 dark:bg-green-950/10" : ""}`}>
                <button type="button" onClick={() => openMessage(message)} className="min-w-0 flex-1 text-left">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-bold">{message.fullName}</span><span className="text-xs text-slate-500">{message.email}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${message.status === "new" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{message.status === "new" ? "Unread" : message.status}</span></span>
                  <span className="mt-1 block font-semibold">{message.subject || message.service}</span>
                  <span className="mt-1 block truncate text-sm text-slate-600 dark:text-slate-400">{message.message}</span>
                  <time className="mt-2 block text-xs text-slate-400" dateTime={message.createdAt}>{dateTime(message.createdAt)}</time>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => updateStatus(message, message.status === "new" ? "read" : "new")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700">{message.status === "new" ? "Mark read" : "Mark unread"}</button>
                  <button type="button" aria-label={`Delete message from ${message.fullName}`} onClick={() => deleteMessage(message)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
          <span className="text-slate-500">{pagination.total} messages · Page {page} of {Math.max(1, pagination.pages)}</span>
          <div className="flex gap-2"><button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Previous</button><button type="button" disabled={page >= pagination.pages || isLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Next</button></div>
        </div>
      </section>

      {selected && (
        <div role="presentation" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="message-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <header className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-green-700">Message details</p><h2 id="message-detail-title" className="mt-1 text-2xl font-black">{selected.subject || selected.service}</h2></div>
              <button type="button" aria-label="Close message" onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </header>
            {isLoadingDetail ? <p className="py-10 text-center text-sm text-slate-500">Loading message...</p> : (
              <>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-xs font-bold uppercase text-slate-500">Sender</dt><dd className="mt-1 font-semibold">{selected.fullName}</dd></div>
                  <div><dt className="text-xs font-bold uppercase text-slate-500">Email</dt><dd className="mt-1"><a className="text-blue-700 underline dark:text-blue-400" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || selected.service}`)}`}>{selected.email}</a></dd></div>
                  <div><dt className="text-xs font-bold uppercase text-slate-500">Phone</dt><dd className="mt-1">{selected.phone || "Not provided"}</dd></div>
                  <div><dt className="text-xs font-bold uppercase text-slate-500">Service</dt><dd className="mt-1">{selected.service}</dd></div>
                  <div><dt className="text-xs font-bold uppercase text-slate-500">Received</dt><dd className="mt-1">{dateTime(selected.createdAt)}</dd></div>
                  <div><dt className="text-xs font-bold uppercase text-slate-500">Status</dt><dd className="mt-1 capitalize">{selected.status}</dd></div>
                </dl>
                <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><h3 className="text-xs font-bold uppercase text-slate-500">Message</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{selected.message}</p></div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => updateStatus(selected, selected.status === "new" ? "read" : "new")} className="rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-slate-950">{selected.status === "new" ? "Mark as read" : "Mark as unread"}</button>
                  <button type="button" onClick={() => updateStatus(selected, "replied")} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold dark:border-slate-700">Mark replied</button>
                  <button type="button" onClick={() => updateStatus(selected, "archived")} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold dark:border-slate-700">Archive</button>
                  <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || selected.service}`)}`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold dark:border-slate-700">Reply by email</a>
                  <button type="button" onClick={() => deleteMessage(selected)} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 dark:border-red-900 dark:text-red-300">Delete</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </AdminContentLayout>
  );
}

export default AdminMessages;
