interface Attachment { sha256: string; filename: string; size_bytes: number; stored_path: string; }

export function AttachmentGallery({ aggregateType, aggregateId, attachments }: { aggregateType: string; aggregateId: string; attachments: Attachment[] }) {
  function openAttachment(att: Attachment) {
    alert(`Open with your system app: ${att.stored_path}`);
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {attachments.map((a) => (
        <div key={a.sha256} className="bg-white rounded border p-2 cursor-pointer" onClick={() => openAttachment(a)}>
          <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-2xl">??</div>
          <div className="text-xs mt-1 truncate">{a.filename}</div>
          <div className="text-xs text-gray-500">{(a.size_bytes / 1024).toFixed(1)} KB</div>
        </div>
      ))}
      {attachments.length === 0 && <div className="col-span-4 text-sm text-gray-500 p-4 text-center">No attachments</div>}
    </div>
  );
}
