import React, { useId, useLayoutEffect, useRef } from 'react';

// One history guard and scroll lock for the entire nested modal stack.
const activeSurfaces = new Set<HTMLDialogElement>();
let previousOverflow = '';
let listening = false;
let removingGuard = false;
const pushGuard = () => history.pushState({ ...history.state, javadianModal: true }, '');
const onHistoryBack = () => {
  removingGuard = false;
  if (activeSurfaces.size) pushGuard();
  else { window.removeEventListener('popstate', onHistoryBack); listening = false; }
};
function retainModal(dialog: HTMLDialogElement) {
  if (!activeSurfaces.size) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!removingGuard && !history.state?.javadianModal) pushGuard();
    if (!listening) { window.addEventListener('popstate', onHistoryBack); listening = true; }
  }
  activeSurfaces.add(dialog);
  return () => {
    activeSurfaces.delete(dialog);
    if (!activeSurfaces.size) document.body.style.overflow = previousOverflow;
    // A microtask lets React's StrictMode replay or a replacement dialog retain
    // the same guard, avoiding duplicate entries and asynchronous cleanup races.
    queueMicrotask(() => {
      if (activeSurfaces.size || removingGuard) return;
      if (history.state?.javadianModal) { removingGuard = true; history.back(); }
      else { window.removeEventListener('popstate', onHistoryBack); listening = false; }
    });
  };
}

interface DialogSurfaceProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/** Native top-layer modal: focus containment, inert background and focus restoration.
 * Back on an open dialog stays on the form; explicit close/cancel remains available.
 * No route, draft or business data is written to browser history.
 */
export const DialogSurface: React.FC<DialogSurfaceProps> = ({
  isOpen, onClose, title, children, className = '',
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const release = retainModal(dialog);
    return () => {
      dialog.close();
      release();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen, titleId]);

  if (!isOpen) return null;
  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={titleId}
      className={`dialog-surface ${className}`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <h2 id={titleId} className="sr-only">{title}</h2>
      {children}
    </dialog>
  );
};
