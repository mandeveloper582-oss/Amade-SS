import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock3, Layers3, LockKeyhole, Sparkles } from "lucide-react";
import { courses as publicCourses } from "../data/courses";
import { useStudentAuth } from "../context/studentAuthContextValue";
import api, { resolveMediaUrl } from "../services/api";

function CourseDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useStudentAuth();
  const staticCourse = useMemo(
    () => publicCourses.find((item) => String(item.id) === String(id)),
    [id],
  );
  const isMongoId = /^[\da-f]{24}$/i.test(id || "");
  const [loadedCourse, setLoadedCourse] = useState(null);
  const [enrollmentResult, setEnrollmentResult] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [learningRevision, setLearningRevision] = useState(0);
  const [completingLessonId, setCompletingLessonId] = useState(null);
  const [learningActionError, setLearningActionError] = useState("");
  const handledEnrollment = useRef(null);
  const currentLoad = loadedCourse?.id === id ? loadedCourse : null;
  const course = isMongoId ? currentLoad?.course || null : staticCourse || null;
  const isDatabaseCourse = isMongoId && Boolean(currentLoad?.course);
  const isLoading = isMongoId && !currentLoad;
  const error = currentLoad?.error || "";
  const currentEnrollmentResult = course?._id && enrollmentResult?.courseId === course._id
    ? enrollmentResult
    : { isEnrolling: false, message: "", error: "" };
  const currentLearning = learningData?.courseId === course?._id
    && learningData?.studentId === user?._id
    && learningData?.revision === learningRevision
    ? learningData
    : null;
  const isLearningLoading = Boolean(isDatabaseCourse && user && !currentLearning);

  useEffect(() => {
    let active = true;

    if (isMongoId) {
      api.get(`/courses/${id}`)
        .then(({ data }) => {
          if (active) {
            setLoadedCourse({ id, course: data.data, error: "" });
          }
        })
        .catch((requestError) => {
          if (active) {
            setLoadedCourse({
              id,
              course: null,
              error: requestError.response?.data?.message || "Course details could not be loaded.",
            });
          }
        });
    }

    return () => {
      active = false;
    };
  }, [id, isMongoId]);

  useEffect(() => {
    if (!isDatabaseCourse || !course?._id || !user?._id) return undefined;

    let active = true;
    const loadLearningData = async () => {
      try {
        const { data: statusResponse } = await api.get(
          `/courses/${course._id}/enrollment-status`,
          { authTokenKey: "amade_student_token" },
        );
        const enrollment = statusResponse.data.enrollment;
        if (!enrollment || enrollment.status === "cancelled") {
          if (active) {
            setLearningData({
              courseId: course._id,
              studentId: user._id,
              revision: learningRevision,
              enrollment: null,
              lessons: [],
            });
          }
          return;
        }

        const { data: lessonsResponse } = await api.get(
          `/courses/${course._id}/lessons`,
          { authTokenKey: "amade_student_token" },
        );
        if (active) {
          setLearningData({
            courseId: course._id,
            studentId: user._id,
            revision: learningRevision,
            enrollment,
            lessons: lessonsResponse.data || [],
          });
        }
      } catch (requestError) {
        if (active) {
          setLearningData({
            courseId: course._id,
            studentId: user._id,
            revision: learningRevision,
            enrollment: null,
            lessons: [],
            error: requestError.response?.data?.message || "Course learning materials could not be loaded.",
          });
        }
      }
    };

    loadLearningData();
    return () => {
      active = false;
    };
  }, [course?._id, isDatabaseCourse, learningRevision, user?._id]);

  const enroll = useCallback(async () => {
    if (!course?._id || !isDatabaseCourse) return;
    setEnrollmentResult({
      courseId: course._id,
      isEnrolling: true,
      message: "",
      error: "",
    });

    try {
      await api.post("/enrollments", { courseId: course._id }, { authTokenKey: "amade_student_token" });
      setEnrollmentResult({
        courseId: course._id,
        isEnrolling: true,
        message: "You are enrolled. Your course is now available in My Courses.",
        error: "",
      });
      setLearningRevision((revision) => revision + 1);
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        setEnrollmentResult({
          courseId: course._id,
          isEnrolling: true,
          message: "You are already enrolled in this course.",
          error: "",
        });
      } else {
        setEnrollmentResult({
          courseId: course._id,
          isEnrolling: true,
          message: "",
          error: requestError.response?.data?.message || "Enrollment could not be completed. Please try again.",
        });
      }
    } finally {
      setEnrollmentResult((current) => current?.courseId === course._id
        ? { ...current, isEnrolling: false }
        : current);
      if (searchParams.has("enroll")) {
        setSearchParams((current) => {
          current.delete("enroll");
          return current;
        }, { replace: true });
      }
    }
  }, [course, isDatabaseCourse, searchParams, setSearchParams]);

  useEffect(() => {
    const shouldEnroll = user && course && isDatabaseCourse && searchParams.get("enroll") === "1";
    if (!shouldEnroll) {
      handledEnrollment.current = null;
      return;
    }
    if (handledEnrollment.current !== id) {
      handledEnrollment.current = id;
      enroll();
    }
  }, [user, course, id, isDatabaseCourse, searchParams, enroll]);

  const handleEnrollClick = () => {
    if (!user) {
      navigate("/student/login", {
        state: { redirectTo: location.pathname, enrollCourse: course._id },
      });
      return;
    }
    enroll();
  };

  const handleLessonComplete = async (lessonId) => {
    if (!currentLearning?.enrollment || !course?._id) return;
    setCompletingLessonId(lessonId);
    setLearningActionError("");

    try {
      const { data } = await api.put(
        `/students/lessons/${lessonId}/complete`,
        {},
        { authTokenKey: "amade_student_token" },
      );
      setLearningData((current) => current?.courseId === course._id
        && current?.studentId === user?._id
        && current?.revision === learningRevision
        ? { ...current, enrollment: data.data }
        : current);
      setLearningRevision((revision) => revision + 1);
    } catch (requestError) {
      setLearningActionError(requestError.response?.data?.message || "Lesson progress could not be saved. Please try again.");
    } finally {
      setCompletingLessonId(null);
    }
  };

  if (isLoading) {
    return <section className="mx-auto max-w-4xl px-4 py-24 text-center text-slate-600 dark:text-slate-300">Loading course details...</section>;
  }

  if (!course) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-500">{error ? "Unavailable" : "404"}</p>
          <h1 className="mt-4 text-4xl font-black text-slate-950 dark:text-white">{error ? "Course could not be loaded" : "Course not found"}</h1>
          <p role={error ? "alert" : undefined} className="mt-4 text-slate-600 dark:text-slate-400">{error || "This opportunity is not available right now."}</p>
          <Link to="/academy" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 font-bold text-slate-950">
            <ArrowLeft size={16} />
            Back to Academy
          </Link>
        </div>
      </section>
    );
  }

  const outcomes = course.outcomes || [];
  const technologies = course.technologies || [];
  const isPublished = course.status === "published" && course.isPublished !== false;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/academy" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <ArrowLeft size={16} />
          Back to Academy
        </Link>

        <div className="mt-8 overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {course.thumbnail && <img src={resolveMediaUrl(course.thumbnail)} alt="" className="h-64 w-full object-cover sm:h-96" />}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">{course.category}</p>
                <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">{course.title}</h1>
              </div>
              <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] ${isPublished ? "bg-green-500 text-slate-950" : "bg-amber-400/10 text-amber-700 dark:text-amber-300"}`}>
                {isPublished ? "Open for enrollment" : "Coming Soon"}
              </span>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <CourseFact icon={Clock3} label="Duration" value={course.duration || "Not specified"} />
              <CourseFact icon={BookOpen} label="Level" value={course.level || "Not specified"} />
              <CourseFact icon={Layers3} label="Tools" value={technologies.join(", ") || "Not specified"} />
              <CourseFact icon={Sparkles} label="Price" value={course.price ? `$${course.price}` : "Free"} />
            </div>

            {course.instructor?.name && <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">Instructor: <span className="font-semibold">{course.instructor.name}</span></p>}

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Course overview</h2>
                <p className="mt-3 leading-8 text-slate-600 dark:text-slate-400">{course.description}</p>
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm leading-7 text-slate-700 dark:border-green-900/60 dark:bg-green-500/5 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-bold text-green-700 dark:text-green-400"><Sparkles size={16} /> Why this matters</div>
                  <p className="mt-2">AMADE Academy helps learners build practical skills that can be applied in work, entrepreneurship, and digital career growth.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">What you will learn</h3>
                {outcomes.length ? (
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {outcomes.map((outcome) => <li key={outcome} className="flex gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-500" /><span>{outcome}</span></li>)}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{technologies.join(", ") || "Course outcomes will be added soon."}</p>
                )}
              </div>
            </div>

            {currentEnrollmentResult.error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{currentEnrollmentResult.error}</p>}
            {currentEnrollmentResult.message && (
              <p role="status" className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-200">
                {currentEnrollmentResult.message}{" "}
                {user && <Link to="/student/courses" className="font-bold underline">Open My Courses</Link>}
              </p>
            )}
            {isDatabaseCourse && isPublished && (
              <button onClick={handleEnrollClick} disabled={currentEnrollmentResult.isEnrolling} className="mt-8 rounded-xl bg-green-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60">
                {currentEnrollmentResult.isEnrolling ? "Enrolling..." : user ? "Enroll Now" : "Sign in to Enroll"}
              </button>
            )}
            {!isDatabaseCourse && course.status === "published" && (
              <p className="mt-8 text-sm text-slate-500">Enrollment for this course is not available through the student portal yet.</p>
            )}

            {isDatabaseCourse && user && (
              <section className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Your course lessons</h2>
                {isLearningLoading || !currentLearning ? (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Checking your course access...</p>
                ) : currentLearning.error ? (
                  <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{currentLearning.error}</p>
                ) : !currentLearning.enrollment ? (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Enroll in this course to access lessons and track your learning progress.</p>
                ) : (
                  <>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>{currentLearning.enrollment.status === "completed" ? "Course completed" : "Course progress"}</span>
                      <span className="font-bold tabular-nums">{currentLearning.enrollment.progress ?? 0}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, Math.max(0, currentLearning.enrollment.progress || 0))}%` }} />
                    </div>

                    {learningActionError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{learningActionError}</p>}
                    {currentLearning.lessons.length ? (
                      <ol className="mt-5 space-y-4">
                        {currentLearning.lessons.map((lesson, index) => {
                          const isCompleted = currentLearning.enrollment.completedLessons?.some((lessonId) => String(lessonId) === lesson._id);
                          const isLocked = lesson.isLocked === true;
                          return (
                            <li key={lesson._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-700 dark:text-green-400">Lesson {index + 1}</p>
                                  {lesson.moduleTitle && <p className="mt-1 text-xs font-semibold text-slate-500">{lesson.moduleTitle}</p>}
                                  <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{lesson.title}</h3>
                                  {lesson.description && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{lesson.description}</p>}
                                  {lesson.estimatedMinutes && <p className="mt-2 text-xs font-semibold text-slate-500">{lesson.estimatedMinutes} min study time</p>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleLessonComplete(lesson._id)}
                                  disabled={isCompleted || isLocked || completingLessonId !== null}
                                  className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold disabled:cursor-default disabled:opacity-60 ${
                                    isLocked
                                      ? "border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                                      : "border-green-600 text-green-700 dark:text-green-400"
                                  }`}
                                >
                                  {isCompleted ? "Completed" : isLocked ? "Locked" : completingLessonId === lesson._id ? "Saving..." : "Mark complete"}
                                </button>
                              </div>
                              {isLocked ? (
                                <p className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                  <LockKeyhole aria-hidden="true" size={16} />
                                  Complete the previous lesson to unlock this lesson.
                                </p>
                              ) : (
                                <>
                                  {(lesson.englishContent || lesson.content) && (
                                    <section className="mt-4 rounded-xl bg-white p-4 dark:bg-slate-950">
                                      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Lesson</h4>
                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{lesson.englishContent || lesson.content}</p>
                                    </section>
                                  )}
                                  {lesson.introduction && <section className="mt-4 rounded-xl bg-white p-4 dark:bg-slate-950"><h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Introduction</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{lesson.introduction}</p></section>}
                                  {lesson.stepByStep && <section className="mt-4 rounded-xl bg-white p-4 dark:bg-slate-950"><h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Step-by-step explanation</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{lesson.stepByStep}</p></section>}
                                  {lesson.practicalExamples && <section className="mt-4 rounded-xl bg-white p-4 dark:bg-slate-950"><h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Practical examples</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{lesson.practicalExamples}</p></section>}
                                  {lesson.codeExamples && (
                                    <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-green-200"><code>{lesson.codeExamples}</code></pre>
                                  )}
                                  {lesson.expectedOutput && <section className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><h4 className="font-bold">Expected output</h4><pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm">{lesson.expectedOutput}</pre></section>}
                                  {lesson.importantPoints && <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"><h4 className="font-bold text-amber-900 dark:text-amber-200">Important points</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{lesson.importantPoints}</p></section>}
                                  {lesson.exercises && (
                                    <section className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                                      <h4 className="font-bold text-blue-900 dark:text-blue-200">Practical exercise</h4>
                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-blue-900 dark:text-blue-100">{lesson.exercises}</p>
                                    </section>
                                  )}
                                  {lesson.oromoSummary && (
                                    <section lang="om" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                                      <h4 className="font-bold text-green-900 dark:text-green-200">Cuunfaa Barnootaa — Afaan Oromoo</h4>
                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-green-900 dark:text-green-100">{lesson.oromoSummary}</p>
                                    </section>
                                  )}
                                  {lesson.pdfUrl && <LessonPdf url={lesson.pdfUrl} />}
                                  {lesson.quiz && <LessonQuiz lessonId={lesson._id} quiz={lesson.quiz} lastAttempt={lesson.lastQuizAttempt} onPassed={() => setLearningRevision((revision) => revision + 1)} />}
                                  {lesson.videoUrl && <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-blue-700 underline dark:text-blue-400">Open lesson video</a>}
                                  {lesson.resources?.length > 0 && (
                                    <ul className="mt-4 flex flex-wrap gap-3">
                                      {lesson.resources.map((resource, resourceIndex) => (
                                        <li key={`${lesson._id}-${resourceIndex}`}>
                                          <a href={resource} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 underline dark:text-blue-400">Resource {resourceIndex + 1}</a>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    ) : (
                      <p className="mt-5 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">No published lessons are available yet.</p>
                    )}
                  </>
                )}
              </section>
            )}
            {isDatabaseCourse && user && currentLearning?.enrollment && (
              <CourseFinalProject courseId={course._id} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseFinalProject({ courseId }) {
  const [projectData, setProjectData] = useState(null);
  const [summary, setSummary] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get(`/final-projects/courses/${courseId}`, { authTokenKey: "amade_student_token" });
        if (!active) return;
        const data = response.data.data;
        setProjectData(data);
        setSummary(data.submission?.summary || "");
        setRepositoryUrl(data.submission?.repositoryUrl || "");
        setDemoUrl(data.submission?.demoUrl || "");
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Final project could not be loaded.");
      } finally {
        if (active) setIsLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [courseId]);

  const submitProject = async (event) => {
    event.preventDefault();
    if (!repositoryUrl.trim() && !demoUrl.trim()) {
      setError("Add a repository or live demo link before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await api.put(`/final-projects/courses/${courseId}`, {
        summary,
        repositoryUrl,
        demoUrl,
      }, { authTokenKey: "amade_student_token" });
      setProjectData((current) => ({ ...current, submission: response.data.data }));
      setNotice("Your final project was submitted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Final project submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p role="status" className="mt-8 text-sm text-slate-500">Loading final project...</p>;
  if (error && !projectData) return <p role="alert" className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>;
  if (!projectData?.finalProject) return null;

  const submission = projectData.submission;

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">Optional capstone</p>
      <h2 className="mt-1 text-xl font-black">{projectData.finalProject.title}</h2>
      {projectData.finalProject.instructions && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{projectData.finalProject.instructions}</p>}
      {projectData.finalProject.requirements?.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
          {projectData.finalProject.requirements.map((requirement, index) => <li key={`project-requirement-${index}`}>{requirement}</li>)}
        </ul>
      )}
      {submission && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
          <p className="font-bold">Review status: <span className="capitalize">{submission.status.replace("_", " ")}</span></p>
          {submission.feedback && <p className="mt-2 whitespace-pre-wrap text-slate-600 dark:text-slate-300">Instructor feedback: {submission.feedback}</p>}
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-green-700 dark:text-green-300">{notice}</p>}
      <form onSubmit={submitProject} className="mt-4 grid gap-3">
        <label className="text-sm font-semibold">Project summary<textarea required minLength={1} maxLength={5000} rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold">Repository URL (HTTPS)<input type="url" maxLength={2000} value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/..." className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold">Live demo URL (HTTPS)<input type="url" maxLength={2000} value={demoUrl} onChange={(event) => setDemoUrl(event.target.value)} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" /></label>
        <button type="submit" disabled={isSubmitting} className="w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 dark:bg-green-500 dark:text-slate-950">
          {isSubmitting ? "Submitting..." : submission ? "Update submission" : "Submit final project"}
        </button>
      </form>
    </section>
  );
}

function LessonPdf({ url }) {
  const [pdfState, setPdfState] = useState({ url: "", objectUrl: "", error: "" });
  const currentPdfState = pdfState.url === url ? pdfState : { objectUrl: "", error: "" };

  useEffect(() => {
    let active = true;
    let currentObjectUrl = "";

    api.get(url, { responseType: "blob", authTokenKey: "amade_student_token" })
      .then(({ data }) => {
        if (!active) return;
        currentObjectUrl = URL.createObjectURL(data);
        setPdfState({ url, objectUrl: currentObjectUrl, error: "" });
      })
      .catch((requestError) => {
        if (active) {
          setPdfState({
            url,
            objectUrl: "",
            error: requestError.response?.data?.message || "PDF material could not be loaded.",
          });
        }
      });

    return () => {
      active = false;
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    };
  }, [url]);

  if (currentPdfState.error) return <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{currentPdfState.error}</p>;
  if (!currentPdfState.objectUrl) return <p className="mt-4 text-sm text-slate-500">Loading secure PDF material...</p>;

  return (
    <section className="mt-5">
      <h4 className="mb-2 font-bold">Lesson PDF</h4>
      <iframe src={`${currentPdfState.objectUrl}#toolbar=0`} title="Lesson PDF material" className="h-[32rem] w-full rounded-xl border border-slate-200 dark:border-slate-700" />
      <p className="mt-2 text-xs text-slate-500">The viewer hides ordinary toolbar controls where supported, but cannot prevent downloads, screenshots, screen recording, or copying.</p>
    </section>
  );
}

function LessonQuiz({ lessonId, quiz, lastAttempt, onPassed }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const complete = quiz.questions.every((question) => answers[question._id] !== undefined);
    if (!complete) {
      setError("Answer every question before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const { data } = await api.post(
        `/quizzes/${lessonId}/submit`,
        { answers: quiz.questions.map((question) => ({ questionId: question._id, selectedIndex: answers[question._id] })) },
        { authTokenKey: "amade_student_token" },
      );
      setResult(data.data);
      if (data.data.passed) onPassed();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Quiz submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quiz.questions?.length) return null;

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
      <h4 className="text-lg font-extrabold">{quiz.title || "Lesson quiz"}</h4>
      {quiz.instructions && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{quiz.instructions}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      {result && (
        <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${result.passed ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200" : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"}`}>
          {result.passed ? "Quiz passed" : "Not passed yet"} — {result.points}/{result.maxScore} ({result.score}%, pass mark: {result.passScore}%)
        </p>
      )}
      {!result && lastAttempt && (
        <p className="mt-3 text-xs text-slate-500">Latest attempt: {lastAttempt.score}% · {lastAttempt.passed ? "Passed" : "Not passed"}</p>
      )}
      <form onSubmit={submit} className="mt-4 space-y-5">
        {quiz.questions.map((question, index) => (
          <fieldset key={question._id} className="space-y-2">
            <legend className="font-semibold">{index + 1}. {question.prompt}</legend>
            {question.options.map((option, optionIndex) => (
              <label key={`${question._id}-${optionIndex}`} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="radio" name={`quiz-${lessonId}-${question._id}`} value={optionIndex} checked={answers[question._id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question._id]: optionIndex }))} className="mt-1 accent-green-600" />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        ))}
        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60">{isSubmitting ? "Submitting..." : "Submit quiz"}</button>
      </form>
    </section>
  );
}

function CourseFact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Icon size={16} /> {label}</div>
      <p className="mt-2 font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export default CourseDetails;
