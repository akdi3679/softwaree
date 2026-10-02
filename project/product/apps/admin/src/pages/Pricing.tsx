import { open } from '@tauri-apps/plugin-shell';

const PLANS = [
  { id: 'local', name: 'Local', price: 'Free', desc: 'Just the basics. One computer, no users, no backups.' },
  { id: 'starter', name: 'Starter', price: '$29/mo', desc: 'Up to 3 users. Weekly backups. Marketplace access.' },
  { id: 'team', name: 'Team', price: '$99/mo', desc: 'Up to 10 users. Daily backups. Priority support.' },
  { id: 'enterprise', name: 'Enterprise', price: '$499+/mo', desc: 'Unlimited. Custom modules. 4h backups. SSO.' },
];

export function PricingPage() {
  async function upgrade(plan: string) {
    await open(`https://portal.example.com/billing/checkout?plan=${plan}`);
  }
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Plans &amp; pricing</h2>
      <div className="grid grid-cols-4 gap-4">
        {PLANS.map((p) => (
          <div key={p.id} className="bg-white rounded border p-4 flex flex-col">
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <div className="text-2xl font-bold my-2">{p.price}</div>
            <p className="text-sm text-gray-500 flex-1">{p.desc}</p>
            <button onClick={() => upgrade(p.id)} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded text-sm">
              {p.id === 'local' ? 'Current' : 'Choose'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
