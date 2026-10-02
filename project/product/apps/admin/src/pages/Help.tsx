import { useState } from 'react';
import { useHelpArticles } from '../hooks/useHelp';

export function HelpPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: articles } = useHelpArticles(category);

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-semibold mb-4">Help</h2>
      <div className="flex gap-2 mb-4">
        <CatButton label="All" value={undefined} current={category} onClick={setCategory} />
        <CatButton label="Users" value="users" current={category} onClick={setCategory} />
        <CatButton label="Backup" value="backup" current={category} onClick={setCategory} />
        <CatButton label="Modules" value="modules" current={category} onClick={setCategory} />
        <CatButton label="Audit" value="audit" current={category} onClick={setCategory} />
      </div>
      <div className="space-y-4">
        {(articles ?? []).map((a) => (
          <div key={a.id} className="bg-white rounded border p-4">
            <h3 className="font-medium mb-2">{a.title}</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{a.body}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatButton({ label, value, current, onClick }: { label: string; value: string | undefined; current: string | undefined; onClick: (v: string | undefined) => void }) {
  return (
    <button onClick={() => onClick(value)} className={`px-3 py-1 rounded text-sm ${current === value ? 'bg-primary-600 text-white' : 'bg-white border'}`}>
      {label}
    </button>
  );
}
