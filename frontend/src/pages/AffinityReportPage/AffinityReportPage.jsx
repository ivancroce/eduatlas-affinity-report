import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Image } from "react-bootstrap";
import eduatlasLogo from "../../../assets/images/eduatlas-logo.png";
import "./AffinityReportPage.scss";

const AffinityReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { country1, country2 } = location.state || {};

  if (!country1 || !country2) {
    return (
      <Container className="mt-5">
        <Alert variant="warning" className="text-center">
          <h4>No comparison data found</h4>
          <p>Please go back to the homepage and select countries to compare.</p>
          <Button variant="primary" onClick={() => navigate("/")}>
            Back to Homepage
          </Button>
        </Alert>
      </Container>
    );
  }

  // Calculate affinity for each category
  const calculateDurationAffinity = (dur1, dur2) => {
    const diff = Math.abs(dur1 - dur2);
    if (diff === 0) return { level: "EQUIVALENT", color: "success" };
    if (diff === 1) return { level: "MODERATE", color: "warning" };
    return { level: "LOW", color: "danger" };
  };

  const calculateCreditsAffinity = (credits1, credits2) => {
    const diff = Math.abs(credits1 - credits2);
    const percentage = (diff / Math.max(credits1, credits2)) * 100;
    if (percentage <= 10) return { level: "EQUIVALENT", color: "success" };
    if (percentage <= 25) return { level: "MODERATE", color: "warning" };
    return { level: "LOW", color: "danger" };
  };

  const calculateCreditRatioAffinity = (ratio1, ratio2) => {
    if (ratio1 === ratio2) return { level: "EQUIVALENT", color: "success" };
    return { level: "MODERATE", color: "warning" };
  };

  // It always return CAN ALWAYS BE CONVERTED at the moment
  const calculateGradingAffinity = () => {
    return { level: "CAN ALWAYS BE CONVERTED", color: "warning" };
  };

  const calculateEqfAffinity = (eqf1, eqf2) => {
    if (eqf1 === eqf2) return { level: "EQUIVALENT", color: "success" };
    const diff = Math.abs(eqf1 - eqf2);
    if (diff === 1) return { level: "MODERATE", color: "warning" };
    return { level: "LOW", color: "danger" };
  };

  // Calculate Overall Affinity
  const calculateOverallAffinity = (affinities) => {
    const comparableAffinities = affinities.filter((affinity) => affinity.level !== "CAN ALWAYS BE CONVERTED" && affinity.level !== "");

    const equivalentCount = comparableAffinities.filter((a) => a.level === "EQUIVALENT").length;
    const lowCount = comparableAffinities.filter((a) => a.level === "LOW").length;

    if (lowCount > 0) {
      return { level: "LOW", color: "danger", breakdown: "Low compatibility" };
    }

    if (equivalentCount === comparableAffinities.length) {
      return { level: "EQUIVALENT", color: "success", breakdown: "High compatibility" };
    }

    return { level: "MODERATE", color: "warning", breakdown: "Moderate compatibility" };
  };

  const durationAffinity = calculateDurationAffinity(country1.program.duration, country2.program.duration);
  const creditsAffinity = calculateCreditsAffinity(country1.program.totalCredits, country2.program.totalCredits);
  const creditRatioAffinity = calculateCreditRatioAffinity(country1.creditRatio, country2.creditRatio);
  const gradingAffinity = calculateGradingAffinity(country1.gradingSystem, country2.gradingSystem);
  const eqfAffinity = calculateEqfAffinity(country1.program.eqfLevel, country2.program.eqfLevel);

  const affinitiesForOverall = [durationAffinity, creditsAffinity, creditRatioAffinity, eqfAffinity];
  const overallAffinity = calculateOverallAffinity(affinitiesForOverall);

  // For Poland having 3.5 Duration BA
  const formatDuration = (country, duration) => {
    if (country.name === "Poland" && duration === 4 && country.program.isSpecialProgram) {
      return "3.5";
    }
    return duration.toString();
  };

  const comparisonData = [
    {
      category: "STANDARD DURATION",
      country1Value: `${formatDuration(country1, country1.program.duration)} YEARS`,
      country2Value: `${formatDuration(country2, country2.program.duration)} YEARS`,
      affinity: durationAffinity
    },
    {
      category: "OVERALL CREDITS",
      country1Value: `${country1.program.totalCredits} ECTS`,
      country2Value: `${country2.program.totalCredits} ECTS`,
      affinity: creditsAffinity
    },
    {
      category: "CREDIT RATIO (1 ECTS)",
      country1Value: `${country1.creditRatio} HOURS OF STUDENT WORK`,
      country2Value: `${country2.creditRatio} HOURS OF STUDENT WORK`,
      affinity: creditRatioAffinity
    },
    {
      category: "EQF/OFQUAL/US",
      country1Value: country1.program.eqfLevel,
      country2Value: country2.program.eqfLevel,
      affinity: eqfAffinity
    },
    {
      category: "GRADING SYSTEM",
      country1Value: country1.gradingSystem,
      country2Value: country2.gradingSystem,
      affinity: gradingAffinity
    },
    {
      category: "DEGREE'S OFFICIAL NAME",
      country1Value: country1.program.officialDenomination,
      country2Value: country2.program.officialDenomination,
      affinity: { level: "", color: "" }
    }
  ];

  return (
    <Container className="my-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <Button variant="outline-primary" onClick={() => navigate("/")} className="mb-2">
              <i className="bi bi-arrow-left me-2"></i>
              New Comparison
            </Button>
            <div className="text-end d-flex flex-column flex-sm-row">
              <Button variant="outline-secondary" size="sm" className="me-0 me-sm-2 mb-2 mb-sm-0">
                <i className="bi bi-printer me-1"></i>
                Print
              </Button>
              <Button variant="outline-secondary" size="sm" className="me-0 me-sm-2 mb-2 mb-sm-0">
                <i className="bi bi-envelope me-1"></i>
                Share
              </Button>
              <Button variant="outline-secondary" size="sm">
                <i className="bi bi-file-earmark-pdf me-1"></i>
                PDF
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Report Card */}
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-secondary text-white text-center py-4">
          <h2 className="mb-0">
            BACHELOR'S DEGREE - {country1.name.toUpperCase()} AND {country2.name.toUpperCase()}
          </h2>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Selection Summary */}
          <div className="bg-light p-4 border-bottom">
            <Row className="text-center">
              <Col md={4}>
                <div>
                  <strong>Country 1</strong>
                  <div className="mt-2">
                    <Badge bg="primary" className="px-3 py-2 fs-6">
                      {country1.name}
                    </Badge>
                  </div>
                  <small className="text-muted">First country for comparison</small>
                </div>
              </Col>
              <Col md={4}>
                <div>
                  <strong>Country 2</strong>
                  <div className="mt-2">
                    <Badge bg="primary" className="px-3 py-2 fs-6">
                      {country2.name}
                    </Badge>
                  </div>
                  <small className="text-muted">Second country for comparison</small>
                </div>
              </Col>
              <Col md={4}>
                <div>
                  <strong>Grade</strong>
                  <div className="mt-2">
                    <Badge bg="primary" className="px-3 py-2 fs-6">
                      Bachelor
                    </Badge>
                  </div>
                  <small className="text-muted">Degree level</small>
                </div>
              </Col>
            </Row>
          </div>

          {/* Comparison Table */}
          <div className="table-responsive">
            <Table className="mb-0" bordered>
              <thead className="table-secondary">
                <tr>
                  <th className="w-20"></th>
                  <th className="text-center w-25">{country1.name.toUpperCase()}</th>
                  <th className="text-center w-25">{country2.name.toUpperCase()}</th>
                  <th className="text-center w-30">AFFINITY</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index}>
                    <td className="fw-bold bg-light">{row.category}</td>
                    <td className="text-center">{row.country1Value}</td>
                    <td className="text-center">{row.country2Value}</td>
                    <td className="text-center">
                      {row.affinity.level && (
                        <Badge bg={row.affinity.color} className="px-3 py-2 fs-6">
                          {row.affinity.level}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Report Summary */}
          <div className="p-4 bg-light">
            <Row>
              <Col lg={8} className="mb-3 mb-lg-0">
                <div className="border rounded p-3 bg-white h-100">
                  <h6 className="fw-bold mb-3">Report Summary</h6>
                  <p className="mb-2 report-text">
                    <strong>{country1.name}</strong> bachelor's degree ({formatDuration(country1, country1.program.duration)} years,{" "}
                    {country1.program.totalCredits} ECTS) and <strong>{country2.name}</strong> bachelor's degree (
                    {formatDuration(country2, country2.program.duration)} years, {country2.program.totalCredits} ECTS) are both EQF Level{" "}
                    {country1.program.eqfLevel}.
                  </p>
                  <p className="mb-2 report-text">
                    Despite a {Math.abs(country1.program.duration - country2.program.duration)}-year difference at university level, both systems require the
                    same years of education ({country1.yearsCompulsorySchooling}+{country1.program.duration} {country1.name},{" "}
                    {country2.yearsCompulsorySchooling}+{country2.program.duration} {country2.name}), making them broadly equivalent.
                  </p>
                  <p className="mb-0 text-muted small report-text">
                    Credit ratio (1 ECTS = {country1.creditRatio} hours) is {country1.creditRatio === country2.creditRatio ? "identical" : "different"}. Grading
                    systems differ but are convertible. Academic level, workload, and recognition are fully equivalent. Recognition is subject to dual
                    institutional discretion.
                  </p>
                  {(country1.hasSpecialPrograms || country2.hasSpecialPrograms) && (
                    <div className="mt-3 p-3 bg-info bg-opacity-10 border border-info rounded">
                      <small className="text-muted">
                        <strong>Note:</strong>{" "}
                        {country1.hasSpecialPrograms && country2.hasSpecialPrograms
                          ? `Both ${country1.name} and ${country2.name} have alternative program durations available.`
                          : country1.hasSpecialPrograms
                          ? `${country1.name} has alternative program durations available.`
                          : `${country2.name} has alternative program durations available.`}{" "}
                      </small>
                    </div>
                  )}
                </div>
              </Col>
              <Col lg={4}>
                <div className="text-center h-100">
                  <div className="border rounded p-3 bg-white h-100 d-flex flex-column justify-content-center">
                    <h6 className="fw-bold mb-3">FINAL AFFINITY RATE</h6>
                    <div className={`p-3 rounded bg-${overallAffinity.color} bg-opacity-10 border border-${overallAffinity.color}`}>
                      <Badge bg={overallAffinity.color} className="px-3 py-2 fs-6 fs-md-5 mb-2 ">
                        {overallAffinity.level}
                      </Badge>
                      <div className="small text-muted">{overallAffinity.breakdown}</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Card.Body>

        <Card.Footer className="text-center py-3 bg-secondary text-white">
          <small>EduAtlas, {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</small>
        </Card.Footer>
      </Card>

      {/* Disclaimer */}
      <Row className="mt-4 align-items-center">
        <Col md={9}>
          <p className="small text-muted disclaimer-text">
            Credit and grade conversions are based on official sources and publicly available data; however, such information may have been updated, revised, or
            modified by the relevant authorities since the time of publication. <strong>EduAtlas</strong> is a free service offered to users worldwide. We
            welcome constructive feedback to help improve the accuracy, clarity, and usefulness of the system. Any suggested corrections or updates can be
            submitted to the EduAtlas team to enhance the collective quality and reliability of the project.
          </p>
        </Col>
        <Col md={3} className="text-center">
          <Image src={eduatlasLogo} alt="EduAtlas Logo" className="img-fluid logo-sm" />
        </Col>
      </Row>
    </Container>
  );
};

export default AffinityReportPage;
