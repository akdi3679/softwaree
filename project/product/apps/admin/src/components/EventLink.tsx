import { Link } from '@tanstack/react-router';

interface Props {
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
}

export function EventLink(p: Props) {
  return (
    <Link
      to={'/entities/$type/$id' as any}
      className="text-xs text-primary-600 hover:underline"
    >
      View {p.aggregate_type} {p.aggregate_id.slice(0, 8)}…
    </Link>
  );
}
