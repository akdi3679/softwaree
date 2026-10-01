# TASK ID: ADMIN-009.1
# TITLE: Add React Query hooks for projects
# STATUS: pending
# DEPENDENCIES: ADMIN-008.5
# ALLOWED FILES: product/apps/admin/src/hooks/useProjects.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add TanStack Query hooks for project operations.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useProjects.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface LocalProject {
  project_id: string;
  name: string;
  business_type: string;
  state: string;
}

export function useLocalProjects() {
  return useQuery({
    queryKey: ['projects', 'local'],
    queryFn: async () => {
      return await invoke<LocalProject[]>('list_local_projects');
    },
  });
}

export function useOpenProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      return await invoke<LocalProject>('open_project', { projectId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      adminLastName: string;
      businessType: string;
      businessName: string;
    }) => {
      return await invoke<LocalProject>('create_project', {
        name: input.name,
        adminLastName: input.adminLastName,
        businessType: input.businessType,
        businessName: input.businessName,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/hooks/useProjects.ts || { echo "FAIL"; exit 1; }
grep -q "useQuery" apps/admin/src/hooks/useProjects.ts || { echo "FAIL"; exit 1; }
grep -q "useMutation" apps/admin/src/hooks/useProjects.ts || { echo "FAIL: no mutation"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
