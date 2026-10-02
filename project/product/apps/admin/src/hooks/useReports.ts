import { useMutation } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export function useDownloadReport() {
  return useMutation({
    mutationFn: async (input: { sampleId: string; reportId: string }) => {
      const path = await save({
        defaultPath: `${input.sampleId}-report.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (!path) return;
      const bytes = await invoke<number[]>('generate_lab_report', {
        sampleId: input.sampleId,
        reportId: input.reportId,
      });
      await writeFile(path, new Uint8Array(bytes));
    },
  });
}