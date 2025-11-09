import { Outlet, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { 
  selectIsLoggedIn, 
  selectIsAdmin, 
  selectIsPaymentVerifier,
  selectUser 
} from "../../state/redux/auth/authSlice";
import { useAuth } from "../../state/context/Auth";
import Forbidden from "../../pages/Forbidden/Forbidden";
import FullPageLoading from "../../components/FullPageLoading";

const RequireAdmin = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAdmin = useSelector(selectIsAdmin);
  const isPaymentVerifier = useSelector(selectIsPaymentVerifier);
  const user = useSelector(selectUser);
  const { isLoading } = useAuth();
  
  // Check if user can access admin area
  // Use both selector and direct role check as fallback for reliability
  const canAccessAdmin = useMemo(() => {
    if (isAdmin) return true;
    if (isPaymentVerifier) return true;
    // Fallback: check role directly if selectors haven't updated yet
    if (user?.role === "paymentVerifier" || user?.role === "admin") return true;
    return false;
  }, [isAdmin, isPaymentVerifier, user?.role]);

  // Show loading while auth is being checked
  if (isLoading) {
    return <FullPageLoading />;
  }

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return (
      <Navigate to="/a/login" state={{ from: window.location.pathname }} />
    );
  }

  // Show forbidden if user doesn't have admin or paymentVerifier role
  if (!canAccessAdmin) {
    return <Forbidden message="You must be an admin or payment verifier to access this page." />;
  }

  // User has access, render the admin panel
  return <Outlet />;
};

export default RequireAdmin;
