import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { selectIsLoggedIn, selectIsAdmin, selectIsPaymentVerifier, selectUser } from "../../../state/redux/auth/authSlice";
import { useSelector } from "react-redux";
import LoginForm from "./LoginForm";
import FixedBackdrop from "../../../components/FixedBackdrop/FixedBackdrop";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAdmin = useSelector(selectIsAdmin);
  const isPaymentVerifier = useSelector(selectIsPaymentVerifier);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (isLoggedIn) {
      // If there's a redirect location in state, use it
      if (location.state?.from) {
        navigate(location.state.from, { replace: true });
        return;
      }

      // Redirect admins and paymentVerifiers to admin dashboard
      if (isAdmin || isPaymentVerifier || user?.role === "admin" || user?.role === "paymentVerifier") {
        navigate("/admin/", { replace: true });
        return;
      }

      // Default redirect for other users
      navigate("/events", { replace: true });
    }
  }, [isLoggedIn, isAdmin, isPaymentVerifier, user?.role, navigate, location]);

  return (
    <FixedBackdrop>
      <LoginForm />
    </FixedBackdrop>
  );
};

export default Login;
