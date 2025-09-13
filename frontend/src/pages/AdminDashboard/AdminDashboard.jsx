import { useState } from "react";
import { Tabs, Tab, Container, Row, Col, Card } from "react-bootstrap";
import { BsGear, BsGlobe, BsPeople } from "react-icons/bs";
import UsersManagement from "../../components/UsersManagement/UsersManagement";
import CountriesManagement from "../../components/CountriesManagement/CountriesManagement";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("countries");

  return (
    <Container fluid="xl" className="py-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <BsGear size={32} className="text-primary me-3" />
            <div>
              <h1 className="mb-1 text-primary">Admin Dashboard</h1>
              <p className="text-muted mb-0">Manage countries and users data</p>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                <Tab
                  eventKey="countries"
                  title={
                    <span>
                      <BsGlobe className="me-2" />
                      Countries Management
                    </span>
                  }
                >
                  <div className="mt-3">
                    <CountriesManagement />
                  </div>
                </Tab>

                <Tab
                  eventKey="users"
                  title={
                    <span>
                      <BsPeople className="me-2" />
                      Users Management
                    </span>
                  }
                >
                  <div className="mt-3">
                    <UsersManagement />
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
