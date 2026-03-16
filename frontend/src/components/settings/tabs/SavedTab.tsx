import {Bookmark} from 'lucide-react';

type SavedTabProps = {
  savedInternships: any[];
  onUnsaved: (internshipId: number) => void;
};

export function SavedTab({ savedInternships, onUnsaved }: SavedTabProps) {
  if (!savedInternships.length) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500 font-medium">
        You haven’t saved any internships yet. Browse internships and save your favorites.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedInternships.map((item) => (
        <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.company_name} • {item.location}</p>
            <p className="text-sm text-gray-500">{item.work_mode} • {item.salary_min || item.salary_type || 'N/A'}</p>
          </div>
          <button
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            onClick={() => onUnsaved(item.id)}
          >
            <Bookmark className="w-4 h-4" /> Unsave
          </button>
        </div>
      ))}
    </div>
  );
}
