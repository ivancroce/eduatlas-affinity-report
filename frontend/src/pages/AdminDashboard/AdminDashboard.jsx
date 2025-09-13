import { useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import UsersManagement from "../../components/UsersManagement/UsersManagement";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div>
      <h1 className="mb-4">Admin Dashboard</h1>
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="users" title="Users Management">
          <UsersManagement />
        </Tab>
        <Tab eventKey="countries" title="Countries Management">
          <div>Countries management coming soon...</div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
