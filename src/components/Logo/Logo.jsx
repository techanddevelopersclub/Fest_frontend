import { Link } from "react-router-dom";
import styles from "./logo.module.css";

const Logo = ({ className, light = true }) => {
  return (
    <Link
        to="/"
        className={styles.logo + " " + className}
        style={{
          color: light ? "white" : "var(--color-primary-500)",
        }}
      >
      cieszyc
    </Link>
  );
};

export default Logo;
