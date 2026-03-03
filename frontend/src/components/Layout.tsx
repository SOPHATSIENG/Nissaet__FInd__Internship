import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Internships', path: '/internships' },
    { name: 'Companies', path: '/companies' },
    { name: 'Career Advice', path: '/career-advice' },
    { name: 'Applicants', path: '/applicants' },
  ];

  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f6f8f7] text-[#111816]">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 text-[#3b82f6]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">NSI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-[#3b82f6] ${
                    isActiveLink(link.path) ? 'text-[#3b82f6] font-bold' : ''
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 pl-6 border-l border-slate-200 text-sm text-gray-600">
                    <button type="button" className="relative p-2 text-slate-400 hover:text-slate-600">
                      <Bell size={20} />
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
                    </button>
                    {/* FIX MARK: added profile text link to open student settings page. */}
                    <Link
                      to="/account-settings"
                      className="text-sm font-medium text-slate-600 hover:text-[#3b82f6]"
                    >
                      Profile
                    </Link>
                    {/* FIX MARK: clicking profile avatar now opens account settings page. */}
                    <Link to="/account-settings" aria-label="Open account settings">
                      <div
                        className="h-10 w-10 rounded-full bg-slate-200 bg-cover bg-center border-2 border-white shadow-sm cursor-pointer"
                        style={{
                          backgroundImage:
                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBLI1bR45Y6JAmbnbqFFJnxJoqIiHDleRmINUc_ReIIWeYTTItJCpsRGsBlWRuUDKbbWylABCmJMfdfz9MVbp-q5FnThYQxo1NV2EV88wub-i_ETRNovuer1mLg4DyXhIuPZ8fSsrbUzpSg_3owxdyKygKHYdpPCCgsOYeQxlYvrkGRbMr1NNkGdjf5urSfgWThpIBBsGji2Eqsy_51VB63rkN-1W2YUS92YqR-0vSXlckb-quy2peo0YHy9ny1G02YSnuZUaArAl4')",
                        }}
                      />
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="bg-gray-100 hover:bg-gray-200 text-[#111816] text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium hover:text-[#3b82f6] transition-colors">
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#111816] text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <button className="md:hidden p-2 text-gray-500">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 text-[#3b82f6]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="font-bold text-lg">InternKhmer</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">Connecting Cambodian students with their future careers.</p>
          </div>

          <div>
            <h3 className="font-bold mb-4">For Students</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="/internships" className="hover:text-[#3b82f6]">
                  Browse Internships
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Job Alerts
                </Link>
              </li>
              <li>
                <Link to="/career-advice" className="hover:text-[#3b82f6]">
                  Career Advice
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">For Employers</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
          © 2024 InternKhmer. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
