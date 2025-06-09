import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close button logout-button" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
