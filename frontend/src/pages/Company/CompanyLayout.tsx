import { Outlet } from "react-router-dom";
import Navbar from "../../components/company-components/Navbar";

export default function CompanyLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.28),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(153,246,228,0.2),_transparent_20%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_22%,#f3f7fb_100%)]">
      <Navbar />
      <main className="py-6">
        <Outlet />
      </main>
    </div>
  );
}
