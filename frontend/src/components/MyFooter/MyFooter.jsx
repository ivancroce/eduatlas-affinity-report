import { Container } from "react-bootstrap";
import "./MyFooter.scss";

const MyFooter = () => {
  return (
    <footer className="bg-primary text-white text-center p-3">
      <Container>
        <p className="mb-0 footer-title">&copy; 2025 Westcliff University - EduAtlas</p>
      </Container>
    </footer>
  );
};

export default MyFooter;
