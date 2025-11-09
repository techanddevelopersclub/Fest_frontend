import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAdmin, selectIsPaymentVerifier } from "../redux/auth/authSlice";
import { AiFillHome } from "react-icons/ai";
import { RiOrganizationChart } from "react-icons/ri";
import { FaUsers, FaRegHandshake } from "react-icons/fa";
import { MdKey, MdLocationPin } from "react-icons/md";
import { ImLab } from "react-icons/im";
import { PiFlagBannerFill } from "react-icons/pi";
import { BsFillGiftFill } from "react-icons/bs";
import { IoMdNotifications } from "react-icons/io";
import { MdPayment } from "react-icons/md";

const AdminSidebarContext = createContext();

export const useAdminSidebar = () => useContext(AdminSidebarContext);

// Define all available links outside component to avoid recreating on each render
const ALL_LINKS = [
  {
    text: "Home",
    path: import.meta.env.VITE_FRONTEND_URL,
    icon: <AiFillHome />,
    external: true,
    roles: ["admin", "paymentVerifier"], // All admin area users can see Home
  },
  {
    text: "Dashboard",
    path: "/admin",
    icon: <AiFillHome />,
    roles: ["admin", "paymentVerifier"], // All admin area users can see Dashboard
  },
  {
    text: "Users",
    path: "/admin/users",
    icon: <FaUsers />,
    roles: ["admin"], // Only admins can see Users
    sublinks: [
      {
        text: "Add User",
        path: "/admin/users/create",
      },
    ],
  },
  {
    text: "Organisations",
    path: "/admin/organisations",
    icon: <RiOrganizationChart />,
    roles: ["admin"], // Only admins
    sublinks: [
      {
        text: "Create",
        path: "/admin/organisations/create",
      },
    ],
  },
  {
    text: "Sponsors",
    path: "/admin/sponsors",
    icon: <FaRegHandshake />,
    roles: ["admin"], // Only admins
    sublinks: [
      {
        text: "Create",
        path: "/admin/sponsors/create",
      },
    ],
  },
  {
    text: "Promotions",
    path: "/admin/promotions",
    icon: <BsFillGiftFill />,
    roles: ["admin"], // Only admins
    sublinks: [
      {
        text: "Create",
        path: "/admin/promotions/create",
      },
    ],
  },
  {
    text: "Location",
    path: "/admin/location",
    icon: <MdLocationPin />,
    roles: ["admin"], // Only admins
    sublinks: [
      {
        text: "Create",
        path: "/admin/location/markers/create",
      },
    ],
  },
  {
    text: "Permissions",
    path: "/admin/permissions",
    icon: <MdKey />,
    roles: ["admin"], // Only admins
  },
  {
    text: "Feature Flags",
    path: "/admin/features",
    icon: <ImLab />,
    roles: ["admin"], // Only admins
  },
  {
    text: "Banners",
    path: "/admin/banners",
    icon: <PiFlagBannerFill />,
    roles: ["admin"], // Only admins
    sublinks: [
      {
        text: "Create",
        path: "/admin/banners/create",
      },
    ],
  },
  {
    text: "Notifications",
    path: "/admin/notifications",
    icon: <IoMdNotifications />,
    roles: ["admin"], // Only admins
  },
  {
    text: "Payment Verification",
    path: "/admin/payments/verify",
    icon: <MdPayment />,
    roles: ["admin", "paymentVerifier"], // Both admins and payment verifiers
  },
];

const AdminSidebarProvider = ({ children }) => {
  const location = useLocation();
  const isAdmin = useSelector(selectIsAdmin);
  const isPaymentVerifier = useSelector(selectIsPaymentVerifier);

  // Filter links based on user role
  const filteredLinks = useMemo(() => {
    const userRole = isAdmin ? "admin" : isPaymentVerifier ? "paymentVerifier" : null;
    
    if (!userRole) {
      // If no role, return empty (shouldn't happen due to RequireAdmin)
      return [];
    }

    return ALL_LINKS.filter(link => {
      // If link has no roles specified, only admins can see it (backward compatibility)
      if (!link.roles || link.roles.length === 0) {
        return isAdmin;
      }
      // Otherwise, check if user's role is in the allowed roles
      return link.roles.includes(userRole);
    });
  }, [isAdmin, isPaymentVerifier]);

  // Add active state to links based on current location
  const links = useMemo(() => {
    return filteredLinks.map((link) => {
      if (link.sublinks) {
        let hasSublinkActive = false;
        const newSublinks = link.sublinks.map((sublink) => {
          if (sublink.path === location.pathname) {
            hasSublinkActive = true;
            return { ...sublink, active: true };
          }
          return { ...sublink, active: false };
        });
        if (hasSublinkActive || link.path === location.pathname) {
          return { ...link, active: true, sublinks: newSublinks };
        }
        return { ...link, active: false, sublinks: newSublinks };
      }
      if (link.path === location.pathname) {
        return { ...link, active: true };
      }
      return { ...link, active: false };
    });
  }, [filteredLinks, location.pathname]);

  const activeLink = useMemo(() => {
    return location.pathname;
  }, [location.pathname]);

  const value = useMemo(() => ({
    links,
    activeLink,
  }), [links, activeLink]);

  // Debug logging
  console.log("🔍 AdminSidebar - isAdmin:", isAdmin, "isPaymentVerifier:", isPaymentVerifier);
  console.log("🔍 AdminSidebar - filtered links:", links.map(l => l.text));

  return (
    <AdminSidebarContext.Provider value={value}>
      {children}
    </AdminSidebarContext.Provider>
  );
};

export default AdminSidebarProvider;
