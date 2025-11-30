import React from 'react';
import { createRoot } from 'react-dom/client';

let root: ReturnType<typeof createRoot> | null = null;
let hideTimer: any = null;

export function showToast(message: string, timeoutMs = 2000) {
  if (!root) {
    const div = document.createElement('div');
    document.body.appendChild(div);
    root = createRoot(div);
  }
  root.render(<div className="toast" role="status" aria-live="polite">{message}</div>);
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => root?.render(<></>), timeoutMs);
}


