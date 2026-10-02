import { useState } from 'react';
import { Link } from '@tanstack/react-router';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'project', label: 'Project' },
  { id: 'security', label: 'Security' },
  { id: 'modules', label: 'Modules' },
  { id: 'backups', label: 'Backups' },
  { id: 'data', label: 'Data' },
  { id: 'legal', label: 'Legal' },
] as const;

function SafeLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return <Link to={to as any} className={className}>{children}</Link>;
}

export function SettingsPage() {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('account');
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <div className="flex gap-2 border-b mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 text-sm ${tab === t.id ? 'border-b-2 border-primary-600 font-medium' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-500">
        {tab === 'account' && <p><SafeLink to="/settings/profile" className="text-primary-600">Profile</SafeLink> · <SafeLink to="/settings/billing" className="text-primary-600">Billing</SafeLink></p>}
        {tab === 'project' && <p>Project name, default module, default language.</p>}
        {tab === 'security' && <p><SafeLink to="/settings/2fa" className="text-primary-600">Two-factor</SafeLink> · <SafeLink to="/settings/devices" className="text-primary-600">Devices</SafeLink> · <SafeLink to="/settings/telemetry" className="text-primary-600">Telemetry</SafeLink></p>}
        {tab === 'modules' && <p><SafeLink to="/modules" className="text-primary-600">Installed modules</SafeLink> · <SafeLink to="/modules/browse" className="text-primary-600">Browse marketplace</SafeLink> · <SafeLink to="/modules/install" className="text-primary-600">Install from manifest</SafeLink></p>}
        {tab === 'backups' && <p><SafeLink to="/backup" className="text-primary-600">Backup history</SafeLink></p>}
        {tab === 'data' && <p><SafeLink to="/data-export" className="text-primary-600">Export data</SafeLink> · <SafeLink to="/data-quality" className="text-primary-600">Data quality</SafeLink> · <SafeLink to="/schema" className="text-primary-600">Schema viewer</SafeLink></p>}
        {tab === 'legal' && <p><SafeLink to="/legal" className="text-primary-600">Legal</SafeLink> · <SafeLink to="/release-notes" className="text-primary-600">What's new</SafeLink></p>}
      </div>
    </div>
  );
}
