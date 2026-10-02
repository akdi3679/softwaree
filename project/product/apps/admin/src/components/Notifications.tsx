import { useState, useEffect, useRef } from 'react';
import { useNotifications, useMarkRead } from '../hooks/useNotifications';

export function NotificationBell() {
  const { data: notifs } = useNotifications();
  const markRead = useMarkRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = (notifs ?? []).filter((n) => !n.read).length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative px-3 py-1 text-sm text-gray-700"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded border shadow-lg max-h-96 overflow-y-auto z-50">
          {(notifs ?? []).length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notifications</div>
          ) : (
            (notifs ?? []).map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                  if (n.action_url) window.location.href = n.action_url;
                }}
                className={`p-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 ${
                  n.read ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <span>
                    {n.type === 'error'
                      ? '❌'
                      : n.type === 'warning'
                        ? '⚠️'
                        : n.type === 'success'
                          ? '✅'
                          : 'ℹ️'}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-gray-600">{n.body}</div>
                    <div className="text-xs text-gray-400 mt-1">{n.created_at}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}