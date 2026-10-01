# TASK ID: ADMIN-009.4
# TITLE: Add Projects page
# STATUS: pending
# DEPENDENCIES: ADMIN-009.3
# ALLOWED FILES: product/apps/admin/src/pages/Projects.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the Projects page — list, open, create new project.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Projects.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLocalProjects, useCreateProject, useOpenProject } from '../hooks/useProjects';

export function ProjectsPage() {
  const { data: projects, isLoading } = useLocalProjects();
  const createProject = useCreateProject();
  const openProject = useOpenProject();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [businessType, setBusinessType] = useState('medical_reception');
  const [businessName, setBusinessName] = useState('');

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Projects</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          New project
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 bg-white rounded border">
          <h3 className="font-medium mb-2">Create project</h3>
          <input
            type="text"
            placeholder="Project name (e.g. Reception 2026)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Your last name (Admin's last name, e.g. Smith)"
            value={adminLastName}
            onChange={(e) => setAdminLastName(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded"
          >
            <option value="medical_reception">Medical reception (1 doctor + N staff)</option>
            <option value="food_lab">Food lab (sample → test → result → report)</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Business name (e.g. Dr. Smith's Family Clinic)"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const project = await createProject.mutateAsync({
                  name, adminLastName, businessType, businessName
                });
                setShowCreate(false);
                setName('');
                setAdminLastName('');
                setBusinessName('');
                navigate({ to: '/projects/$projectId', params: { projectId: project.project_id } });
              }}
              className="px-3 py-1 bg-primary-600 text-white rounded"
            >
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1 border rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded border">
        {(projects ?? []).map((p) => (
          <div key={p.project_id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500">{p.project_id} · {p.state}</div>
            </div>
            <button
              onClick={async () => {
                await openProject.mutateAsync(p.project_id);
                navigate({ to: '/projects/$projectId', params: { projectId: p.project_id } });
              }}
              className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
            >
              Open
            </button>
          </div>
        ))}
        {projects?.length === 0 && (
          <div className="p-6 text-center text-gray-500">No projects yet. Create one above.</div>
        )}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Projects.tsx || { echo "FAIL"; exit 1; }
grep -q "useCreateProject" apps/admin/src/pages/Projects.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
