import { useEffect, useMemo, useState } from "react";
import { Eye, ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import AdminContentLayout from "../components/admin/AdminContentLayout";
import api from "../services/api";

const definitions = {
  projects: {
    endpoint: "/projects",
    listTitle: "Projects",
    addLabel: "Add project",
    editLabel: "Edit project",
    statusKey: "isPublished",
    statusOptions: [{ value: "false", label: "Draft" }, { value: "true", label: "Published" }],
    fields: [
      { name: "title", label: "Project title", required: true },
      { name: "slug", label: "Slug" },
      { name: "description", label: "Short description", type: "textarea", required: true },
      { name: "overview", label: "Full overview", type: "textarea" },
      { name: "problem", label: "Problem", type: "textarea" },
      { name: "solution", label: "Solution", type: "textarea" },
      { name: "image", label: "Project image", type: "image" },
      { name: "category", label: "Category" },
      { name: "technologies", label: "Technologies (one per line)", type: "list" },
      { name: "features", label: "Features (one per line)", type: "list" },
      { name: "liveDemo", label: "Live demo URL", type: "url" },
      { name: "github", label: "GitHub repository URL", type: "url" },
      { name: "isFeatured", label: "Featured project", type: "checkbox" },
      { name: "isPublished", label: "Publication status", type: "select", options: [{ value: "false", label: "Draft" }, { value: "true", label: "Published" }] },
    ],
  },
  services: {
    endpoint: "/services",
    listTitle: "Services",
    addLabel: "Add service",
    editLabel: "Edit service",
    statusKey: "isPublished",
    statusOptions: [{ value: "false", label: "Draft" }, { value: "true", label: "Published" }],
    fields: [
      { name: "title", label: "Service title", required: true },
      { name: "slug", label: "Slug" },
      { name: "shortDescription", label: "Short description", type: "textarea" },
      { name: "description", label: "Full description", type: "textarea", required: true },
      { name: "icon", label: "Icon name" },
      { name: "image", label: "Service image", type: "image" },
      { name: "category", label: "Category" },
      { name: "features", label: "Features or benefits (one per line)", type: "list" },
      { name: "startingPrice", label: "Starting price", type: "number" },
      { name: "isFeatured", label: "Featured service", type: "checkbox" },
      { name: "isPublished", label: "Publication status", type: "select", options: [{ value: "false", label: "Draft" }, { value: "true", label: "Published" }] },
    ],
  },
  blog: {
    endpoint: "/blog",
    listTitle: "Blog posts",
    addLabel: "Add post",
    editLabel: "Edit post",
    statusKey: "status",
    statusOptions: [{ value: "all", label: "All statuses" }, { value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }],
    fields: [
      { name: "title", label: "Post title", required: true },
      { name: "slug", label: "Slug" },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "content", label: "Article content", type: "textarea", required: true, wide: true },
      { name: "coverImage", label: "Cover image", type: "image" },
      { name: "author", label: "Author" },
      { name: "category", label: "Category" },
      { name: "tags", label: "Tags (one per line)", type: "list" },
      { name: "seoTitle", label: "SEO title" },
      { name: "seoDescription", label: "SEO description", type: "textarea" },
      { name: "isFeatured", label: "Featured post", type: "checkbox" },
      { name: "status", label: "Publication status", type: "select", options: [{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }] },
    ],
  },
};

const toFormValue = (field, value) => {
  if (field.type === "list") return Array.isArray(value) ? value.join("\n") : "";
  if (field.type === "checkbox") return Boolean(value);
  if (field.name === "isPublished") return String(Boolean(value));
  return value ?? "";
};

const createForm = (definition, record = null) => Object.fromEntries(
  definition.fields.map((field) => [
    field.name,
    record ? toFormValue(field, record[field.name]) : (
      field.name === "isPublished" ? "false"
        : field.name === "status" ? "draft"
          : field.type === "checkbox" ? false : ""
    ),
  ]),
);

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function AdminContentManager({ kind }) {
  const definition = definitions[kind];
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadingField, setUploadingField] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = { page, limit: 10, search };
    if (kind === "blog") {
      if (status !== "all") params.status = status;
    } else if (status !== "all") {
      params.isPublished = status;
    }

    api.get(`${definition.endpoint}/admin`, { params, signal: controller.signal })
      .then(({ data }) => {
        setRows(data.data.data || []);
        setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "CanceledError") {
          setError(requestError.response?.data?.message || `${definition.listTitle} could not be loaded.`);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [definition.endpoint, definition.listTitle, kind, page, search, status, refreshKey]);

  const fields = useMemo(() => definition.fields, [definition.fields]);

  const openCreate = () => {
    setEditing(null);
    setForm(createForm(definition));
    setFormError("");
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm(createForm(definition, row));
    setFormError("");
  };

  const closeForm = () => {
    setForm(null);
    setEditing(null);
    setFormError("");
  };

  const updateField = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "title") {
        const oldTitle = editing?.title || "";
        const oldSlug = editing?.slug || "";
        if (!current.slug || current.slug === slugify(oldTitle) || current.slug === oldSlug) {
          next.slug = slugify(value);
        }
      }
      return next;
    });
  };

  const uploadImage = async (fieldName, file) => {
    if (!file) return;
    setUploadingField(fieldName);
    setFormError("");
    const payload = new FormData();
    payload.append("image", file);
    try {
      const { data } = await api.post("/uploads", payload, { headers: { "Content-Type": "multipart/form-data" } });
      updateField(fieldName, data.data.url);
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || "Image upload failed. Check the image type and size.");
    } finally {
      setUploadingField("");
    }
  };

  const makePayload = () => Object.fromEntries(fields.map((field) => {
    const value = form[field.name];
    if (field.type === "list") return [field.name, value.split(/\r?\n|,/).map((part) => part.trim()).filter(Boolean)];
    if (field.type === "checkbox") return [field.name, Boolean(value)];
    if (field.type === "select" && field.name === "isPublished") return [field.name, value === "true"];
    if (field.type === "number") return [field.name, value === "" ? null : Number(value)];
    return [field.name, value];
  }));

  const submit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError("");
    setNotice("");
    try {
      const payload = makePayload();
      if (kind === "services") payload.isActive = payload.isPublished;
      if (editing) await api.put(`${definition.endpoint}/${editing._id}`, payload);
      else await api.post(definition.endpoint, payload);
      closeForm();
      setNotice(`${definition.listTitle.slice(0, -1)} ${editing ? "updated" : "created"} successfully.`);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || `${definition.listTitle} could not be saved.`);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.title}"? This action cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`${definition.endpoint}/${row._id}`);
      setNotice(`${definition.listTitle.slice(0, -1)} deleted.`);
      if (rows.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "The selected record could not be deleted.");
    }
  };

  const statusValue = (row) => kind === "blog" ? row.status : (row.isPublished ? "published" : "draft");
  const displayDate = (date) => date ? new Date(date).toLocaleDateString() : "—";

  return (
    <AdminContentLayout>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">Content management</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{definition.listTitle}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Manage database content and public publication status.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950">
          <Plus aria-hidden="true" size={17} /> {definition.addLabel}
        </button>
      </header>

      {notice && <p role="status" className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-200">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

      <section aria-label={`${definition.listTitle} filters`} className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search aria-hidden="true" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchInput} onChange={(event) => { setSearchInput(event.target.value); setPage(1); }} maxLength={100} placeholder={`Search ${definition.listTitle.toLowerCase()}...`} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <select aria-label="Filter by publication status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950">
          {definition.statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </section>

      {form && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-xl font-extrabold">{editing ? definition.editLabel : definition.addLabel}</h2><p className="mt-1 text-sm text-slate-500">Created and updated timestamps are managed by the server.</p></div>
            <button type="button" aria-label="Close form" onClick={closeForm} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
          </div>
          {formError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{formError}</p>}
          <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className={`block text-sm font-semibold text-slate-700 dark:text-slate-200 ${field.wide || field.type === "textarea" || field.type === "list" ? "md:col-span-2" : ""}`}>
                {field.type === "checkbox" ? (
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => updateField(field.name, event.target.checked)} className="size-4 accent-green-600" />
                    {field.label}
                  </span>
                ) : (
                  <>
                    {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
                    {field.type === "textarea" || field.type === "list" ? (
                      <textarea required={field.required} rows={field.name === "content" || field.name === "overview" ? 10 : 4} value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                    ) : field.type === "select" ? (
                      <select value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                        {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : field.type === "image" ? (
                      <span className="mt-2 block space-y-2">
                        <input type="url" value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)} placeholder="https://... or upload an image" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                        <span className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
                            <ImagePlus size={15} /> {uploadingField === field.name ? "Uploading..." : "Upload image"}
                            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploadingField)} onChange={(event) => uploadImage(field.name, event.target.files?.[0])} className="sr-only" />
                          </label>
                          <span className="text-xs font-normal text-slate-500">JPG, PNG or WEBP; max 5 MB. Cloudinary or local fallback.</span>
                        </span>
                      </span>
                    ) : (
                      <input required={field.required} type={field.type === "url" ? "url" : field.type === "number" ? "number" : "text"} min={field.type === "number" ? "0" : undefined} value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                    )}
                  </>
                )}
              </label>
            ))}
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" disabled={isSaving || Boolean(uploadingField)} className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">{isSaving ? "Saving..." : editing ? "Save changes" : "Create"}</button>
              <button type="button" onClick={closeForm} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold dark:border-slate-700">Cancel</button>
            </div>
          </form>
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <p className="p-10 text-center text-sm text-slate-500">Loading {definition.listTitle.toLowerCase()}...</p>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center"><h2 className="font-bold">No {definition.listTitle.toLowerCase()} found</h2><p className="mt-2 text-sm text-slate-500">Try changing your search or add a new record.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60">
                <tr><th className="px-4 py-3">Content</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {(row.image || row.coverImage) && <img src={row.image || row.coverImage} alt="" className="size-12 rounded-lg object-cover" />}
                        <div className="min-w-0"><p className="font-bold">{row.title}</p><p className="mt-1 max-w-md truncate text-xs text-slate-500">{row.description || row.excerpt || row.shortDescription || row.slug}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{row.category || "General"}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusValue(row) === "published" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>{statusValue(row)}</span>{row.isFeatured && <span className="ml-2 text-xs font-semibold text-blue-700 dark:text-blue-300">Featured</span>}</td>
                    <td className="px-4 py-4">{displayDate(row.createdAt)}</td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-1">
                      <button type="button" aria-label={`View ${row.title}`} onClick={() => setViewing(row)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye size={16} /></button>
                      <button type="button" aria-label={`Edit ${row.title}`} onClick={() => openEdit(row)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={16} /></button>
                      <button type="button" aria-label={`Delete ${row.title}`} onClick={() => remove(row)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
          <span className="text-slate-500">{pagination.total} records · Page {page} of {Math.max(1, pagination.pages)}</span>
          <div className="flex gap-2"><button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Previous</button><button type="button" disabled={page >= pagination.pages || isLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Next</button></div>
        </div>
      </section>

      {viewing && (
        <div role="presentation" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={(event) => { if (event.target === event.currentTarget) setViewing(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="content-preview-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-green-700">Record details</p><h2 id="content-preview-title" className="mt-1 text-2xl font-black">{viewing.title}</h2></div><button type="button" aria-label="Close preview" onClick={() => setViewing(null)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button></div>
            {(viewing.image || viewing.coverImage) && <img src={viewing.image || viewing.coverImage} alt="" className="mt-5 max-h-64 w-full rounded-xl object-cover" />}
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">{Object.entries(viewing).filter(([key, value]) => !["_id", "__v", "image", "coverImage", "createdAt", "updatedAt"].includes(key) && value !== null && value !== "").map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs font-bold uppercase text-slate-500">{key}</dt><dd className="mt-1 break-words text-sm">{Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>
            <p className="mt-5 text-xs text-slate-500">Created {displayDate(viewing.createdAt)} · Updated {displayDate(viewing.updatedAt)}</p>
          </section>
        </div>
      )}
    </AdminContentLayout>
  );
}

export default AdminContentManager;
