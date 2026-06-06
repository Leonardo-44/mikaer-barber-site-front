// ============================================
//  DeleteAppointmentModal.jsx — Mikael Barber
// ============================================

import { createPortal } from "react-dom";
import "./DeleteAppointmentModal.css";

export default function DeleteAppointmentModal({ onConfirm, onCancel }) {
  const modal = (
    <div
      className="del-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-title"
    >
      <div className="del-card">
        <div className="del-header">
          <div className="del-header__icon" aria-hidden="true">
            <i className="ti ti-trash" />
          </div>
          <div>
            <h2 className="del-header__title" id="del-title">
              Remover atendimento
            </h2>
            <p className="del-header__sub">Essa ação não pode ser desfeita</p>
          </div>
          <button
            className="del-close"
            onClick={onCancel}
            aria-label="Fechar"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="del-divider" />

        <p className="del-body">
          Tem certeza que deseja remover este atendimento permanentemente?
        </p>

        <div className="del-footer">
          <button className="del-btn del-btn--cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="del-btn del-btn--danger" onClick={onConfirm}>
            <i className="ti ti-trash" aria-hidden="true" /> Remover
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}