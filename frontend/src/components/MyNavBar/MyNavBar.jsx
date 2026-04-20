import { Navbar, Container, Image, Button, Nav, NavDropdown, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { BsGear, BsArrowRightSquare, BsHouseDoor, BsExclamationTriangle, BsBoxArrowInRight } from "react-icons/bs";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import westcliffLogo from "../../../assets/images/logo.png";
import westcliffMinLogo from "../../../assets/images/min-logo.png";
import eduAtlasBigLogo from "../../../assets/images/eduatlas-big-logo.png";
import "./MyNavBar.scss";

const MyNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand className="navbar-westcliff d-flex align-items-center" onClick={() => navigate("/")}>
            <Image src={westcliffLogo} height="60" width="auto" className="me-3 d-none d-sm-inline-block" alt="Westcliff University" />
            <Image src={westcliffMinLogo} height="60" width="auto" className="me-3 d-inline-block d-sm-none" alt="Westcliff University" />
            <Image src={eduAtlasBigLogo} height="40" width="auto" className="me-3" alt="EduAtlas" />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => navigate("/")} className={`d-flex align-items-center ${location.pathname === "/" ? "active" : ""}`}>
                <BsHouseDoor size={20} className="me-1" />
                Home
              </Nav.Link>
              {!user ? (
                <Nav.Link
                  onClick={() => navigate("/login")}
                  className={`d-flex align-items-center ${location.pathname === "/login" ? "active" : ""}`}
                >
                  <BsBoxArrowInRight size={20} className="me-1" />
                  Login
                </Nav.Link>
              ) : (
                <NavDropdown
                  title={
                    <span className="text-light">
                      <BsGear className="me-2" />
                      {user.role === "ADMIN" ? "Admin" : "Student"}
                    </span>
                  }
                  align="end"
                >
                  {user.role === "ADMIN" && (
                    <NavDropdown.Item onClick={() => navigate("/admin-dashboard")}>
                      <BsGear className="me-2" />
                      Backoffice
                    </NavDropdown.Item>
                  )}

                  {user.role === "STUDENT" && (
                    <NavDropdown.Item onClick={() => navigate("/student-dashboard")}>
                      <BsHouseDoor className="me-2" />
                      My Dashboard
                    </NavDropdown.Item>
                  )}

                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogoutClick}>
                    <BsArrowRightSquare className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Modal show={showLogoutModal} onHide={cancelLogout} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <BsExclamationTriangle className="text-warning me-2" />
            Confirm Logout
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to log out?
          {user?.role === "ADMIN" && (
            <div className="text-muted mt-2">
              <small>Any unsaved changes in the admin dashboard will be lost.</small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelLogout}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmLogout}>
            <BsArrowRightSquare className="me-2" />
            Yes, Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MyNavBar;
