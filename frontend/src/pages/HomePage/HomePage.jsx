import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import "./HomePage.scss";

const HomePage = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h1 className="display-4 fw-normal text-primary mb-3 affinity-title">
                Bachelor's Degree <span className="text-secondary">Affinity Report</span>
              </h1>
              <p className="lead fw-normal text-muted">
                Compare international bachelor degree programs and discover academic equivalencies between different education systems worldwide.
              </p>
            </Col>
          </Row>

          {/* Comparison Form */}
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="shadow-lg border-0">
                <Card.Body className="p-5">
                  <h3 className="text-center mb-4">Compare Degree Programs</h3>

                  <Row className="mb-4">
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label className="fw-bold text-primary">Country 1</Form.Label>
                        <Form.Select size="lg" disabled>
                          <option>Select Country</option>
                        </Form.Select>
                        <Form.Text className="text-muted">First country for comparison</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={2} className="d-flex align-items-center justify-content-center">
                      <div className="comparison-arrow mt-2 mt-md-0">
                        <i className="bi bi-arrow-left-right display-6 text-secondary"></i>
                      </div>
                    </Col>

                    <Col md={5}>
                      <Form.Group>
                        <Form.Label className="fw-bold text-primary">Country 2</Form.Label>
                        <Form.Select size="lg" disabled>
                          <option>Select Country</option>
                        </Form.Select>
                        <Form.Text className="text-muted">Second country for comparison</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-bold text-primary">Degree Level</Form.Label>
                        <Form.Select size="lg" disabled>
                          <option>Bachelor's Degree (BA)</option>
                        </Form.Select>
                        <Form.Text className="text-muted">Additional degree levels coming soon</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="text-center">
                    <Button variant="secondary" size="lg" className="px-4 py-3" disabled>
                      <i className="bi bi-graph-up me-2"></i>
                      Generate Affinity Report
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Info Section */}
          <Row className="mt-5">
            <Col md={4} className="text-center mb-3">
              <div className="feature-icon mb-3">
                <i className="bi bi-mortarboard display-4 text-primary"></i>
              </div>
              <h4>Academic Equivalency</h4>
              <p className="text-muted fs-5">Compare degree requirements, credit systems, and academic standards</p>
            </Col>
            <Col md={4} className="text-center mb-3">
              <div className="feature-icon mb-3">
                <i className="bi bi-globe display-4 text-secondary"></i>
              </div>
              <h4>International Standards</h4>
              <p className="text-muted fs-5">Based on EQF framework and international education benchmarks</p>
            </Col>
            <Col md={4} className="text-center mb-3">
              <div className="feature-icon mb-3">
                <i className="bi-clipboard-data display-4 fw-normal text-warning"></i>
              </div>
              <h4>Detailed Analysis</h4>
              <p className="text-muted fs-5">Comprehensive degree comparison analysis</p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default HomePage;
