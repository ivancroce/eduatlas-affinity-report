import { useCallback, useEffect, useState } from "react";
import { Table, Button, Modal, Form, Alert, Badge, Row, Col, Pagination, Image } from "react-bootstrap";
import { BsPencilSquare, BsTrash, BsPlus, BsEye, BsExclamationTriangle } from "react-icons/bs";
import api from "../../api/axios";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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
  const [userToDelete, setUserToDelete] = useState(null);

  const [filters, setFilters] = useState({
    role: "",
    search: ""
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    role: "",
    password: ""
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchUsers = useCallback(
    async (page = 0) => {
      try {
        setIsLoading(true);
        const hasFilters = filters.role || debouncedSearch;

        let url;
        if (hasFilters) {
          url = `/users/search?page=${page}&size=${pageSize}&sort=firstName&direction=asc`;
          if (filters.role) url += `&role=${filters.role}`;
          if (debouncedSearch) url += `&search=${debouncedSearch}`;
        } else {
          url = `/users?page=${page}&size=${pageSize}&sort=firstName&direction=asc`;
        }

        console.log("Fetching URL:", url);
        const response = await api.get(url);
        const pageData = response.data;

        setUsers(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);
        setCurrentPage(pageData.number || 0);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to fetch users: " + (error.response?.data?.message || error.message));
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, filters.role, debouncedSearch]
  );

  useEffect(() => {
    fetchUsers(0);
  }, [fetchUsers]);

  const handleShowModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);

    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        role: user.role || "USER",
        password: ""
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        role: "USER",
        password: ""
      });
    }

    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      role: "",
      password: ""
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
        await api.post("/users", formData);
        setSuccess("User created successfully!");
      } else if (modalMode === "edit") {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await api.put(`/users/${selectedUser.id}`, updateData);
        setSuccess("User updated successfully!");
      }

      setTimeout(() => {
        handleCloseModal();
        fetchUsers(currentPage);
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
    if (!userToDelete) return;

    try {
      setIsLoading(true);
      await api.delete(`/users/${userToDelete.id}`);
      setSuccess("User deleted successfully!");
      fetchUsers(currentPage);
      setTimeout(() => setSuccess(""), 3000);

      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      if (error.response?.data?.errorsList && Array.isArray(error.response.data.errorsList)) {
        setError("Delete failed: " + error.response.data.errorsList.join(", "));
      } else {
        setError(error.response?.data?.message || "Delete failed");
      }
      setTimeout(() => setError(""), 3000);
      console.error("Error deleting user:", error);

      setShowDeleteModal(false);
      setUserToDelete(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "danger";
      case "USER":
        return "primary";
      case "STUDENT":
        return "info";
      default:
        return "secondary";
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(0);
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Users Management</h3>
        <Button variant="secondary" onClick={() => handleShowModal("create")}>
          <BsPlus className="me-2" />
          Add User
        </Button>
      </div>
      <div className="mb-3">
        <Row className="g-3">
          <Col md={3}>
            <Form.Control
              type="text"
              placeholder="Search by name, username, or email"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              size="sm"
            />
          </Col>

          <Col md={2}>
            <Form.Select value={filters.role} onChange={(e) => handleFilterChange("role", e.target.value)} size="sm">
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
              <option value="STUDENT">Student</option>
            </Form.Select>
          </Col>

          <Col md={2}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                setFilters({ role: "", search: "" });
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
              <th>Name</th>
              <th>Surname</th>
              <th>Email</th>
              <th>Role</th>
              <th>Avatar</th>
              <th className="w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <Badge bg={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  </td>
                  <td>{user.avatarUrl && <Image src={user.avatarUrl} alt="Avatar" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />}</td>
                  <td className="text-nowrap w-20">
                    <div className="d-flex gap-2 justify-content-center">
                      <Button variant="info" size="sm" className="me-2" onClick={() => handleShowModal("view", user)}>
                        <BsEye />
                      </Button>
                      <Button variant="warning" size="sm" className="me-2" onClick={() => handleShowModal("edit", user)}>
                        <BsPencilSquare />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteClick(user)}>
                        <BsTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  {isLoading ? "Loading..." : "No users found"}
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
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} users
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
                <Pagination.First onClick={() => fetchUsers(0)} disabled={currentPage === 0} />
                <Pagination.Prev onClick={() => fetchUsers(currentPage - 1)} disabled={currentPage === 0} />

                {(() => {
                  const maxVisible = 5;
                  const start = Math.max(0, Math.min(currentPage - 2, totalPages - maxVisible));
                  const end = Math.min(start + maxVisible, totalPages);

                  return [...Array(end - start)].map((_, index) => {
                    const pageIndex = start + index;
                    return (
                      <Pagination.Item key={pageIndex} active={pageIndex === currentPage} onClick={() => fetchUsers(pageIndex)}>
                        {pageIndex + 1}
                      </Pagination.Item>
                    );
                  });
                })()}

                <Pagination.Next onClick={() => fetchUsers(currentPage + 1)} disabled={currentPage === totalPages - 1} />
                <Pagination.Last onClick={() => fetchUsers(totalPages - 1)} disabled={currentPage === totalPages - 1} />
              </Pagination>
            )}
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === "create" ? "Add New User" : modalMode === "edit" ? "Edit User" : "View User"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select name="role" value={formData.role} onChange={handleInputChange} disabled={modalMode === "view" || isLoading} required>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="STUDENT">Student</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password {modalMode === "edit" && "(leave empty to keep current)"}</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={modalMode === "view" || isLoading}
                    required={modalMode === "create"}
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
            Are you sure you want to delete user{" "}
            <strong>
              "{userToDelete?.firstName} {userToDelete?.lastName}"
            </strong>
            ?
          </p>
          <div className="text-muted mt-2">
            <small>
              <BsExclamationTriangle className="me-1" />
              This action cannot be undone. All associated data will be permanently removed.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={cancelDelete} disabled={isLoading}>
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

export default UserManagement;
