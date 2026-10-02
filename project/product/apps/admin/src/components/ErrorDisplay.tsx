interface ErrorDisplayProps {
  title?: string;
  error: Error | { message: string; category?: string };
  onRetry?: () => void;
  showDetails?: boolean;
}

export function ErrorDisplay({ title = 'Something went wrong', error, onRetry, showDetails = false }: ErrorDisplayProps) {
  const message = error.message;
  const category = (error as any).category;
  const helpText = category === 'auth' ? 'Please sign in again.' :
                   category === 'forbidden' ? 'You don\'t have permission. Ask your Admin.' :
                   category === 'not_found' ? 'This item may have been deleted.' :
                   category === 'rate_limited' ? 'You\'re doing that too fast. Wait a moment.' :
                   category === 'network' ? 'Check your internet connection.' :
                   'Please try again. If it keeps happening, contact support.';
  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 text-sm">
      <div className="font-medium text-red-900 mb-1">{title}</div>
      <div className="text-red-700 mb-2">{message}</div>
      <div className="text-gray-600 text-xs mb-3">{helpText}</div>
      <div className="flex gap-2">
        {onRetry && <button onClick={onRetry} className="px-3 py-1 bg-red-600 text-white rounded text-xs">Retry</button>}
        {showDetails && <details className="text-xs text-red-800"><summary>Stack trace</summary><pre className="mt-2 whitespace-pre-wrap">{(error as any).stack ?? 'no stack'}</pre></details>}
      </div>
    </div>
  );
}
