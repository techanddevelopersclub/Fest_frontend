import styles from "./Layout.module.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../../pages/Dashboard/Dashboard";
import UsersIndex from "../../pages/Users";
import OrganisationsIndex from "../../pages/Organisations";
import SponsorsIndex from "../../pages/Sponsors";
import PromotionsIndex from "../../pages/Promotions";
import LocationIndex from "../../pages/Location";
import PermissionsIndex from "../../pages/Permissions";
import FeatureFlagsIndex from "../../pages/FeatureFlags";
import BannersIndex from "../../pages/Banners";
import NotificationsIndex from "../../pages/Notifications";
import PaymentVerification from "../../pages/PaymentVerification";

const Layout = () => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users/*" element={<UsersIndex />} />
          <Route path="/organisations/*" element={<OrganisationsIndex />} />
          <Route path="/sponsors/*" element={<SponsorsIndex />} />
          <Route path="/promotions/*" element={<PromotionsIndex />} />
          <Route path="/location/*" element={<LocationIndex />} />
          <Route path="/permissions/*" element={<PermissionsIndex />} />
          <Route path="/features/*" element={<FeatureFlagsIndex />} />
          <Route path="/banners/*" element={<BannersIndex />} />
          <Route path="/notifications/*" element={<NotificationsIndex />} />
          <Route path="/payments/verify" element={<PaymentVerification />} />
        </Routes>
      </div>
    </div>
  );
};

export default Layout;
