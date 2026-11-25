
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/loginpage";
import Register from "./pages/register";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import Profile from "./pages/Profile";
import StudentProjects from "./pages/StudentProjects";
import StudentSkills from "./pages/StudentSkills";
import Resume from "./pages/Resume";

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Student routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/resume"
          element={
            <ProtectedRoute role="student">
              <Resume />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute role="student">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/projects"
          element={
            <ProtectedRoute role="student">
              <StudentProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/skills"
          element={
            <ProtectedRoute role="student">
              <StudentSkills />
            </ProtectedRoute>
          }
        />

        {/* Faculty route */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute role="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
