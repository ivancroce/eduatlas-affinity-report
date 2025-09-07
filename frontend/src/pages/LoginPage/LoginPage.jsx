import { useState } from "react";
import { Form, Button, Container, Row, Col, Card, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const LoginPage = () => {
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

      console.log("Login successful!", response.data);
      const token = response.data.accessToken;

      localStorage.setItem("accessToken", token);

      navigate("/dashboard");
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
    <Container>
      <Row className="justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <Col md={6} lg={4}>
          <div className="p-4 login-card">
            <h3 className="text-center mb-4">Login</h3>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
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
                />
              </Form.Group>

              <div className="d-grid">
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
