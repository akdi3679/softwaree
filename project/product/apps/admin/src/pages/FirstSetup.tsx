import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type Step = 'welcome' | 'signup' | 'verify' | 'project' | 'install' | 'done';

export function FirstSetupPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [moduleId, setModuleId] = useState('medical-reception');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signup() {
    setBusy(true); setError(null);
    try {
      await invoke('cloud_signup', { email, password });
      setStep('verify');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError(null);
    try {
      await invoke('cloud_verify_email', { code });
      setStep('project');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function createProject() {
    setBusy(true); setError(null);
    try {
      await invoke('create_project', { name: projectName, businessType: moduleId });
      setStep('install');
      setTimeout(() => setStep('done'), 1500);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const steps: Step[] = ['welcome', 'signup', 'verify', 'project', 'install', 'done'];
  const idx = steps.indexOf(step) + 1;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-1">Welcome to Product</h1>
        <p className="text-sm text-gray-500 mb-6">Step {idx} of {steps.length}</p>

        {step === 'welcome' && (
          <>
            <p className="text-sm mb-4">This is the one computer that holds the keys to your project.</p>
            <p className="text-sm mb-6">We will walk you through: creating your account, your first project, and installing a module.</p>
            <button onClick={() => setStep('signup')} className="w-full px-4 py-2 bg-blue-600 text-white rounded">Get started</button>
          </>
        )}

        {step === 'signup' && (
          <>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
            <label className="block text-sm font-medium mb-1">Password (12+ chars)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
            <button onClick={signup} disabled={busy || !email || password.length < 12} className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {busy ? 'Creating...' : 'Create account'}
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="text-sm mb-3">We sent a 6-digit code to {email}.</p>
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="123456" className="w-full px-3 py-2 border rounded mb-3" />
            <button onClick={verify} disabled={busy || code.length !== 6} className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Verify</button>
          </>
        )}

        {step === 'project' && (
          <>
            <label className="block text-sm font-medium mb-1">Project name</label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Dr. Alia Clinic" className="w-full px-3 py-2 border rounded mb-2" />
            <label className="block text-sm font-medium mb-1">Module</label>
            <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="w-full px-3 py-2 border rounded mb-3">
              <option value="medical-reception">Medical Reception</option>
              <option value="food-lab">Food Lab</option>
              <option value="retail-pos">Retail POS</option>
              <option value="gym">Gym</option>
              <option value="school">School</option>
              <option value="hotel">Hotel</option>
              <option value="restaurant">Restaurant</option>
            </select>
            <button onClick={createProject} disabled={busy || !projectName} className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {busy ? 'Creating...' : 'Create project'}
            </button>
          </>
        )}

        {step === 'install' && <div className="text-center py-6">Installing module...</div>}

        {step === 'done' && (
          <>
            <div className="text-center text-3xl mb-2">OK</div>
            <p className="text-sm text-center mb-4">Your Admin is ready.</p>
            <a href="/" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded">Open dashboard</a>
          </>
        )}

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}