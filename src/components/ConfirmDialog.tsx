import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

// "Are you sure?" box for deleting, built on the browser's <dialog> element
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // showModal() shows it over the page with a dark backdrop. Esc closes it.
  useEffect(() => {
    if (open) {
      setError('');
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={ref} onClose={onCancel}>
      <h2>{title}</h2>
      <p className="muted">{message}</p>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="danger" onClick={handleConfirm} disabled={busy}>
          <Trash2 size={16} /> {busy ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </dialog>
  );
}
