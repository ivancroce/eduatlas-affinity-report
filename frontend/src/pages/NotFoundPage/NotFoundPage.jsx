import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { BsHouse, BsSearch, BsArrowLeft } from "react-icons/bs";
import { useAvailableHeight } from "../../hooks/useAvailableHeight";
import "./NotFoundPage.scss";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  useAvailableHeight();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="full-page-container not-found-container d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} md={10}>
            <Card className="not-found-card border-0 shadow-lg rounded-4">
              <Card.Body className="p-4 p-md-5 text-center">
                <h1 className="not-found-number display-1 fw-bold mb-4">404</h1>

                {/* Title and Description */}
                <h2 className="not-found-title h3 mb-3 fw-bold">Page Not Found</h2>
                <p className="lead text-muted mb-4">Oops! The educational resource you're looking for seems to have wandered off campus.</p>
                <span className="not-found-badge badge px-3 py-2 mb-4 d-inline-block">EduAtlas • Westcliff University</span>

                {/* Search Icon */}
                <div className="mb-4">
                  <div className="not-found-icon d-inline-flex align-items-center justify-content-center rounded-circle mb-3">
                    <BsSearch size={36} />
                  </div>
                  <p className="text-muted mb-4">The page might have been moved, deleted, or is temporarily unavailable.</p>
                </div>

                {/* Action Buttons */}
                <Row className="g-3 justify-content-center mb-4">
                  <Col xs={12} sm={6} md={4}>
                    <Button
                      onClick={handleGoHome}
                      size="lg"
                      className="not-found-btn-home w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    >
                      <BsHouse size={18} />
                      Go Home
                    </Button>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Button
                      variant="outline-primary"
                      onClick={handleGoBack}
                      size="lg"
                      className="not-found-btn-back w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    >
                      <BsArrowLeft size={18} />
                      Go Back
                    </Button>
                  </Col>
                </Row>

                {/* Help Text */}
                <p className="mb-0 text-muted small">Need help? Return to the homepage or use the navigation menu.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NotFoundPage;
