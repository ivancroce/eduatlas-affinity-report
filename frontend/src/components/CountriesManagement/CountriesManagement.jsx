import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Alert, Badge, Row, Col, Card, Pagination } from "react-bootstrap";
import { BsPencilSquare, BsTrash, BsPlus, BsEye, BsExclamationTriangle } from "react-icons/bs";
import api from "../../api/axios";
import "./CountriesManagement.scss";

const CountriesManagement = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showProgramsModal, setShowProgramsModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, edit, create
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bachelorPrograms, setBachelorPrograms] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    yearsCompulsorySchooling: "",
    gradingSystem: "",
    creditRatio: ""
  });

  useEffect(() => {
    fetchCountries(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const fetchCountries = async (page = 0) => {
    try {
      setIsLoading(true);

      const response = await api.get(`/countries?page=${page}&size=${pageSize}&sort=name`);
      console.log("Response data:", response.data);

      const pageData = response.data;

      setCountries(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
      setCurrentPage(pageData.number || 0);
    } catch (error) {
      console.error("Full error object:", error);
      setError("Failed to fetch countries: " + (error.response?.data?.message || error.message));
      setCountries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCountryPrograms = async (countryId) => {
    try {
      const response = await api.get(`/countries/${countryId}/bachelor-programs`);
      setBachelorPrograms(response.data);
    } catch (error) {
      setError("Failed to fetch bachelor programs");
      console.error("Error fetching programs:", error);
    }
  };

  const handleShowModal = (mode, country = null) => {
    setModalMode(mode);
    setSelectedCountry(country);

    if (country) {
      setFormData({
        name: country.name || "",
        yearsCompulsorySchooling: country.yearsCompulsorySchooling || "",
        gradingSystem: country.gradingSystem || "",
        creditRatio: country.creditRatio || ""
      });
    } else {
      setFormData({
        name: "",
        yearsCompulsorySchooling: "",
        gradingSystem: "",
        creditRatio: ""
      });
    }

    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const handleShowPrograms = async (country) => {
    setSelectedCountry(country);
    await fetchCountryPrograms(country.id);
    setShowProgramsModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowProgramsModal(false);
    setSelectedCountry(null);
    setFormData({
      name: "",
      yearsCompulsorySchooling: "",
      gradingSystem: "",
      creditRatio: ""
    });
    setError("");
    setSuccess("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (modalMode === "create") {
        await api.post("/countries", formData);
        setSuccess("Country created successfully!");
      } else if (modalMode === "edit") {
        await api.put(`/countries/${selectedCountry.id}`, formData);
        setSuccess("Country updated successfully!");
      }

      setTimeout(() => {
        handleCloseModal();
        fetchCountries();
      }, 1500);
    } catch (error) {
      console.log("Full error:", error);

      if (error.response?.data?.errorsList && Array.isArray(error.response.data.errorsList)) {
        setError("Validation errors: " + error.response.data.errorsList.join(", "));
      } else {
        setError(error.response?.data?.message || "Operation failed");
      }

      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!countryToDelete) return;

    try {
      setIsLoading(true);
      await api.delete(`/countries/${countryToDelete.id}`);
      setSuccess("Country deleted successfully!");
      fetchCountries();
      setTimeout(() => setSuccess(""), 3000);

      setShowDeleteModal(false);
      setCountryToDelete(null);
    } catch (error) {
      if (error.response?.data?.errorsList && Array.isArray(error.response.data.errorsList)) {
        setError("Delete failed: " + error.response.data.errorsList.join(", "));
      } else {
        setError(error.response?.data?.message || "Delete failed");
      }
      setTimeout(() => setError(""), 3000);
      console.error("Error deleting country:", error);

      setShowDeleteModal(false);
      setCountryToDelete(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (country) => {
    setCountryToDelete(country);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCountryToDelete(null);
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Countries Management</h3>
        <Button variant="secondary" onClick={() => handleShowModal("create")}>
          <BsPlus className="me-2" />
          Add Country
        </Button>
      </div>

      {isLoading && !showModal ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <Table striped bordered hover responsive className="text-center">
          <thead className="table-secondary">
            <tr>
              <th>ID</th>
              <th>Country Name</th>
              <th>Years Schooling</th>
              <th>Grading System</th>
              <th>Credit Ratio</th>
              <th className="w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {countries && countries.length > 0 ? (
              countries.map((country) => (
                <tr key={country.id}>
                  <td>{country.id}</td>
                  <td>{country.name}</td>
                  <td>{country.yearsCompulsorySchooling}</td>
                  <td>{country.gradingSystem}</td>
                  <td>{country.creditRatio}</td>
                  <td className="text-nowrap w-20">
                    <div className="d-flex gap-2 justify-content-center">
                      <Button variant="info" size="sm" onClick={() => handleShowPrograms(country)}>
                        <BsEye />
                      </Button>
                      <Button variant="warning" size="sm" onClick={() => handleShowModal("edit", country)}>
                        <BsPencilSquare />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteClick(country)}>
                        <BsTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  {isLoading ? "Loading..." : "No countries found"}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* Page Size */}
      <div className="mt-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <div className="text-muted order-2 order-md-1 text-center text-md-start">
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} countries
          </div>

          <div className="order-1 order-md-2 d-flex flex-column flex-md-row align-items-center gap-3">
            {/* Page Size Selector */}
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Show:</span>
              <Form.Select
                size="sm"
                value={pageSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  setPageSize(newSize);
                  setCurrentPage(0);
                }}
                className="page-select"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </Form.Select>
              <span className="text-muted small">per page</span>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mb-0 flex-wrap justify-content-center" size="sm">
                <Pagination.First onClick={() => fetchCountries(0)} disabled={currentPage === 0} />
                <Pagination.Prev onClick={() => fetchCountries(currentPage - 1)} disabled={currentPage === 0} />

                {(() => {
                  const maxVisible = 5;
                  const start = Math.max(0, Math.min(currentPage - 2, totalPages - maxVisible));
                  const end = Math.min(start + maxVisible, totalPages);

                  return [...Array(end - start)].map((_, index) => {
                    const pageIndex = start + index;
                    return (
                      <Pagination.Item key={pageIndex} active={pageIndex === currentPage} onClick={() => fetchCountries(pageIndex)}>
                        {pageIndex + 1}
                      </Pagination.Item>
                    );
                  });
                })()}

                <Pagination.Next onClick={() => fetchCountries(currentPage + 1)} disabled={currentPage === totalPages - 1} />
                <Pagination.Last onClick={() => fetchCountries(totalPages - 1)} disabled={currentPage === totalPages - 1} />
              </Pagination>
            )}
          </div>
        </div>
      </div>

      {/* Country Form Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === "create" ? "Add New Country" : modalMode === "edit" ? "Edit Country" : "View Country"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Years of Compulsory Schooling</Form.Label>
                  <Form.Select
                    name="yearsCompulsorySchooling"
                    value={formData.yearsCompulsorySchooling}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    required
                  >
                    <option value="">Select Years</option>
                    <option value="12">12 years</option>
                    <option value="13">13 years</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Grading System</Form.Label>
                  <Form.Control
                    type="text"
                    name="gradingSystem"
                    value={formData.gradingSystem}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    placeholder="e.g., 18-30 or F-A"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Credit Ratio</Form.Label>
                  <Form.Control
                    type="text"
                    name="creditRatio"
                    value={formData.creditRatio}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    placeholder="e.g., 25/30"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseModal}>
            Close
          </Button>
          {modalMode !== "view" && (
            <Button variant="secondary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : modalMode === "create" ? "Create" : "Update"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Bachelor Programs Modal */}
      <Modal show={showProgramsModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Bachelor Programs - {selectedCountry?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Duration (Years)</th>
                <th>Credits Per Year</th>
                <th>Total Credits</th>
                <th>EQF Level</th>
                <th>Special Program</th>
                <th>Official Denomination</th>
              </tr>
            </thead>
            <tbody>
              {bachelorPrograms.map((program) => (
                <tr key={program.id}>
                  <td>{program.duration}</td>
                  <td>{program.creditsPerYear}</td>
                  <td>{program.totalCredits}</td>
                  <td>{program.eqfLevel}</td>
                  <td>{program.isSpecialProgram ? <Badge bg="warning">Special</Badge> : <Badge bg="secondary">Standard</Badge>}</td>
                  <td>{program.officialDenomination}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={cancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <BsExclamationTriangle className="text-danger me-2" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the country <strong>"{countryToDelete?.name}"</strong>?
          </p>
          <div className="text-muted mt-2">
            <small>
              <BsExclamationTriangle className="me-1" />
              This action cannot be undone. All associated data will be permanently removed.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isLoading}>
            <BsTrash className="me-2" />
            {isLoading ? "Deleting..." : "Yes, Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CountriesManagement;
