import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Key, Building2, Send } from 'lucide-react';
import { SplitLayout } from '../components/SplitLayout';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';

export function AdminStep2() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Admin Request Submitted!');
  };

  return (
    <SplitLayout
      imageSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
      imageOverlayClass="bg-gradient-to-t from-slate-900/95 to-slate-900/50"
      title="Admin Portal Access"
      subtitle="Monitor platform performance, manage user roles, and oversee internship placements with advanced analytics tools."
      badge={
        <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-400 border border-emerald-500/30">
          <div className="mr-2 h-2 w-2 rounded-full bg-emerald-400"></div>
          <span className="text-xs font-bold tracking-wider uppercase">System Oversight</span>
        </div>
      }
    >
      <div className="mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#137fec] text-white mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Request Admin Access</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your credentials to request oversight permissions.{' '}
          <Link to="/login" className="font-bold text-[#137fec] hover:text-[#137fec]/80 transition-colors">
            Back to Login
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full Name"
          placeholder="Name Administrator"
          icon={User}
        />

        <Input
          label="Official Admin Email"
          type="email"
          placeholder="admin@organization.com"
          icon={Mail}
          helperText="Please use your organizational email address."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Department"
            icon={Building2}
            options={[
              { value: '', label: 'Select Dept' },
              { value: 'hr', label: 'Human Resources' },
              { value: 'it', label: 'IT & Security' },
              { value: 'ops', label: 'Operations' },
            ]}
          />
          <Input
            label="Access Code"
            placeholder="X8-9902"
            icon={Key}
          />
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900">Verification Required</h4>
              <p className="mt-1 text-sm text-blue-700">
                Your request will be manually reviewed. Verification status will be sent to your official email within 24 hours.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex h-6 items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded border-slate-300 text-[#137fec] focus:ring-[#137fec] bg-slate-50"
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label htmlFor="terms" className="font-medium text-slate-700">
              I confirm I am an authorized administrator and agree to the <a href="#" className="font-bold text-[#137fec] hover:text-[#137fec]/80">Privacy Policy</a>.
            </label>
          </div>
        </div>

        <Button type="submit" variant="secondary" className="w-full" icon={Send}>
          Submit Request
        </Button>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#f6f7f8] px-2 text-xs text-slate-400 uppercase tracking-widest font-medium">
                Internal Use Only
              </span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            Protected by AdminShield v2.4 • IP Logged
          </p>
        </div>
      </form>
    </SplitLayout>
  );
}
