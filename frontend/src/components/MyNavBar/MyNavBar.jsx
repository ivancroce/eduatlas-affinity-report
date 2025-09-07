import { Navbar, Container, Image } from "react-bootstrap";
import westcliffLogo from "../../../assets/images/logo.png";
import "./MyNavBar.scss";

const MyNavBar = () => {
  return (
    <Navbar bg="primary">
      <Container>
        <Navbar.Brand href="#">
          <Image src={westcliffLogo} height="60" className="me-2" alt="Westcliff University" />
          <span className="text-light fw-bold">EduAtlas</span>
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default MyNavBar;
