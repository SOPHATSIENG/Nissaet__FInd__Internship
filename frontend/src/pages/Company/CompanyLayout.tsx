import { Outlet } from "react-router-dom";
import Navbar from "../../components/company-components/Navbar";

export default function CompanyLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="py-6">
        <Outlet />
      </main>
    </div>
  );
}
