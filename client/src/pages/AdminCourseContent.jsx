import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, LogOut, Plus, Save, Trash2 } from "lucide-react";
import { useAdminAuth } from "../context/adminAuthContextValue";
import api from "../services/api";

const emptyModule = { title: "", description: "", isPublished: false };
const emptyLesson = {
  title: "",
  description: "",
  module: "",
  englishContent: "",
  oromoSummary: "",
  codeExamples: "",
  exercises: "",
  pdfName: "",
  pdfPath: "",
  pdfStorageId: "",
  pdfMimeType: "application/pdf",
  pdfSize: 0,
  order: 1,
  isPublished: false,
};
const emptyQuizQuestion = () => ({ prompt: "", options: ["", "", "", ""], correctOptionIndex: 0 });
const emptyQuizForm = (lessonId) => ({
  lessonId,
  title: "Lesson quiz",
  instructions: "",
  passScore: 80,
  questions: Array.from({ length: 5 }, emptyQuizQuestion),
});

function AdminCourseContent() {
  const { courseId } = useParams();
  const { user, isLoading: isAuthLoading, logout } = useAdminAuth();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [projectSubmissions, setProjectSubmissions] = useState([]);
  const [projectForm, setProjectForm] = useState({ title: "", instructions: "", requirements: "" });
  const [reviewNotes, setReviewNotes] = useState({});
  const [moduleForm, setModuleForm] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);
  const [quizForm, setQuizForm] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  const loadContent = useCallback(async (signal) => {
    try {
      const options = { signal, authTokenKey: "amade_admin_token" };
      const [courseResponse, moduleResponse, lessonResponse, submissionResponse] = await Promise.all([
        api.get(`/courses/admin/${courseId}`, options),
        api.get(`/modules/course/${courseId}`, options),
        api.get(`/courses/${courseId}/lessons`, options),
        api.get(`/final-projects/admin/courses/${courseId}/submissions`, options),
      ]);
      const loadedCourse = courseResponse.data.data;
      setCourse(loadedCourse);
      setProjectForm({
        title: loadedCourse.finalProject?.title || "",
        instructions: loadedCourse.finalProject?.instructions || "",
        requirements: (loadedCourse.finalProject?.requirements || []).join("\n"),
      });
      setModules(moduleResponse.data.data || []);
      setLessons(lessonResponse.data.data || []);
      setProjectSubmissions(submissionResponse.data.data || []);
      setError("");
    } catch (requestError) {
      if (requestError.name !== "CanceledError") {
        setError(requestError.response?.data?.message || "Course content could not be loaded.");
      }
    }
  }, [courseId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadContent(controller.signal), 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadContent, reload]);

  const refresh = () => setReload((value) => value + 1);
  const saveFinalProject = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.put(`/courses/admin/${courseId}/final-project`, {
        title: projectForm.title,
        instructions: projectForm.instructions,
        requirements: projectForm.requirements.split("\n").map((requirement) => requirement.trim()).filter(Boolean),
      }, { authTokenKey: "amade_admin_token" });
      setNotice("Final project assignment saved.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Final project assignment could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const reviewProject = async (submission, status) => {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/final-projects/admin/submissions/${submission._id}`, {
        status,
        feedback: reviewNotes[submission._id] ?? submission.feedback ?? "",
      }, { authTokenKey: "amade_admin_token" });
      setNotice(status === "accepted" ? "Project accepted." : "Revision requested.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Project review could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  const saveModule = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingModule) {
        await api.put(`/modules/${editingModule._id}`, moduleForm, { authTokenKey: "amade_admin_token" });
      } else {
        await api.post(`/modules/course/${courseId}`, moduleForm, { authTokenKey: "amade_admin_token" });
      }
      setModuleForm(null);
      setEditingModule(null);
      setNotice("Module saved.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Module could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...lessonForm,
      module: lessonForm.module || null,
      order: Number(lessonForm.order),
    };
    try {
      if (editingLesson) {
        await api.put(`/lessons/${editingLesson._id}`, payload, { authTokenKey: "amade_admin_token" });
      } else {
        await api.post(`/courses/${courseId}/lessons`, payload, { authTokenKey: "amade_admin_token" });
      }
      setLessonForm(null);
      setEditingLesson(null);
      setNotice("Lesson saved as a draft or published according to its status.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Lesson could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const openQuizEditor = async (lesson) => {
    setError("");
    try {
      const { data } = await api.get(`/quizzes/${lesson._id}`, { authTokenKey: "amade_admin_token" });
      const quiz = data.data;
      setQuizForm(quiz ? {
        lessonId: lesson._id,
        title: quiz.title || "Lesson quiz",
        instructions: quiz.instructions || "",
        passScore: quiz.passScore ?? 80,
        questions: quiz.questions.map((question) => ({
          prompt: question.prompt,
          options: question.options,
          correctOptionIndex: question.correctOptionIndex,
        })),
      } : emptyQuizForm(lesson._id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Quiz could not be loaded.");
    }
  };

  const saveQuiz = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post(`/quizzes/${quizForm.lessonId}`, {
        ...quizForm,
        passScore: Number(quizForm.passScore),
      }, { authTokenKey: "amade_admin_token" });
      setQuizForm(null);
      setNotice("Five-question quiz saved.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Quiz could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const updateQuizQuestion = (questionIndex, field, value, optionIndex) => {
    setQuizForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex) return question;
        if (field === "option") {
          return {
            ...question,
            options: question.options.map((option, itemIndex) => itemIndex === optionIndex ? value : option),
          };
        }
        return { ...question, [field]: value };
      }),
    }));
  };

  const editLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      ...emptyLesson,
      ...lesson,
      module: lesson.module?._id || lesson.module || "",
      englishContent: lesson.englishContent || lesson.content || "",
      order: lesson.order || 1,
    });
    setError("");
  };

  const uploadPdf = async (file) => {
    if (!file) return;
    setUploadingPdf(true);
    setError("");
    try {
      const body = new FormData();
      body.append("pdf", file);
      const { data } = await api.post("/uploads/pdf", body, {
        headers: { "Content-Type": "multipart/form-data" },
        authTokenKey: "amade_admin_token",
      });
      setLessonForm((current) => ({
        ...current,
        pdfName: data.data.fileName,
        pdfPath: data.data.url,
        pdfStorageId: data.data.assetId,
        pdfMimeType: "application/pdf",
        pdfSize: data.data.fileSize,
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "PDF upload failed.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const deleteLesson = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}"? This removes the lesson from the course.`)) return;
    setError("");
    try {
      await api.delete(`/lessons/${lesson._id}`, { authTokenKey: "amade_admin_token" });
      setNotice("Lesson deleted.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Lesson could not be deleted.");
    }
  };

  const deleteModule = async (module) => {
    if (!window.confirm(`Delete module "${module.title}"? Modules with lessons cannot be deleted.`)) return;
    setError("");
    try {
      await api.delete(`/modules/${module._id}`, { authTokenKey: "amade_admin_token" });
      setNotice("Module deleted.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Module could not be deleted.");
    }
  };

  const moveLesson = async (lesson, direction) => {
    const ordered = [...lessons].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((item) => item._id === lesson._id);
    const neighbor = ordered[index + direction];
    if (!neighbor) return;
    try {
      await Promise.all([
        api.put(`/lessons/${lesson._id}`, { order: neighbor.order }, { authTokenKey: "amade_admin_token" }),
        api.put(`/lessons/${neighbor._id}`, { order: lesson.order }, { authTokenKey: "amade_admin_token" }),
      ]);
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Lesson order could not be updated.");
    }
  };

  const moveModule = async (module, direction) => {
    const index = modules.findIndex((item) => item._id === module._id);
    const neighbor = modules[index + direction];
    if (!neighbor) return;
    try {
      await Promise.all([
        api.put(`/modules/${module._id}`, { order: neighbor.order }, { authTokenKey: "amade_admin_token" }),
        api.put(`/modules/${neighbor._id}`, { order: module.order }, { authTokenKey: "amade_admin_token" }),
      ]);
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Module order could not be updated.");
    }
  };

  if (isAuthLoading) return <div className="grid min-h-screen place-items-center">Restoring secure session...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal dark:border-slate-700 dark:bg-slate-950";
  const lessonsByModule = new Map();
  lessons.forEach((lesson) => {
    const key = String(lesson.module?._id || lesson.module || "");
    lessonsByModule.set(key, [...(lessonsByModule.get(key) || []), lesson]);
  });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/admin/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300"><ArrowLeft size={16} /> Back to courses</Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">AMADE Academy authoring</p>
            <h1 className="mt-1 text-3xl font-black">{course?.title || "Course content"}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Organize modules and author the English lesson with a separate Afaan Oromoo summary.</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950"><LogOut size={16} /> Sign out</button>
        </header>

        {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
        {notice && <p role="status" className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-200">{notice}</p>}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-xl font-extrabold">Final project assignment</h2>
          <p className="mt-1 text-sm text-slate-500">The final project is optional for certificate eligibility. Students can submit a written summary with a repository or demo link.</p>
          <form onSubmit={saveFinalProject} className="mt-4 grid gap-3">
            <label className="text-sm font-semibold">Assignment title<input maxLength={160} className={inputClass} value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} /></label>
            <label className="text-sm font-semibold">Instructions<textarea rows={3} maxLength={5000} className={inputClass} value={projectForm.instructions} onChange={(event) => setProjectForm({ ...projectForm, instructions: event.target.value })} /></label>
            <label className="text-sm font-semibold">Requirements (one per line)<textarea rows={4} maxLength={10000} className={inputClass} value={projectForm.requirements} onChange={(event) => setProjectForm({ ...projectForm, requirements: event.target.value })} /></label>
            <div><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60"><Save size={15} /> Save assignment</button></div>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-extrabold">Modules</h2><p className="mt-1 text-sm text-slate-500">Modules group lessons; deleting a module with lessons is prevented.</p></div>
            <button onClick={() => { setEditingModule(null); setModuleForm(emptyModule); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white dark:bg-green-500 dark:text-slate-950"><Plus size={16} /> Add module</button>
          </div>
          {moduleForm && (
            <form onSubmit={saveModule} className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950 sm:grid-cols-2">
              <label className="text-sm font-semibold">Module title<input required maxLength={160} className={inputClass} value={moduleForm.title} onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value })} /></label>
              <label className="text-sm font-semibold">Description<input maxLength={2000} className={inputClass} value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={moduleForm.isPublished} onChange={(event) => setModuleForm({ ...moduleForm, isPublished: event.target.checked })} /> Published module</label>
              <div className="flex gap-2 sm:justify-end"><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-slate-950"><Save size={15} /> Save module</button><button type="button" onClick={() => setModuleForm(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
            </form>
          )}
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {[...modules].sort((a, b) => a.order - b.order).map((module, index, orderedModules) => (
              <article key={module._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div><p className="font-bold">{index + 1}. {module.title}</p><p className="text-xs text-slate-500">{module.isPublished ? "Published" : "Draft"} · {(lessonsByModule.get(module._id) || []).length} lessons</p></div>
                <div className="flex gap-2"><button onClick={() => moveModule(module, -1)} disabled={index === 0} aria-label={`Move ${module.title} up`} className="rounded-lg border p-2 disabled:opacity-40"><ChevronUp size={15} /></button><button onClick={() => moveModule(module, 1)} disabled={index === orderedModules.length - 1} aria-label={`Move ${module.title} down`} className="rounded-lg border p-2 disabled:opacity-40"><ChevronDown size={15} /></button><button onClick={() => { setEditingModule(module); setModuleForm({ title: module.title, description: module.description || "", isPublished: module.isPublished }); }} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Edit</button><button onClick={() => deleteModule(module)} aria-label={`Delete ${module.title}`} className="rounded-lg border border-red-200 p-2 text-red-700 dark:border-red-900 dark:text-red-300"><Trash2 size={16} /></button></div>
              </article>
            ))}
            {!modules.length && <p className="py-6 text-sm text-slate-500">No modules yet. Existing lessons remain available in the legacy uncategorized section.</p>}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-extrabold">Lessons</h2><p className="mt-1 text-sm text-slate-500">Plain-text fields are rendered as text, not executable HTML.</p></div>
            <button onClick={() => { setEditingLesson(null); setLessonForm({ ...emptyLesson, order: lessons.length + 1 }); }} disabled={!course} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-green-500 dark:text-slate-950"><Plus size={16} /> Add lesson</button>
          </div>

          {lessonForm && (
            <form onSubmit={saveLesson} className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950 sm:grid-cols-2">
              <label className="text-sm font-semibold">Lesson title<input required maxLength={180} className={inputClass} value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} /></label>
              <label className="text-sm font-semibold">Module<select className={inputClass} value={lessonForm.module || ""} onChange={(event) => setLessonForm({ ...lessonForm, module: event.target.value })}><option value="">Uncategorized / legacy</option>{modules.map((module) => <option key={module._id} value={module._id}>{module.title}</option>)}</select></label>
              <label className="text-sm font-semibold sm:col-span-2">Short description<textarea rows={2} className={inputClass} value={lessonForm.description} onChange={(event) => setLessonForm({ ...lessonForm, description: event.target.value })} /></label>
              <label className="text-sm font-semibold sm:col-span-2">English main lesson (80%)<textarea rows={9} className={inputClass} value={lessonForm.englishContent} onChange={(event) => setLessonForm({ ...lessonForm, englishContent: event.target.value })} placeholder="Introduction, objectives, explanation, steps, and summary..." /></label>
              <label className="text-sm font-semibold sm:col-span-2">Cuunfaa Barnootaa — Afaan Oromoo (20%)<textarea rows={5} className={inputClass} value={lessonForm.oromoSummary} onChange={(event) => setLessonForm({ ...lessonForm, oromoSummary: event.target.value })} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Code examples<textarea rows={5} className={`${inputClass} font-mono`} value={lessonForm.codeExamples} onChange={(event) => setLessonForm({ ...lessonForm, codeExamples: event.target.value })} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Practical exercises<textarea rows={4} className={inputClass} value={lessonForm.exercises} onChange={(event) => setLessonForm({ ...lessonForm, exercises: event.target.value })} /></label>
              <label className="text-sm font-semibold">Position<input type="number" min="1" step="1" required className={inputClass} value={lessonForm.order} onChange={(event) => setLessonForm({ ...lessonForm, order: event.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={lessonForm.isPublished} onChange={(event) => setLessonForm({ ...lessonForm, isPublished: event.target.checked })} /> Publish lesson</label>
              <label className="text-sm font-semibold sm:col-span-2">PDF learning material (PDF, max 20 MB)
                <input type="file" accept="application/pdf,.pdf" disabled={uploadingPdf} onChange={(event) => uploadPdf(event.target.files?.[0])} className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-green-100 file:px-3 file:py-1.5 file:font-semibold dark:file:bg-green-950 dark:file:text-green-200`} />
                {lessonForm.pdfName && <span className="mt-1 block text-xs text-slate-500">{lessonForm.pdfName} · {(lessonForm.pdfSize / 1024 / 1024).toFixed(1)} MB</span>}
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={busy || uploadingPdf} className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-slate-950"><Save size={15} /> {busy ? "Saving..." : "Save lesson"}</button><button type="button" onClick={() => { setLessonForm(null); setEditingLesson(null); }} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
            </form>
          )}

          <div className="mt-5 space-y-3">
            {[...lessons].sort((a, b) => a.order - b.order).map((lesson, index) => (
              <article key={lesson._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex min-w-0 items-center gap-3"><BookOpen size={18} className="shrink-0 text-green-600" /><div className="min-w-0"><p className="truncate font-bold">{lesson.order}. {lesson.title}</p><p className="text-xs text-slate-500">{lesson.isPublished ? "Published" : "Draft"} · {modules.find((module) => module._id === (lesson.module?._id || lesson.module))?.title || "Uncategorized"}</p></div></div>
                <div className="flex items-center gap-1"><button onClick={() => moveLesson(lesson, -1)} disabled={index === 0} aria-label={`Move ${lesson.title} up`} className="rounded-lg border p-2 disabled:opacity-40"><ChevronUp size={15} /></button><button onClick={() => moveLesson(lesson, 1)} disabled={index === lessons.length - 1} aria-label={`Move ${lesson.title} down`} className="rounded-lg border p-2 disabled:opacity-40"><ChevronDown size={15} /></button><button onClick={() => openQuizEditor(lesson)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Quiz</button><button onClick={() => editLesson(lesson)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Edit</button><button onClick={() => deleteLesson(lesson)} aria-label={`Delete ${lesson.title}`} className="rounded-lg border border-red-200 p-2 text-red-700 dark:border-red-900 dark:text-red-300"><Trash2 size={15} /></button></div>
              </article>
            ))}
            {!lessons.length && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No lessons have been created for this course.</p>}
          </div>
          {quizForm && (
            <form onSubmit={saveQuiz} className="mt-6 space-y-5 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-extrabold">Quiz authoring · 5 questions · 4 options each</h3><button type="button" onClick={() => setQuizForm(null)} className="rounded-lg border px-3 py-1.5 text-sm">Close</button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">Quiz title<input required className={inputClass} value={quizForm.title} onChange={(event) => setQuizForm({ ...quizForm, title: event.target.value })} /></label>
                <label className="text-sm font-semibold">Passing score (%)<input type="number" min="0" max="100" required className={inputClass} value={quizForm.passScore} onChange={(event) => setQuizForm({ ...quizForm, passScore: event.target.value })} /></label>
                <label className="text-sm font-semibold sm:col-span-2">Instructions<textarea rows={2} className={inputClass} value={quizForm.instructions} onChange={(event) => setQuizForm({ ...quizForm, instructions: event.target.value })} /></label>
              </div>
              {quizForm.questions.map((question, questionIndex) => (
                <fieldset key={`question-${questionIndex}`} className="grid gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
                  <legend className="px-1 text-sm font-bold">Question {questionIndex + 1}</legend>
                  <label className="text-sm font-semibold">Prompt<input required className={inputClass} value={question.prompt} onChange={(event) => updateQuizQuestion(questionIndex, "prompt", event.target.value)} /></label>
                  <p className="text-xs text-slate-500">Select the correct answer.</p>
                  <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => (
                    <label key={`option-${questionIndex}-${optionIndex}`} className="flex items-center gap-2 text-sm"><input type="radio" name={`correct-${questionIndex}`} checked={Number(question.correctOptionIndex) === optionIndex} onChange={() => updateQuizQuestion(questionIndex, "correctOptionIndex", optionIndex)} className="accent-green-600" /><input required aria-label={`Question ${questionIndex + 1} answer option ${optionIndex + 1}`} className={inputClass} value={option} onChange={(event) => updateQuizQuestion(questionIndex, "option", event.target.value, optionIndex)} /></label>
                  ))}</div>
                </fieldset>
              ))}
              <button disabled={busy} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving quiz..." : "Save quiz"}</button>
            </form>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-xl font-extrabold">Student final project submissions</h2>
          <p className="mt-1 text-sm text-slate-500">Review each project, leave feedback, and accept it or request changes. Certificate eligibility is based on course completion, not project review.</p>
          <div className="mt-4 space-y-4">
            {projectSubmissions.map((submission) => (
              <article key={submission._id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-bold">{submission.student?.name || "Student"}</h3><p className="text-xs text-slate-500">{submission.student?.email || ""} · Submitted {new Date(submission.submittedAt).toLocaleString()}</p></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase dark:bg-slate-800">{submission.status.replace("_", " ")}</span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{submission.summary}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  {submission.repositoryUrl && <a href={submission.repositoryUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline dark:text-blue-300">Repository</a>}
                  {submission.demoUrl && <a href={submission.demoUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline dark:text-blue-300">Live demo</a>}
                </div>
                <label className="mt-4 block text-sm font-semibold">Review feedback<textarea rows={3} maxLength={2000} className={inputClass} value={reviewNotes[submission._id] ?? submission.feedback ?? ""} onChange={(event) => setReviewNotes({ ...reviewNotes, [submission._id]: event.target.value })} /></label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => reviewProject(submission, "accepted")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Accept project</button>
                  <button type="button" disabled={busy} onClick={() => reviewProject(submission, "changes_requested")} className="rounded-lg border border-amber-500 px-4 py-2 text-sm font-bold text-amber-800 disabled:opacity-60 dark:text-amber-300">Request changes</button>
                </div>
              </article>
            ))}
            {!projectSubmissions.length && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No project submissions for this course yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminCourseContent;
