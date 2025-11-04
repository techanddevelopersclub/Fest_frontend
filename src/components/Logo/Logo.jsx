import styles from "./logo.module.css";

const Logo = ({ className, light = true }) => {
  return (
    <a
        href={import.meta.env.VITE_FRONTEND_URL}
        className={styles.logo + " " + className}
        style={{
          color: light ? "white" : "var(--color-primary-500)",
        }}
      >
      cieszyc
    </a>
  );
};

export default Logo;
