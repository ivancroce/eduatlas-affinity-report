import { Navbar, Container, Image, Button, Nav } from "react-bootstrap";
import westcliffLogo from "../../../assets/images/logo.png";
import westcliffMinLogo from "../../../assets/images/min-logo.png";
import eduAtlasBigLogo from "../../../assets/images/eduatlas-big-logo.png";
import "./MyNavBar.scss";
import { useNavigate } from "react-router-dom";
import { BsGear } from "react-icons/bs";

const MyNavBar = () => {
  const navigate = useNavigate();

  return (
    <Navbar bg="primary">
      <Container>
        <Navbar.Brand className="navbar-westcliff d-flex align-items-center" onClick={() => navigate("/")}>
          <Image src={westcliffLogo} height="60" className="me-3 d-none d-sm-inline-block" alt="Westcliff University" />
          <Image src={westcliffMinLogo} height="60" className="me-3 d-inline-block d-sm-none" alt="Westcliff University" />
          <Image src={eduAtlasBigLogo} height="40" className="me-3" alt="EduAtlas" />
        </Navbar.Brand>
        <Nav className="ms-auto">
          <Button variant="outline-light" size="sm" className="" onClick={() => navigate("/login")} title="Admin Login">
            <BsGear size={20} />
          </Button>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default MyNavBar;
