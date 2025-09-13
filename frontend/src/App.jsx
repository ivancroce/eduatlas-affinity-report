import "./App.scss";
import { Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import MyFooter from "./components/MyFooter/MyFooter";
import MyNavBar from "./components/MyNavBar/MyNavBar";
import LoginPage from "./pages/LoginPage/LoginPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import HomePage from "./pages/HomePage/HomePage";
import AffinityReportPage from "./pages/AffinityReportPage/AffinityReportPage";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
  return (
    <>
      <MyNavBar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/affinity-report" element={<AffinityReportPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <MyFooter />
    </>
  );
}

export default App;
