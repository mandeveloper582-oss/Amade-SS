import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import ScrollToTop from "./components/ScrollToTop";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Academy from "./pages/Academy";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Blog from "./pages/Blog";
import BlogDetails from "./pages/BlogDetails";
import Contact from "./pages/Contact";
import CourseDetails from "./pages/CourseDetails";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCourses from "./pages/AdminCourses";
import AdminStudents from "./pages/AdminStudents";
import AdminEnrollments from "./pages/AdminEnrollments";
import AdminContentManager from "./pages/AdminContentManager";
import AdminMessages from "./pages/AdminMessages";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";
import StudentCourses from "./pages/StudentCourses";
import StudentProfile from "./pages/StudentProfile";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { StudentAuthProvider } from "./context/StudentAuthContext";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AdminAuthProvider>
          <StudentAuthProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/enrollments" element={<AdminEnrollments />} />
              <Route path="/admin/projects" element={<AdminContentManager kind="projects" />} />
              <Route path="/admin/services" element={<AdminContentManager kind="services" />} />
              <Route path="/admin/blog" element={<AdminContentManager kind="blog" />} />
              <Route path="/admin/messages" element={<AdminMessages />} />

              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/register" element={<StudentRegister />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<StudentCourses />} />
              <Route path="/student/profile" element={<StudentProfile />} />

              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/academy/:id" element={<CourseDetails />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogDetails />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </StudentAuthProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
