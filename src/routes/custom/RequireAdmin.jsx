import { Outlet, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectIsLoggedIn, selectIsAdmin } from "../../state/redux/auth/authSlice";
import { useAuth } from "../../state/context/Auth";
import Forbidden from "../../pages/Forbidden/Forbidden";
import FullPageLoading from "../../components/FullPageLoading";

const RequireAdmin = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAdmin = useSelector(selectIsAdmin);
  const role = useSelector((state) => state.auth.user?.role);
  const { isLoading } = useAuth();
  const canAccessAdmin = useMemo(() => {
    return isAdmin || role === "paymentVerifier";
  }, [isAdmin, role]);

  if (!isLoggedIn && !isLoading) {
    return (
      <Navigate to="/a/login" state={{ from: window.location.pathname }} />
    );
  }

  if (!canAccessAdmin && !isLoading) {
    return <Forbidden message="You must be an admin or payment verifier to access this page." />;
  }

  return (
    <>
      {isLoading && <FullPageLoading />}
      <Outlet />
    </>
  );
};

export default RequireAdmin;
