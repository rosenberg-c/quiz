import { Link, NavLink } from "react-router";
import { ThemeSelector } from "../../../theme/ThemeSelector";
import { navigation } from "../../content/navigation";
import { siteHeaderContent } from "./SiteHeader.content";
import { paths } from "../../../../routes";

export const SiteHeader = () => {
  return (
    <header>
      <Link to={paths.home}>{siteHeaderContent.brand}</Link>
      <nav aria-label={siteHeaderContent.navigationLabel}>
        {navigation.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === paths.home}
            className={({ isActive }) =>
              isActive ? "site-nav__link active" : "site-nav__link"
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <ThemeSelector />
    </header>
  );
};
