import { Link, NavLink } from "react-router";
import { ThemeSelector } from "../../../theme/ThemeSelector";
import { navigation } from "../../content/navigation";
import { siteHeaderContent } from "./SiteHeader.content";
import { paths } from "../../../../routes";
import styles from "./SiteHeader.module.css";

export const SiteHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} to={paths.home}>
          {siteHeaderContent.brand}
        </Link>
        <nav
          className={styles.nav}
          aria-label={siteHeaderContent.navigationLabel}
        >
          {navigation.map(({ to, label }) => {
            const link = (
              <NavLink
                key={to}
                to={to}
                end={to === paths.home}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                {label}
              </NavLink>
            );

            return to === paths.settings ? (
              <div key={to} className={styles.actions}>
                <ThemeSelector />
                {link}
              </div>
            ) : (
              link
            );
          })}
        </nav>
      </div>
    </header>
  );
};
