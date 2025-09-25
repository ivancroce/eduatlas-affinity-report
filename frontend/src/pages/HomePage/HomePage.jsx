import { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BsArrowLeftRight } from "react-icons/bs";
import UniversalDropdown from "../../components/UniversalDropdown/UniversalDropdown";
import StatCounter from "../../components/StatCounter/StatCounter";
import "./HomePage.scss";

const HomePage = () => {
  const [countries, setCountries] = useState([]);
  const [country1, setCountry1] = useState("");
  const [country2, setCountry2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/countries/simple");
      setCountries(response.data);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const handleGenerateReport = async () => {
    if (!country1 || !country2) {
      setErrorMessage("Please select both countries");
      return;
    }

    if (country1 === country2) {
      setErrorMessage("Please select different countries");
      return;
    }

    setIsLoading(true);

    try {
      const [country1Data, country2Data, program1Data, program2Data, special1Data, special2Data] = await Promise.all([
        axios.get(`http://localhost:3001/api/countries/${country1}`),
        axios.get(`http://localhost:3001/api/countries/${country2}`),
        axios.get(`http://localhost:3001/api/countries/${country1}/representative-program`),
        axios.get(`http://localhost:3001/api/countries/${country2}/representative-program`),
        axios.get(`http://localhost:3001/api/countries/${country1}/has-special-program`),
        axios.get(`http://localhost:3001/api/countries/${country2}/has-special-program`)
      ]);

      navigate("/affinity-report", {
        state: {
          country1: {
            ...country1Data.data,
            program: program1Data.data,
            hasSpecialPrograms: special1Data.data
          },
          country2: {
            ...country2Data.data,
            program: program2Data.data,
            hasSpecialPrograms: special2Data.data
          }
        }
      });
    } catch (error) {
      console.error("Error generating report:", error);
      setErrorMessage({ type: "danger", text: "Error generating report. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <Container className="my-5 py-3">
        {errorMessage && (
          <Row className="justify-content-center mb-4">
            <Col lg={8}>
              <Alert variant={errorMessage.type || "warning"} onClose={() => setErrorMessage("")} dismissible>
                {errorMessage.text || errorMessage}
              </Alert>
            </Col>
          </Row>
        )}
        <Row className="text-center mb-5">
          <Col>
            <h1 className="display-4 fw-normal text-primary mb-3">
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
                <h3 className="text-center mb-4 text-primary">Compare Degree Programs</h3>

                <Row className="mb-4">
                  <Col md={5}>
                    <Form.Group>
                      <UniversalDropdown
                        type="countries"
                        countries={countries}
                        value={country1}
                        onChange={(e) => setCountry1(e.target.value)}
                        placeholder="Select Country"
                        size="lg"
                        showSearch={true}
                        showAllCountries={false}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={2} className="d-flex align-items-center justify-content-center">
                    <div className="my-2 my-md-0">
                      <BsArrowLeftRight className="text-secondary" size={32} />
                    </div>
                  </Col>

                  <Col md={5}>
                    <Form.Group>
                      <UniversalDropdown
                        type="countries"
                        countries={countries}
                        value={country2}
                        onChange={(e) => setCountry2(e.target.value)}
                        placeholder="Select Country"
                        size="lg"
                        showSearch={true}
                        showAllCountries={false}
                      />
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
                  <Button
                    variant="secondary"
                    size="lg"
                    className="px-4 py-3 d-none d-sm-inline-block"
                    onClick={handleGenerateReport}
                    disabled={isLoading || !country1 || !country2}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-graph-up me-2"></i>
                        Generate Affinity Report
                      </>
                    )}
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    className="px-3 py-3 d-sm-none w-100"
                    onClick={handleGenerateReport}
                    disabled={isLoading || !country1 || !country2}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-graph-up me-2"></i>
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Info Section */}
        <Row className="mt-5 pt-5 mb-5">
          <Col className="text-center">
            <h3 className="text-primary section-title mb-3">Why Choose EduAtlas</h3>
            <p className="text-muted fs-5">Comprehensive degree comparison powered by international standards</p>
          </Col>
        </Row>
        <Row className="">
          <Col md={4} className="text-center mb-4">
            <div className="feature-icon mb-3">
              <i className="bi bi-mortarboard display-4 text-primary"></i>
            </div>
            <h4 className="text-primary">Academic Equivalency</h4>
            <p className="text-muted fs-5">Compare degree requirements, credit systems, and academic standards</p>
          </Col>
          <Col md={4} className="text-center mb-4">
            <div className="feature-icon mb-3">
              <i className="bi bi-globe display-4 text-secondary"></i>
            </div>
            <h4 className="text-primary">International Standards</h4>
            <p className="text-muted fs-5">Based on EQF framework and international education benchmarks</p>
          </Col>
          <Col md={4} className="text-center mb-4">
            <div className="feature-icon mb-3">
              <i className="bi-clipboard-data display-4 fw-normal text-warning"></i>
            </div>
            <h4 className="text-primary">Detailed Analysis</h4>
            <p className="text-muted fs-5">Comprehensive degree comparison analysis between countries</p>
          </Col>
        </Row>
        <Row className="text-center">
          <Col>
            <i className="bi bi-chevron-double-down text-secondary fs-1 bounce"></i>
          </Col>
        </Row>

        {/* Statistics Section */}
        <Row className="mt-4 pt-4 mb-4 ">
          <Col className="text-center">
            <h3 className="text-primary section-title mb-3">Platform Statistics</h3>
            <p className="text-muted fs-5">Real-time data from our comprehensive education database</p>
          </Col>
        </Row>
        <Row className="pb-5">
          <Col lg={3} md={6} className="text-center mb-4">
            <div className="stat-item">
              <h2 className="display-3 fw-bold text-secondary mb-2">
                <StatCounter endValue={30} suffix="+" />
              </h2>
              <p className="text-muted fw-semibold mb-0">Countries Covered</p>
            </div>
          </Col>

          <Col lg={3} md={6} className="text-center mb-4">
            <div className="stat-item">
              <h2 className="display-3 fw-bold text-secondary mb-2">
                <StatCounter endValue={500} suffix="+" />
              </h2>
              <p className="text-muted fw-semibold mb-0">Programs Analyzed</p>
            </div>
          </Col>

          <Col lg={3} md={6} className="text-center mb-4">
            <div className="stat-item">
              <h2 className="display-3 fw-bold text-secondary mb-2">
                <StatCounter endValue={1000} suffix="+" />
              </h2>
              <p className="text-muted fw-semibold mb-0">Reports Generated</p>
            </div>
          </Col>

          <Col lg={3} md={6} className="text-center mb-4">
            <div className="stat-item">
              <h2 className="display-3 fw-bold text-secondary mb-2">
                <StatCounter endValue={100} suffix="%" />
              </h2>
              <p className="text-muted fw-semibold mb-0">Data Accuracy</p>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default HomePage;
