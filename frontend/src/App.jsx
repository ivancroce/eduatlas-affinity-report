import "./App.scss";
import { Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import MyFooter from "./components/MyFooter/MyFooter";
import MyNavBar from "./components/MyNavBar/MyNavBar";
import LoginPage from "./pages/LoginPage/LoginPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";

function App() {
  return (
    <>
      <MyNavBar />
      <main className="flex-grow-1">
        <Container className="my-4">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </main>
      <MyFooter />
    </>
  );
}

export default App;
