import { Outlet } from "react-router";
import { SiteHeader } from "./components/SiteHeader/SiteHeader";
import styles from "./SiteLayout.module.css";

export const SiteLayout = () => {
  return (
    <div>
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};
