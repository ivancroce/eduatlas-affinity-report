import { useEffect, useState } from "react";
import { Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import axios from "axios";

const DashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchusers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found. Please login.");
        }

        const response = await axios.get("http://localhost:3001/api/users", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const sortedUsers = response.data.content.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setUsers(sortedUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load user data. You may be unauthorized.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchusers();
  }, []);

  if (isLoading) {
    return <Spinner animation="border" variant="primary" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="my-5">
        <h1 className="mb-4 text-dark">User Dashboard</h1>
      </div>
      <Row>
        {users.map((user) => (
          <Col key={user.id} md={4} className="mb-3">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title className="mb-3">
                  {user.firstName} {user.lastName}
                </Card.Title>
                <Card.Text as="div">
                  <div>
                    <strong>Username:</strong> {user.usernameField}
                  </div>
                  <div>
                    <strong>Email:</strong> {user.email}
                  </div>
                  <div>
                    <strong>Role:</strong> {user.role}
                  </div>
                  <div>
                    <strong>Avatar URL:</strong> {user.avatarUrl}
                  </div>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DashboardPage;
