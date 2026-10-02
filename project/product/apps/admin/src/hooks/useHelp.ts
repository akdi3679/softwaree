import { useQuery } from '@tanstack/react-query';

export interface HelpArticle {
  id: string;
  title: string;
  body: string;
  category: string;
}

const ARTICLES: HelpArticle[] = [
  {
    id: 'invite-user',
    title: 'How to invite a user',
    body: '1. Go to Users\n2. Click "Invite user"\n3. Enter their email and select a role\n4. Share the token (one-time view) with them\n5. They install the User app, click Connect, and paste the token',
    category: 'users',
  },
  {
    id: 'backup',
    title: 'How to back up',
    body: 'Backups are automatic on Plans 2+. For manual backups:\n1. Go to Backup\n2. Enter a passphrase (= 8 chars)\n3. Optionally add a note\n4. Click "Create & upload"\nThe backup is encrypted before upload; only you can decrypt it.',
    category: 'backup',
  },
  {
    id: 'restore',
    title: 'How to restore from backup',
    body: '1. Go to Backup\n2. Find the backup you want\n3. Click Restore\n4. Enter the passphrase used at backup time\n5. Confirm\nThe restore takes effect after 3 seconds. The Admin must be online to write the data back.',
    category: 'backup',
  },
  {
    id: 'module-install',
    title: 'How to install a module',
    body: '1. Go to Modules ? Available\n2. Click Install next to the module\n3. Wait for the triple-signature verification (a few seconds)\n4. The module is now active in your project',
    category: 'modules',
  },
  {
    id: 'audit',
    title: 'How to read the audit log',
    body: 'The audit log records every command. Each entry has:\n- a timestamp\n- the actor (user + device)\n- the action (e.g. "user.created")\n- the result (success/failure)\nYou can filter by action type and time range.',
    category: 'audit',
  },
];

export function useHelpArticles(category?: string) {
  return useQuery({
    queryKey: ['help', category],
    queryFn: async () => {
      if (!category) return ARTICLES;
      return ARTICLES.filter((a) => a.category === category);
    },
  });
}
