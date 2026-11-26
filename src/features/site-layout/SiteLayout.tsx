import { Outlet } from "react-router";
import { SiteHeader } from "./components/SiteHeader/SiteHeader";

export const SiteLayout = () => {
  return (
    <div>
      <SiteHeader />
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  );
};
