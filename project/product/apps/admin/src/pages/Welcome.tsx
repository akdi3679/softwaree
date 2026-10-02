import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { invoke } from '@tauri-apps/api/core';

type Step = 'welcome' | 'cloud-login' | 'project-name' | 'done';

export function WelcomeWizard() {
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [projectName, setProjectName] = useState('');
  const navigate = useNavigate();

  async function loginToCloud() {
    try {
      const result = await invoke<{ session_token: string }>('cloud_login', {
        email,
        password,
      });
      localStorage.setItem('cloud_session', result.session_token);
      setStep('project-name');
    } catch (e) {
      alert(`Login failed: ${e}`);
    }
  }

  async function createProject() {
    const result = await invoke<{ project_id: string }>('create_project', {
      name: projectName,
      businessType: 'medical_reception',
    });
    localStorage.setItem('active_project', result.project_id);
    setStep('done');
    setTimeout(() => navigate({ to: '/projects' }), 1500);
  }

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        {step === 'welcome' && (
          <>
            <h1 className="text-3xl font-semibold mb-2">Welcome to Product</h1>
            <p className="text-gray-600 mb-6">
              A local-first, secure platform for your team. Let&apos;s set it up.
            </p>
            <ol className="space-y-2 mb-6 text-sm text-gray-700">
              <li>1. Sign in to your Cloud account (or create one)</li>
              <li>2. Create your first project</li>
              <li>3. Add modules (medical, food-lab, ...)</li>
              <li>4. Invite your team</li>
            </ol>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('cloud-login')}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate({ to: '/login' })}
                className="px-4 py-2 border rounded"
              >
                I have a session
              </button>
            </div>
          </>
        )}
        {step === 'cloud-login' && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Sign in to Product Cloud</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-2 px-3 py-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={loginToCloud}
                disabled={!email || !password}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Sign in
              </button>
              <button
                onClick={() => setStep('welcome')}
                className="px-4 py-2 border rounded"
              >
                Back
              </button>
            </div>
          </>
        )}
        {step === 'project-name' && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Name your first project</h2>
            <input
              type="text"
              placeholder="e.g., Dr. Lee's Clinic"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={createProject}
                disabled={!projectName}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setStep('cloud-login')}
                className="px-4 py-2 border rounded"
              >
                Back
              </button>
            </div>
          </>
        )}
        {step === 'done' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold mb-2">All set!</h2>
            <p className="text-gray-600">Taking you to your project...</p>
          </div>
        )}
      </div>
    </div>
  );
}