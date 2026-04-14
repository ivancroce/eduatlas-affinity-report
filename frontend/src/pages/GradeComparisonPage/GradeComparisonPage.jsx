import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Table, Button, Badge } from "react-bootstrap";
import { gradingScales } from "../../data/gradingScales";
import CountryFlag from "../../components/CountryFlag/CountryFlag";
import { useAvailableHeight } from "../../hooks/useAvailableHeight";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./GradeComparisonPage.scss";

const GRADE_COLUMNS = [
  { key: "excellent", label: "A", sublabel: "EXCELLENT" },
  { key: "veryGood", label: "B", sublabel: "VERY GOOD" },
  { key: "good", label: "C", sublabel: "GOOD" },
  { key: "pass", label: "D/E", sublabel: "PASS" },
  { key: "fail", label: "F", sublabel: "FAIL" }
];

const GradeComparisonPage = () => {
  useAvailableHeight();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportRef = useRef();

  const c1 = searchParams.get("c1") || "";
  const c2 = searchParams.get("c2") || "";

  const scale1 = gradingScales[c1.toUpperCase()];
  const scale2 = gradingScales[c2.toUpperCase()];

  const country1Name = scale1?.name || c1;
  const country2Name = scale2?.name || c2;

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
      title: `Grade Comparison: ${country1Name} vs ${country2Name}`,
      text: `Compare grading scales between ${country1Name} and ${country2Name} - EduAtlas`,
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
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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

      pdf.save(`grade-comparison-${c1.toLowerCase()}-vs-${c2.toLowerCase()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  return (
    <div className="full-page-container py-4">
      <Container className="grade-comparison-page">
        {/* Header row: back button left, action buttons right */}
        <Row className="mb-4 no-print">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <Button variant="outline-primary" size="sm" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-2"></i>
                go back
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

        {/* Printable content */}
        <div ref={reportRef}>
          <Row className="text-center mb-4">
            <Col>
              <h2 className="text-primary fw-bold mb-1">Compare Grades</h2>
              <p className="text-muted mb-0">International grade comparison for Bachelor&apos;s Degree</p>
            </Col>
          </Row>

          <Row className="justify-content-center mb-4">
            <Col lg={8}>
              <div className="country-header-row d-flex justify-content-around text-center">
                <div className="country-label">
                  <CountryFlag countryCode={c1} countryName={country1Name} size="32x24" className="mb-1" />
                  <div className="fw-semibold text-primary">{country1Name}</div>
                  <Badge bg="secondary" className="mt-1">
                    Bachelor&apos;s Degree
                  </Badge>
                </div>
                <div className="country-label">
                  <CountryFlag countryCode={c2} countryName={country2Name} size="32x24" className="mb-1" />
                  <div className="fw-semibold text-primary">{country2Name}</div>
                  <Badge bg="secondary" className="mt-1">
                    Bachelor&apos;s Degree
                  </Badge>
                </div>
              </div>
            </Col>
          </Row>

          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="table-responsive">
                <Table bordered className="grade-table text-center mb-0">
                  <thead className="table-secondary">
                    <tr>
                      <th className="country-col"></th>
                      {GRADE_COLUMNS.map((col) => (
                        <th key={col.key}>
                          <span className="grade-letter">{col.label}</span>
                          <br />
                          <small className="text-muted">{col.sublabel}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: country1Name, code: c1, scale: scale1 },
                      { name: country2Name, code: c2, scale: scale2 }
                    ].map(({ name, code, scale }) => (
                      <tr key={code}>
                        <td className="fw-semibold bg-light text-start country-name-cell">
                          <CountryFlag countryCode={code} countryName={name} size="16x12" className="me-2" />
                          {name}
                        </td>
                        {GRADE_COLUMNS.map((col) => (
                          <td key={col.key} className={col.key === "fail" ? "fail-cell" : ""}>
                            {scale ? scale[col.key] : <span className="text-muted">N/A</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {(!scale1 || !scale2) && (
                <p className="text-muted small mt-3 text-center">N/A indicates the grading scale for this country is not yet available in our database.</p>
              )}
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default GradeComparisonPage;
