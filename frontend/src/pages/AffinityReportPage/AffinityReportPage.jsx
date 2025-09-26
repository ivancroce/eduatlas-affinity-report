import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Image } from "react-bootstrap";
import eduatlasLogo from "../../../assets/images/eduatlas-logo.png";
import "./AffinityReportPage.scss";
import CountryFlag from "../../components/CountryFlag/CountryFlag";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { BsInfoCircle } from "react-icons/bs";
import FeedbackModal from "../../components/FeedbackModal/FeedbackModal";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(ArcElement, Tooltip, Legend);

const AffinityReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef();

  const [showFeedback, setShowFeedback] = useState(false);

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

  const calculateAffinityPercentage = (affinities) => {
    const comparableAffinities = affinities.filter((affinity) => affinity.level !== "CAN ALWAYS BE CONVERTED" && affinity.level !== "");

    const equivalentCount = comparableAffinities.filter((a) => a.level === "EQUIVALENT").length;
    const moderateCount = comparableAffinities.filter((a) => a.level === "MODERATE").length;
    const totalCount = comparableAffinities.length;

    const score = (equivalentCount * 100 + moderateCount * 60) / totalCount;
    return Math.round(score);
  };

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

  const handlePrint = () => {
    const elementsToHide = document.querySelectorAll(".no-print, .d-print-none");
    elementsToHide.forEach((el) => (el.style.display = "none"));

    window.print();

    setTimeout(() => {
      elementsToHide.forEach((el) => (el.style.display = ""));
    }, 1000);
  };

  const handleShare = async () => {
    const shareData = {
      title: `Affinity Report: ${country1.name} vs ${country2.name}`,
      text: `Compare university programs between ${country1.name} and ${country2.name} - EduAtlas`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard! You can now share it.");
      }
    } catch (error) {
      console.log("Share cancelled or failed:", error);

      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Link copied to clipboard!");
      }
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const element = reportRef.current;

      const elementsToHide = document.querySelectorAll(".no-print, .d-print-none");
      elementsToHide.forEach((el) => (el.style.display = "none"));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      elementsToHide.forEach((el) => (el.style.display = ""));

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `affinity-report-${country1.name.toLowerCase().replace(/\s+/g, "-")}-vs-${country2.name.toLowerCase().replace(/\s+/g, "-")}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const durationAffinity = calculateDurationAffinity(country1.program.duration, country2.program.duration);
  const creditsAffinity = calculateCreditsAffinity(country1.program.totalCredits, country2.program.totalCredits);
  const creditRatioAffinity = calculateCreditRatioAffinity(country1.creditRatio, country2.creditRatio);
  const gradingAffinity = calculateGradingAffinity(country1.gradingSystem, country2.gradingSystem);
  const eqfAffinity = calculateEqfAffinity(country1.program.eqfLevel, country2.program.eqfLevel);

  const affinitiesForOverall = [durationAffinity, creditsAffinity, creditRatioAffinity, eqfAffinity];
  const affinityPercentage = calculateAffinityPercentage(affinitiesForOverall);
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
    <Container className="my-5">
      {/* Header */}
      <Row className="mb-4 no-print">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <Button variant="outline-primary" onClick={() => navigate("/")} className="mb-2">
              <i className="bi bi-arrow-left me-2"></i>
              New Comparison
            </Button>
            <div className="text-end d-flex flex-column flex-sm-row">
              <Button variant="outline-secondary" size="sm" className="me-0 me-sm-2 mb-2 mb-sm-0" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i>
                Print
              </Button>
              <Button variant="outline-secondary" size="sm" className="me-0 me-sm-2 mb-2 mb-sm-0" onClick={handleShare}>
                <i className="bi bi-envelope me-1"></i>
                Share
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={handleGeneratePDF}>
                <i className="bi bi-file-earmark-pdf me-1"></i>
                PDF
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Report Card */}
      <div ref={reportRef} className="report-content">
        <Card className="shadow-lg border-0">
          <Card.Header className="bg-secondary text-white text-center py-4">
            <h2 className="mb-0 print-title">
              BACHELOR'S DEGREE - {country1.name.toUpperCase()} AND {country2.name.toUpperCase()}
            </h2>
          </Card.Header>

          <Card.Body className="p-0">
            {/* Selection Summary */}
            <div className="bg-primary p-3 text-center border-bottom">
              <small className="text-accent fs-6">Academic Equivalency Analysis</small>
            </div>
            {/* Comparison Table */}
            <div className="table-responsive d-print-block">
              <Table className="mb-0 print-table" bordered>
                <thead className="table-secondary">
                  <tr className="border-top-0">
                    <th className="w-20"></th>
                    <th className="w-25">
                      <div className="d-flex align-items-center justify-content-center">
                        <CountryFlag countryCode={country1.countryCode} countryName={country1.name} size="16x12" className="me-2" />
                        {country1.name.toUpperCase()}
                      </div>
                    </th>
                    <th className="w-25 numeric-cell">
                      <div className="d-flex align-items-center justify-content-center">
                        <CountryFlag countryCode={country2.countryCode} countryName={country2.name} size="16x12" className="me-2" />
                        {country2.name.toUpperCase()}
                      </div>
                    </th>
                    <th className="text-center w-30">AFFINITY</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="text-center">
                      <td className="fw-semibold bg-light text-start">{row.category}</td>
                      <td>{row.country1Value}</td>
                      <td>{row.country2Value}</td>
                      <td>
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
            <div className="p-4 bg-light report-summary-section">
              <Row>
                <Col lg={8} className="mb-3 mb-lg-0">
                  <div className="border rounded p-3 bg-white h-100">
                    <h6 className="fw-bold mb-3">Report Summary</h6>
                    <p className="mb-3 report-text">
                      <strong>{country1.name}</strong> bachelor's degree ({formatDuration(country1, country1.program.duration)} years,{" "}
                      {country1.program.totalCredits} ECTS) and <strong>{country2.name}</strong> bachelor's degree (
                      {formatDuration(country2, country2.program.duration)} years, {country2.program.totalCredits} ECTS) are both EQF Level{" "}
                      {country1.program.eqfLevel}.
                    </p>
                    <p className="mb-3 report-text">
                      Despite a {Math.abs(country1.program.duration - country2.program.duration)}-year difference at university level, both systems require the
                      same years of education ({country1.yearsCompulsorySchooling}+{country1.program.duration} {country1.name},{" "}
                      {country2.yearsCompulsorySchooling}+{country2.program.duration} {country2.name}), making them broadly equivalent.
                    </p>
                    <p className="mb-3 report-text">
                      Credit ratio (1 ECTS = {country1.creditRatio} hours) is {country1.creditRatio === country2.creditRatio ? "identical" : "different"}.
                      Grading systems differ but are convertible. Academic level, workload, and recognition are fully equivalent. Recognition is subject to dual
                      institutional discretion.
                    </p>
                    {(country1.hasSpecialPrograms || country2.hasSpecialPrograms) && (
                      <div className="mt-4 p-3 bg-info bg-opacity-10 border-start border-4 border-info rounded">
                        <BsInfoCircle className="text-info me-2" />
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

                      {/* Doughnut Chart */}
                      <div className="mb-3 position-relative doughnut-wrapper d-print-none">
                        <Doughnut
                          data={{
                            datasets: [
                              {
                                data: [affinityPercentage, 100 - affinityPercentage],
                                backgroundColor: ["#00275A", "#146CA8"],
                                borderWidth: 0,
                                cutout: "65%"
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } }
                          }}
                        />

                        {/* Print version */}
                        <div className="d-none d-print-block text-center">
                          <h3 className="fw-bold mb-2">{affinityPercentage}%</h3>
                          <div className={`p-2 rounded border`}>
                            <div className="fw-bold">{overallAffinity.level}</div>
                            <small className="text-muted">{overallAffinity.breakdown}</small>
                          </div>
                        </div>

                        {/* No print version */}
                        <div className="position-absolute top-50 start-50 translate-middle text-cente d-print-noner">
                          <h3 className="mb-0 text-primary fw-semibold">{affinityPercentage}%</h3>
                        </div>
                      </div>

                      <div className={`p-3 rounded bg-${overallAffinity.color} bg-opacity-10 border border-${overallAffinity.color}`}>
                        <Badge bg={overallAffinity.color} className="px-3 py-2 fs-6 fs-md-5 mb-2">
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
      </div>

      {/* Disclaimer */}
      <Row className="mt-4 align-items-center no-print">
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
      <div className="mt-4 pt-4 border-top text-center no-print">
        <Button variant="outline-secondary" size="sm" onClick={() => setShowFeedback(true)}>
          Report Issue or Give Feedback
        </Button>
      </div>

      <FeedbackModal show={showFeedback} onHide={() => setShowFeedback(false)} country1={country1?.name} country2={country2?.name} />
    </Container>
  );
};

export default AffinityReportPage;
