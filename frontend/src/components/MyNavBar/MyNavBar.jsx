import { Navbar, Container, Image, Button, Nav, NavDropdown, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { BsGear, BsArrowRightSquare, BsHouseDoor, BsExclamationTriangle } from "react-icons/bs";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import westcliffLogo from "../../../assets/images/logo.png";
import westcliffMinLogo from "../../../assets/images/min-logo.png";
import eduAtlasBigLogo from "../../../assets/images/eduatlas-big-logo.png";
import "./MyNavBar.scss";

const MyNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check token-role
  const checkUserRole = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);

      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("accessToken");
        return null;
      }
      return decoded.role;
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("accessToken");
      return null;
    }
  };

  // To update the navbar after the login (no refresh)
  useEffect(() => {
    const role = checkUserRole();
    setUserRole(role);
    setIsLoading(false);

    // Logout from other tabs
    const handleStorageChange = () => {
      const newRole = checkUserRole();
      setUserRole(newRole);
    };

    const handleUserLogin = () => {
      const newRole = checkUserRole();
      setUserRole(newRole);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userLoggedIn", handleUserLogin);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLoggedIn", handleUserLogin);
    };
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("accessToken");
    setUserRole(null);
    setShowLogoutModal(false);
    navigate("/");

    // Notify other components about user logout
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  if (isLoading) {
    return (
      <Navbar bg="primary">
        <Container>
          <Navbar.Brand className="d-flex align-items-center" onClick={() => navigate("/")}>
            <Image src={westcliffLogo} height="60" className="me-3 d-none d-sm-inline-block" alt="Westcliff University" />
            <Image src={westcliffMinLogo} height="60" className="me-3 d-inline-block d-sm-none" alt="Westcliff University" />
            <Image src={eduAtlasBigLogo} height="40" className="me-3" alt="EduAtlas" />
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand className="navbar-westcliff d-flex align-items-center" onClick={() => navigate("/")}>
            <Image src={westcliffLogo} height="60" className="me-3 d-none d-sm-inline-block" alt="Westcliff University" />
            <Image src={westcliffMinLogo} height="60" className="me-3 d-inline-block d-sm-none" alt="Westcliff University" />
            <Image src={eduAtlasBigLogo} height="40" className="me-3" alt="EduAtlas" />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => navigate("/")} className={`d-flex align-items-center ${location.pathname === "/" ? "active" : ""}`}>
                <BsHouseDoor size={20} className="me-1" />
                Home
              </Nav.Link>
              {userRole && (
                <NavDropdown
                  title={
                    <span className="text-light">
                      <BsGear className="me-2" />
                      {userRole === "ADMIN" ? "Admin" : "Student"}
                    </span>
                  }
                  align="end"
                >
                  {userRole === "ADMIN" && (
                    <NavDropdown.Item onClick={() => navigate("/admin-dashboard")}>
                      <BsGear className="me-2" />
                      Backoffice
                    </NavDropdown.Item>
                  )}

                  {userRole === "STUDENT" && (
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
          {userRole === "ADMIN" && (
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
