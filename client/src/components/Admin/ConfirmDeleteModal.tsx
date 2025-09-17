import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  selectedCount?: number;
  isDeleting: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  selectedCount,
  isDeleting,
}) => {
  if (!isOpen) {
    return null;
  }

  const totalSelected = selectedCount ?? 0;
  const isBulkAction = selectedCount !== undefined && totalSelected > 0;

  let confirmationMessage = `Voce tem certeza que deseja excluir o usuario "${userName}"?`;

  if (isBulkAction) {
    confirmationMessage =
      totalSelected > 1
        ? 'Voce tem certeza que deseja excluir estes usuarios?'
        : 'Voce tem certeza que deseja excluir o usuario selecionado?';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-red-600">Confirmar exclusao</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl" aria-label="Fechar">
            X
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">{confirmationMessage}</p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">
              <strong>Atencao:</strong> esta acao nao pode ser desfeita e todos os dados serao permanentemente removidos.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Confirmar exclusao'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;


