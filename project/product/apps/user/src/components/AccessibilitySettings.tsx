import { useState, useEffect } from 'react';

type Mode = 'default' | 'high-contrast' | 'large-text' | 'screen-reader';

export function AccessibilitySettings() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('a11y') as Mode) ?? 'default');

  useEffect(() => {
    localStorage.setItem('a11y', mode);
    document.body.className = document.body.className.replace(/a11y-\w+/g, '').trim();
    document.body.classList.add(`a11y-${mode}`);
  }, [mode]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Accessibility</h2>
      <div className="bg-white rounded border p-4 space-y-3">
        {(['default', 'high-contrast', 'large-text', 'screen-reader'] as const).map((m) => (
          <label key={m} className="flex items-center gap-3">
            <input type="radio" name="a11y" value={m} checked={mode === m} onChange={() => setMode(m)} />
            <span className="capitalize">{m.replace('-', ' ')}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
