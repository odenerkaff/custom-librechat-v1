import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminModal from './AdminModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { useAuthContext } from '~/hooks/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserWithActivity {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastActivity: string;
  balance: number;
}

interface AdminPanelProps {
  showStats?: boolean;
  showTable?: boolean;
}

const AdminPanel = ({ showStats = true, showTable = true }: AdminPanelProps) => {
  const { user, token, isAuthenticated } = useAuthContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithActivity | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Acesso Negado</h3>
          <p className="text-gray-600">Você não tem permissão para acessar o painel de administração.</p>
        </div>
      </div>
    );
  }

  // Fetch users from API with proper typing
  const { data: users, isLoading, error } = useQuery<UserWithActivity[], Error>({
    queryKey: ['adminUsers'],
    queryFn: async (): Promise<UserWithActivity[]> => {
      console.log('[AdminPanel] Using token from AuthContext:', token ? 'Token presente' : 'Sem token');
      console.log('[AdminPanel] User authenticated:', isAuthenticated);
      console.log('[AdminPanel] User role:', user?.role);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[AdminPanel] Using Authorization header with AuthContext token');
      } else {
        console.log('[AdminPanel] WARNING: No token found in AuthContext');
      }

      const response = await fetch('/api/admin/users', {
        headers,
        credentials: 'include',
      });

      console.log('[AdminPanel] Response status:', response.status);

      if (response.status === 403) {
        throw new Error('Acesso negado - Você não tem permissão');
      }
      if (response.status === 401) {
        throw new Error('Não autenticado - faça login novamente');
      }
      if (!response.ok) {
        throw new Error(`Erro ao carregar usuários (${response.status})`);
      }
      return response.json();
    },
    enabled: !!(isAuthenticated && token && user?.role === 'ADMIN'),
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('[DeleteUser] Using token from AuthContext:', token ? 'Token presente' : 'Sem token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        credentials: 'include',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado - Você não tem permissão para excluir este usuário');
        }
        if (response.status === 401) {
          throw new Error('Não autenticado - faça login novamente');
        }
        throw new Error('Erro ao excluir usuário');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setConfirmDeleteModal(false);
      setDeletingUser(null);
      setIsDeleting(false);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      setIsDeleting(false);
    },
  });

  const handleOpenModal = (user?: UserWithActivity) => {
    setEditingUser(user || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmitModal = async (userData: any) => {
    console.log('Modal submitted:', userData);
    console.log('[CreateUser] Using token from AuthContext:', token ? 'Token presente' : 'Sem token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado - Você não tem permissão');
        }
        if (response.status === 401) {
          throw new Error('Não autenticado - faça login novamente');
        }
        throw new Error(result.message || 'Erro ao criar usuário');
      }

      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

      console.log('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    const userToDelete = users?.find(u => u.id === userId);
    if (userToDelete) {
      setDeletingUser(userToDelete);
      setConfirmDeleteModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      setIsDeleting(true);
      deleteUserMutation.mutate(deletingUser.id);
    }
  };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR') || dateString;
    };

    // Calculate stats
    const totalUsers = (users || []).length;
    const activeAdmins = (users || []).filter(u => u.role === 'ADMIN').length;
    const activeUsers = (users || []).filter(u => {
      const lastActivity = new Date(u.lastActivity || u.createdAt);
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return lastActivity > oneMonthAgo;
    }).length;

  return (
    <div className="flex-1 p-6 max-w-full">
      {showStats && (
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
          <p className="text-gray-600 mt-2">
            Gerencie usuários, configurações do sistema e monitore atividades
          </p>
        </div>
      )}

      {showTable && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-base text-center flex-1">Gerenciamento de Usuários</h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <span>+</span>
            Novo Usuário
          </button>
        </div>
      )}

      {/* Dashboard Stats */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total de Usuários</h3>
            <p className="text-2xl font-bold text-blue-600">
              {isLoading ? 'Carregando...' : totalUsers}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Admins Ativos</h3>
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? 'Carregando...' : activeAdmins}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Usuários Ativos</h3>
            <p className="text-2xl font-bold text-purple-600">
              {isLoading ? 'Carregando...' : activeUsers}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar usuários</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Erro: {error instanceof Error ? error.message : 'Erro interno do servidor'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table - Only show when showTable is true */}
      {showTable && (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Função</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Última Atividade</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Criado em</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Plano</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Créditos</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && (users?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="text-gray-500">Carregando usuários...</div>
                  </td>
                </tr>
              )}

              {!isLoading && !error && (users || []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="text-gray-500">
                      Nenhum usuário encontrado
                      <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['adminUsers'] })}
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        Recarregar
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {users && (users as UserWithActivity[]).length > 0 && users?.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs truncate">
                    <div className="flex items-center">
                      {userItem.name}
                      {userItem.id === user?.id && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Você
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{userItem.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      userItem.role === 'ADMIN'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {userItem.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {userItem.lastActivity ? formatDate(userItem.lastActivity) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(userItem.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">Free</td>
                  <td className="px-4 py-3 text-sm">{userItem.balance}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(userItem)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                        disabled={userItem.id === user?.id}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal dialogs should be outside the table conditional */}
      <AdminModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        editingUser={editingUser}
        currentUserId={user?.id || ''}
      />

      <ConfirmDeleteModal
        isOpen={confirmDeleteModal}
        onClose={() => {
          setConfirmDeleteModal(false);
          setDeletingUser(null);
          setIsDeleting(false);
        }}
        onConfirm={handleConfirmDelete}
        userName={deletingUser?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AdminPanel;
