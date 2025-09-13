import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, requiredRole }) => {
  const checkAuth = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      return { isAuthenticated: false, userRole: null, error: "No token found" };
    }

    try {
      const decoded = jwtDecode(token);

      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("accessToken");
        return { isAuthenticated: false, userRole: null, error: "Token expired" };
      }

      return {
        isAuthenticated: true,
        userRole: decoded.role,
        error: null
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("accessToken");
      return { isAuthenticated: false, userRole: null, error: "Invalid token" };
    }
  };

  const { isAuthenticated, userRole, error } = checkAuth();

  if (!isAuthenticated) {
    console.log("Access denied:", error);
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log(`Access denied: Required role ${requiredRole}, user has ${userRole}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
