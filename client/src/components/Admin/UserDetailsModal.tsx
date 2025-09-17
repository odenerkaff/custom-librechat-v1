import React, { useState, useEffect, useRef } from 'react';

interface UserWithActivity {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastActivity: string | null;
  isOnline?: boolean;
  balance: number | string;
  source: string;
}

interface UserDetailsFormData {
  name: string;
  email: string;
  role: string;
  balance: number;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithActivity | null;
  onSave: (userId: string, data: UserDetailsFormData) => Promise<void>;
  onDelete: (userId: string) => void;
  currentUserId?: string;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  onDelete,
  currentUserId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserDetailsFormData>({
    name: '',
    email: '',
    role: 'USER',
    balance: 0
  });
  const [errors, setErrors] = useState<Partial<UserDetailsFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const prevUserIdRef = useRef<string | null>(null);

  // Sync form state when modal opens or selected user changes
  useEffect(() => {
    if (!isOpen) {
      if (isEditing) {
        setIsEditing(false);
      }
      prevUserIdRef.current = null;
      return;
    }

    if (!user) {
      return;
    }

    const userChanged = prevUserIdRef.current !== user.id;

    if (userChanged) {
      setIsEditing(false);
    }

    if (userChanged || !isEditing) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        balance: Number(user.balance) || 0,
      });
      setErrors({});
      setSubmitError('');
    }

    prevUserIdRef.current = user.id;
  }, [isOpen, user, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserDetailsFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'Créditos não podem ser negativos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!user || !isEditing) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    let shouldClose = false;

    try {
      await onSave(user.id, formData);
      setIsEditing(false);
      shouldClose = true;
    } catch (error) {
      console.error('Error updating user:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erro ao salvar usuario');
    } finally {
      setIsSubmitting(false);
      if (shouldClose) {
        onClose();
      }
    }
  };
  const handleInputChange = (field: keyof UserDetailsFormData, value: string | number) => {
    if (field === 'balance') {
      setFormData(prev => ({ ...prev, [field]: Number(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value as string }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDeleteUser = () => {
    if (user) {
      onDelete(user.id);
      onClose();
    }
  };

  const isCurrentUser = user?.id === currentUserId;

  if (!isOpen || !user) return null;

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const lastActivityDisplay = user.isOnline ? 'Online agora' : formatDate(user.lastActivity);
  const lastActivityStyles = user.isOnline ? 'text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md' : 'text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Editar Usuário' : 'Detalhes do Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.name}</p>
              )}
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.email}</p>
              )}
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Função
              </label>
              {isEditing ? (
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">Usuário</option>
                  <option value="ADMIN">Admin</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  <span
                    className={
                      user.role === 'ADMIN'
                        ? 'inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800'
                        : 'inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800'
                    }
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                  </span>
                </p>
              )}
              {errors.role && (
                <p className="text-sm text-red-600 mt-1">{errors.role}</p>
              )}
              {isCurrentUser && user.role === 'ADMIN' && formData.role !== 'ADMIN' && (
                <p className="text-sm text-amber-600 mt-1">
                  Você não pode alterar sua própria função de administrador
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Créditos
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => handleInputChange('balance', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.balance}</p>
              )}
              {errors.balance && (
                <p className="text-sm text-red-600 mt-1">{errors.balance}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Última Atividade
              </label>
              <p className={lastActivityStyles}>{lastActivityDisplay}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Criado em
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formatDate(user.createdAt)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">Free</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fonte
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.source}</p>
            </div>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting || (isCurrentUser && user.role === 'ADMIN' && formData.role !== 'ADMIN')}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-4 py-2 text-red-600 bg-red-50 rounded hover:bg-red-100"
                  disabled={isCurrentUser}
                >
                  Apagar Usuário
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
                >
                  Editar Usuário
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserDetailsModal;



