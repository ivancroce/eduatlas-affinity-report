import { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import UniversalDropdown from "../UniversalDropdown/UniversalDropdown";
import axios from "axios";

const FeedbackModal = ({ show, onHide, country1, country2 }) => {
  const [feedbackType, setFeedbackType] = useState("");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const feedbackOptions = [
    { value: "bug", label: "Report an Error" },
    { value: "improvement", label: "Suggest Improvement" },
    { value: "general", label: "General Feedback" }
  ];

  const handleSubmit = async () => {
    if (!feedbackType || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      await axios.post("http://localhost:3001/api/feedback", {
        feedbackType,
        message: message.trim(),
        userEmail: userEmail.trim() || null,
        country1,
        country2
      });

      setSubmitStatus("success");
      setTimeout(() => {
        onHide();
        resetForm();
      }, 2000);
    } catch (error) {
      console.log("Full error:", error);

      if (error.response?.data?.errorsList && Array.isArray(error.response.data.errorsList)) {
        setErrorMessage("Validation errors: " + error.response.data.errorsList.join(", "));
      } else {
        setErrorMessage(error.response?.data?.message || "Operation failed");
      }
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedbackType("");
    setMessage("");
    setUserEmail("");
    setSubmitStatus(null);
    setErrorMessage("");
  };

  return (
    <Modal show={show} onHide={onHide} onExited={resetForm} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Report Feedback</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {submitStatus === "success" && <Alert variant="success">Feedback submitted successfully! Thank you for your input.</Alert>}
        {submitStatus === "error" && errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>What type of feedback is this?</Form.Label>
            <UniversalDropdown
              type="generic"
              options={feedbackOptions}
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              placeholder="Select feedback type"
              showSearch={false}
              size="sm"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Your feedback</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe the issue, suggestion, or feedback in detail..."
              maxLength={1000}
            />
            <Form.Text className="text-muted">{message.length}/1000 characters</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email address (optional)</Form.Label>
            <Form.Control type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="your@email.com" />
            <Form.Text className="text-muted">Leave your email if you'd like us to follow up on your feedback</Form.Text>
          </Form.Group>

          <div className="bg-light p-3 rounded">
            <small className="text-muted">
              <strong>Report context:</strong> {country1} vs {country2} comparison
            </small>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={handleSubmit} disabled={!feedbackType || !message.trim() || isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Feedback"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FeedbackModal;
