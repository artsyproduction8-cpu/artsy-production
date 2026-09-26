'use client';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
}

export default function PreviewModal({
  open,
  onClose,
  src
}: PreviewModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative max-w-[800px] w-[90%] bg-black border-[12px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-[20px] z-10"
        >
          ×
        </button>
        <img
          id="preview-img"
          src={src}
          alt="Service Preview"
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}