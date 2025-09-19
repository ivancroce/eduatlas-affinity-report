import { useCallback, useEffect, useState } from "react";
import { Table, Button, Modal, Form, Alert, Badge, Row, Col, Pagination } from "react-bootstrap";
import { BsPencilSquare, BsTrash, BsPlus, BsEye, BsExclamationTriangle } from "react-icons/bs";
import api from "../../api/axios";

const BachelorProgramsManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, edit, create
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  const [filters, setFilters] = useState({
    countryId: "",
    duration: "",
    isSpecialProgram: ""
  });

  const [formData, setFormData] = useState({
    duration: "",
    creditsPerYear: "",
    eqfLevel: "",
    officialDenomination: "",
    isSpecialProgram: false,
    countryId: ""
  });

  const fetchPrograms = useCallback(
    async (page = 0) => {
      try {
        setIsLoading(true);
        let url = `/bachelor-programs/search?page=${page}&size=${pageSize}&sort=id&direction=asc`;

        if (filters.countryId) url += `&countryId=${filters.countryId}`;
        if (filters.duration) url += `&duration=${filters.duration}`;
        if (filters.isSpecialProgram) url += `&isSpecialProgram=${filters.isSpecialProgram}`;

        const response = await api.get(url);
        console.log("Response Data:", response.data);

        const pageData = response.data;

        setPrograms(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);
        setCurrentPage(pageData.number || 0);
      } catch (error) {
        console.error("Full error object", error);
        setError("Failed to fetch bachelor programs: " + (error.response?.data?.message || error.message));
        setPrograms([]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, filters]
  );

  const fetchCountriesForDropdown = async () => {
    try {
      const response = await api.get("/countries?page=0&size=100&sort=name");
      setCountries(response.data.content || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  useEffect(() => {
    fetchCountriesForDropdown();
  }, []);

  useEffect(() => {
    fetchPrograms(0);
  }, [fetchPrograms]);

  const handleShowModal = (mode, program = null) => {
    setModalMode(mode);
    setSelectedProgram(program);

    if (program) {
      setFormData({
        duration: program.duration || "",
        creditsPerYear: program.creditsPerYear || "",
        eqfLevel: program.eqfLevel || "",
        officialDenomination: program.officialDenomination || "",
        isSpecialProgram: program.isSpecialProgram || false,
        countryId: program.countryId || ""
      });
    } else {
      setFormData({
        duration: "",
        creditsPerYear: "",
        eqfLevel: "",
        officialDenomination: "",
        isSpecialProgram: false,
        countryId: ""
      });
    }
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProgram(null);
    setFormData({
      duration: "",
      creditsPerYear: "",
      eqfLevel: "",
      officialDenomination: "",
      isSpecialProgram: false,
      countryId: ""
    });
    setError("");
    setSuccess("");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const submitData = {
        ...formData,
        duration: parseInt(formData.duration),
        creditsPerYear: parseInt(formData.creditsPerYear),
        eqfLevel: parseInt(formData.eqfLevel),
        countryId: parseInt(formData.countryId)
      };

      if (modalMode === "create") {
        await api.post("/bachelor-programs", submitData);
        setSuccess("Bachelor program created successfully!");
      } else if (modalMode === "edit") {
        await api.put(`/bachelor-programs/${selectedProgram.id}`, submitData);
        setSuccess("Bachelor program updated successfully!");
      }

      setTimeout(() => {
        handleCloseModal();
        fetchPrograms(currentPage);
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
    if (!programToDelete) return;

    try {
      setIsLoading(true);
      await api.delete(`/bachelor-programs/${programToDelete.id}`);
      setSuccess("Bachelor Program deleted successfully!");
      fetchPrograms();
      setTimeout(() => setSuccess(""), 3000);

      setShowDeleteModal(false);
      setProgramToDelete(null);
    } catch (error) {
      if (error.response?.data?.errorsList && Array.isArray(error.response.data.errorsList)) {
        setError("Delete failed: " + error.response.data.errorsList.join(", "));
      } else {
        setError(error.response?.data?.message || "Delete failed");
      }
      setTimeout(() => setError(""), 3000);
      console.error("Error deleting country:", error);

      setShowDeleteModal(false);
      setProgramToDelete(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(0);
  };

  const handleDeleteClick = (program) => {
    setProgramToDelete(program);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProgramToDelete(null);
  };

  const getCountryName = (program) => {
    if (program.country?.name) {
      return program.country.name;
    }
    // Fallback
    const country = countries.find((c) => c.id === program.countryId);
    return country?.name || "Unknown Country";
  };

  const formatDuration = (program) => {
    const countryName = getCountryName(program);

    if (countryName === "Poland" && program.duration === 4 && program.isSpecialProgram) {
      return "3.5";
    }
    return program.duration?.toString() || "";
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Bachelor Programs Management</h3>
        <div className="d-flex gap-3">
          <Button variant="secondary" onClick={() => handleShowModal("create")}>
            <BsPlus className="me-2" />
            Add Program
          </Button>
        </div>
      </div>
      <div className="mb-3">
        <Row>
          <Col md={3} className="mb-2 mb-md-0">
            <Form.Select value={filters.countryId} onChange={(e) => handleFilterChange("countryId", e.target.value)} size="sm">
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3} className="mb-2 mb-md-0">
            <Form.Select value={filters.duration} onChange={(e) => handleFilterChange("duration", e.target.value)} size="sm">
              <option value="">All Durations</option>
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
              <option value="4">4 years</option>
              <option value="5">5 years</option>
            </Form.Select>
          </Col>
          <Col md={3} className="mb-2 mb-md-0">
            <Form.Select value={filters.isSpecialProgram} onChange={(e) => handleFilterChange("isSpecialProgram", e.target.value)} size="sm">
              <option value="">All Programs</option>
              <option value="true">Special Only</option>
              <option value="false">Standard Only</option>
            </Form.Select>
          </Col>
          <Col md={3} className="mb-2 mb-md-0">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                setFilters({ countryId: "", duration: "", isSpecialProgram: "", eqfLevel: "" });
                setCurrentPage(0);
              }}
            >
              Clear
            </Button>
          </Col>
        </Row>
      </div>
      {isLoading && !showModal ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <Table striped bordered hover responsive className="text-center">
          <thead className="table-secondary">
            <tr>
              <th>ID</th>
              <th>Country</th>
              <th>Country ID</th>
              <th>Duration (Years)</th>
              <th>Credits/Year</th>
              <th>Total Credits</th>
              <th>EQF Level</th>
              <th>Special Program</th>
              <th>Official Denomination</th>
              <th className="w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs && programs.length > 0 ? (
              programs.map((program) => (
                <tr key={program.id}>
                  <td>{program.id}</td>
                  <td>{getCountryName(program)}</td>
                  <td>{program.countryId}</td>
                  <td>{formatDuration(program)}</td>
                  <td>{program.creditsPerYear}</td>
                  <td>{program.totalCredits}</td>
                  <td>{program.eqfLevel}</td>
                  <td>{program.isSpecialProgram ? <Badge bg="warning">Special</Badge> : <Badge bg="secondary">Standard</Badge>}</td>
                  <td className="text-truncate" style={{ maxWidth: "200px" }}>
                    {program.officialDenomination}
                  </td>
                  <td className="text-nowrap w-20">
                    <div className="d-flex gap-2 justify-content-center">
                      <Button variant="info" size="sm" onClick={() => handleShowModal("view", program)}>
                        <BsEye />
                      </Button>
                      <Button variant="warning" size="sm" onClick={() => handleShowModal("edit", program)}>
                        <BsPencilSquare />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteClick(program)}>
                        <BsTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  {isLoading ? "Loading..." : "No bachelor programs found"}
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
                <Pagination.First onClick={() => fetchPrograms(0)} disabled={currentPage === 0} />
                <Pagination.Prev onClick={() => fetchPrograms(currentPage - 1)} disabled={currentPage === 0} />

                {(() => {
                  const maxVisible = 5;
                  const start = Math.max(0, Math.min(currentPage - 2, totalPages - maxVisible));
                  const end = Math.min(start + maxVisible, totalPages);

                  return [...Array(end - start)].map((_, index) => {
                    const pageIndex = start + index;
                    return (
                      <Pagination.Item key={pageIndex} active={pageIndex === currentPage} onClick={() => fetchPrograms(pageIndex)}>
                        {pageIndex + 1}
                      </Pagination.Item>
                    );
                  });
                })()}

                <Pagination.Next onClick={() => fetchPrograms(currentPage + 1)} disabled={currentPage === totalPages - 1} />
                <Pagination.Last onClick={() => fetchPrograms(totalPages - 1)} disabled={currentPage === totalPages - 1} />
              </Pagination>
            )}
          </div>
        </div>
      </div>

      {/* Program Form Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "create" ? "Add New Bachelor Program" : modalMode === "edit" ? "Edit Bachelor Program" : "View Bachelor Program"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Select name="countryId" value={formData.countryId} onChange={handleInputChange} disabled={modalMode === "view" || isLoading} required>
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration (Years)</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    min="1"
                    max="5"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Credits Per Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="creditsPerYear"
                    value={formData.creditsPerYear}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    min="30"
                    max="90"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>EQF Level</Form.Label>
                  <Form.Control
                    type="number"
                    name="eqfLevel"
                    value={formData.eqfLevel}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    min="5"
                    max="8"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Official Denomination</Form.Label>
                  <Form.Control
                    type="text"
                    name="officialDenomination"
                    value={formData.officialDenomination}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <Form.Check
                    type="checkbox"
                    name="isSpecialProgram"
                    label="Special Program"
                    checked={formData.isSpecialProgram}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
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
            Are you sure you want to delete the program with ID <strong>"{programToDelete?.id}"</strong>?
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

export default BachelorProgramsManagement;
