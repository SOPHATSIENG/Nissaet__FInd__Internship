import React from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  ExternalLink, 
  Download,
  ShieldCheck,
  Bell,
  Building2,
  Lock
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Billing() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Company Profile', icon: Building2, path: '/company/settings' },
    { name: 'Security & Login', icon: Lock, path: '/company/security' },
    { name: 'Notifications', icon: Bell, path: '/company/notifications' },
    { name: 'Billing', icon: CreditCard, path: '/company/billing' },
  ];
  const history = [
    { date: 'Oct 14, 2024', desc: 'Premium Plan - Monthly', amount: '$49.00', status: 'Paid' },
    { date: 'Sep 14, 2024', desc: 'Premium Plan - Monthly', amount: '$49.00', status: 'Paid' },
    { date: 'Aug 14, 2024', desc: 'Premium Plan - Monthly', amount: '$49.00', status: 'Paid' },
    { date: 'Jul 14, 2024', desc: 'Premium Plan - Monthly', amount: '$49.00', status: 'Paid' },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Billing & Subscription</h1>
          <p className="text-slate-500 mt-1">Manage your subscription plan, payment methods, and view billing history.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-green-200">
            <CheckCircle2 size={14} className="mr-1" />
            Verified Account
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Current Plan</h2>
                <p className="text-sm text-slate-500 mt-1">You are currently on the <span className="font-semibold text-primary">Premium Plan</span>.</p>
              </div>
              <span className="inline-flex items-center rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Active
              </span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[
                  { label: 'Billing Cycle', value: 'Monthly' },
                  { label: 'Next Payment', value: 'Nov 14, 2024' },
                  { label: 'Amount', value: '$49.00' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-16 bg-white rounded border border-slate-200 flex items-center justify-center">
                    <CreditCard size={24} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">ABA Bank •••• 4242</p>
                    <p className="text-xs text-slate-500">Expires 12/2025</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                  Update Method
                </button>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all">
                  Cancel Subscription
                </button>
                <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-all">
                  Change Plan
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Billing History</h2>
                <p className="text-sm text-slate-500 mt-1">View and download your past invoices.</p>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                <Download size={18} />
                Download All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.desc}</td>
                      <td className="px-6 py-4">{item.amount}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a className="text-primary hover:text-primary-dark font-medium inline-flex items-center gap-1" href="#">
                          PDF
                          <ExternalLink size={14} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-center">
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">View All History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
