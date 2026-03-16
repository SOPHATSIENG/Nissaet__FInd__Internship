export function ApplicationsTab({ applications }: { applications: any[] }) {
  if (!applications.length) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500 font-medium">
        You haven’t applied to any internships yet. Apply to options from the internships page.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{app.title}</h3>
              <p className="text-sm text-gray-600">{app.company_name} • {app.location || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">Status: <span className={`font-semibold ${app.status === 'accepted' ? 'text-green-600' : app.status === 'rejected' ? 'text-red-600' : 'text-indigo-600'}`}>{app.status}</span></p>
            </div>
            <div className="text-right text-xs text-gray-400">Applied on {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
