import { useState } from "react";
import { Form, Button, Container, Row, Col, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { jwtDecode } from "jwt-decode";
import "./LoginPage.scss";
import { useAvailableHeight } from "../../hooks/useAvailableHeight";

const LoginPage = () => {
  useAvailableHeight();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });

      const token = response.data.accessToken;

      localStorage.setItem("accessToken", token);

      const decoded = jwtDecode(token);

      const userRole = decoded.role;

      window.dispatchEvent(
        new CustomEvent("userLoggedIn", {
          detail: {
            role: userRole,
            userId: decoded.sub
          }
        })
      );

      if (userRole === "ADMIN") {
        navigate("/admin-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err);

      if (err.response && err.response.data) {
        setError(err.response.data.message || "Invalid credentials. Please try again.");
      } else {
        setError("Could not connect to the server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="full-page-container d-flex align-items-center">
      <Container>
        <Row className="justify-content-center align-items-center min-h-70vh">
          <Col md={6} lg={4}>
            <div className="bg-white rounded-3 shadow-sm p-4">
              <h3 className="text-center mb-4 text-primary fw-semibold">Login</h3>
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="login-input"
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="login-input"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button variant="secondary" type="submit" disabled={isLoading} className="login-submit-btn fw-semibold" size="lg">
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
