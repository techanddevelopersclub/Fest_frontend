import React from "react";
import styles from "./Sidebar.module.css";
import Logo from "../../../../components/Logo/Logo";
import { useAdminSidebar } from "../../../../state/context/AdminSidebar";
import { Link } from "react-router-dom";
import RequireFeatureFlag from "../../../../components/features/FeatureFlag";

const SidebarLink = ({ link }) => {
  const linkContent = (
    <li key={link.text}>
      {link.external ? (
        <a
          href={link.path}
          className={
            styles.navlink + " " + (link.active ? styles.active : "")
          }
        >
          <span className={styles.icon}>{link.icon}</span>
          <span>{link.text}</span>
        </a>
      ) : (
        <Link
          to={link.path}
          className={
            styles.navlink + " " + (link.active ? styles.active : "")
          }
        >
          <span className={styles.icon}>{link.icon}</span>
          <span>{link.text}</span>
        </Link>
      )}
    </li>
  );

  if (link.featureFlag) {
    return (
      <RequireFeatureFlag name={link.featureFlag}>
        {linkContent}
      </RequireFeatureFlag>
    );
  }

  return linkContent;
};

const Sidebar = () => {
  const { links } = useAdminSidebar();

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <Logo light={false} />
      </div>
      <div className={styles.links}>
        <ul className={styles.navlinks}>
          {links?.map((link) => (
            <React.Fragment key={link.text}>
              <SidebarLink link={link} />
              {link.active && link.sublinks && (
                <ul className={styles.sublinks}>
                  {link.sublinks.map((sublink) => (
                    <li key={sublink.text}>
                      <Link
                        to={sublink.path}
                        className={
                          styles.navlink +
                          " " +
                          (sublink.active ? styles.active : "")
                        }
                      >
                        <span className={styles.icon}>{sublink.icon}</span>
                        <span>{sublink.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
