import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock3, Layers3, Sparkles } from "lucide-react";
import { courses as publicCourses } from "../data/courses";
import { useStudentAuth } from "../context/studentAuthContextValue";
import api from "../services/api";

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
          {course.thumbnail && <img src={course.thumbnail} alt="" className="h-64 w-full object-cover sm:h-96" />}
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
                          return (
                            <li key={lesson._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-700 dark:text-green-400">Lesson {index + 1}</p>
                                  <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{lesson.title}</h3>
                                  {lesson.description && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{lesson.description}</p>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleLessonComplete(lesson._id)}
                                  disabled={isCompleted || completingLessonId !== null}
                                  className="shrink-0 rounded-xl border border-green-600 px-4 py-2 text-sm font-bold text-green-700 disabled:cursor-default disabled:opacity-60 dark:text-green-400"
                                >
                                  {isCompleted ? "Completed" : completingLessonId === lesson._id ? "Saving..." : "Mark complete"}
                                </button>
                              </div>
                              {lesson.content && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{lesson.content}</p>}
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
          </div>
        </div>
      </div>
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
