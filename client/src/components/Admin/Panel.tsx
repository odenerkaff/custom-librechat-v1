import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminModal from './AdminModal';
import UserDetailsModal from './UserDetailsModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { useAuthContext } from '~/hooks/AuthContext';

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

interface AdminPanelProps {
  showStats?: boolean;
  showTable?: boolean;
}

const AdminPanel = ({ showStats = true, showTable = true }: AdminPanelProps) => {
  const { user, token, isAuthenticated } = useAuthContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithActivity | null>(null);
  const [editingUserDetails, setEditingUserDetails] = useState<UserWithActivity | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);


  const queryClient = useQueryClient();

  if (user?.role !== 'ADMIN') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Acesso negado</h3>
          <p className="text-gray-600">Voce nao tem permissao para acessar o painel de administracao.</p>
        </div>
      </div>
    );
  }

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
        headers.Authorization = `Bearer ${token}`;
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
        throw new Error('Acesso negado - Voce nao tem permissao');
      }
      if (response.status === 401) {
        throw new Error('Nao autenticado - faca login novamente');
      }
      if (!response.ok) {
        throw new Error(`Erro ao carregar usuarios (${response.status})`);
      }
      return response.json();
    },
    enabled: Boolean(isAuthenticated && token && user?.role === 'ADMIN'),
  });



  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('[DeleteUser] Using token from AuthContext:', token ? 'Token presente' : 'Sem token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        credentials: 'include',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado - Voce nao tem permissao para excluir este usuario');
        }
        if (response.status === 401) {
          throw new Error('Nao autenticado - faca login novamente');
        }
        throw new Error('Erro ao excluir usuario');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setConfirmDeleteModal(false);
      setDeletingUser(null);
      setIsDeleting(false);
    },
    onError: (mutationError) => {
      console.error('Delete error:', mutationError);
      setIsDeleting(false);
    },
  });

  const handleOpenModal = (targetUser?: UserWithActivity) => {
    setEditingUser(targetUser ?? null);
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
      headers.Authorization = `Bearer ${token}`;
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
          throw new Error('Acesso negado - Voce nao tem permissao');
        }
        if (response.status === 401) {
          throw new Error('Nao autenticado - faca login novamente');
        }
        throw new Error(result.message || 'Erro ao criar usuario');
      }

      const createdAt = result.createdAt ? String(result.createdAt) : new Date().toISOString();
      const lastActivity = result.lastActivity
        ? String(result.lastActivity)
        : result.updatedAt
        ? String(result.updatedAt)
        : createdAt;

      const normalizedUser: UserWithActivity = {
        id: result.id || result._id,
        name: result.name || userData.name,
        email: result.email || userData.email,
        role: result.role || userData.role || 'USER',
        createdAt,
        lastActivity,
        balance:
          typeof result.balance === 'number'
            ? result.balance
            : Number(result.balance ?? userData.balance ?? 0) || 0,
        source: 'Outros', // Default for newly created users
      };

      queryClient.setQueryData<UserWithActivity[]>(['adminUsers'], (existing) => {
        const list = Array.isArray(existing) ? existing : [];
        const filtered = list.filter((item) => item.id !== normalizedUser.id);
        return [normalizedUser, ...filtered];
      });

      await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

      console.log('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = Array.isArray(users) ? users.find((item) => item.id === userId) : null;
    if (!userToDelete) {
      return;
    }

    setDeletingUser(userToDelete);
    setConfirmDeleteModal(true);
  };

  const handleOpenUserDetailsModal = (targetUser: UserWithActivity) => {
    setEditingUserDetails(targetUser);
    setUserDetailsModalOpen(true);
  };

  const handleCloseUserDetailsModal = () => {
    setUserDetailsModalOpen(false);
    setEditingUserDetails(null);
  };

  const handleSaveUserDetails = async (userId: string, userData: { name: string; email: string; role: string; balance: number }) => {
    console.log('[SaveUserDetails] Using token from AuthContext:', token ? 'Token presente' : 'Sem token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Acesso negado - Você nÃ£o tem permissÃ£o para editar este usuário');
      }
      if (response.status === 401) {
        throw new Error('Nao autenticado - faca login novamente');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao salvar usuario');
    }

    const result = await response.json();
    const updatedName = typeof result.name === 'string' ? result.name : userData.name;
    const updatedEmail = typeof result.email === 'string' ? result.email : userData.email;
    const updatedRole = typeof result.role === 'string' ? result.role : userData.role;
    const updatedBalanceRaw = result.balance ?? userData.balance;
    const updatedBalance =
      typeof updatedBalanceRaw === 'number'
        ? updatedBalanceRaw
        : Number(updatedBalanceRaw ?? userData.balance ?? 0) || 0;

    // Update the cache with the new user data
    queryClient.setQueryData<UserWithActivity[]>(['adminUsers'], (existing) => {
      if (!Array.isArray(existing)) return existing;
      return existing.map((user) =>
        user.id === userId
          ? {
              ...user,
              name: updatedName,
              email: updatedEmail,
              role: updatedRole,
              balance: updatedBalance,
            }
          : user
      );
    });

    setEditingUserDetails((current) =>
      current && current.id === userId
        ? {
            ...current,
            name: updatedName,
            email: updatedEmail,
            role: updatedRole,
            balance: updatedBalance,
          }
        : current
    );

    await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  };

  const handleBulkDeleteClick = () => {
    const deletableIds = selectedUsers.filter((id) => {
      const userToCheck = Array.isArray(users) ? users.find((u) => u.id === id) : null;
      return userToCheck && userToCheck.role !== 'ADMIN' && id !== user?.id;
    });
    if (deletableIds.length === 0) {
      return;
    }

    setBulkDeleteIds(deletableIds);
    setDeletingUser(null);
    setConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (bulkDeleteIds.length > 0) {
      try {
        setIsDeleting(true);
        await Promise.all(
          bulkDeleteIds.map(async (userId) => {
            const response = await fetch(`/api/admin/users/${userId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              credentials: 'include',
            });

            if (!response.ok) {
              const message = await response.text();
              throw new Error(message || 'Bulk delete failed');
            }
          })
        );

        await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        setSelectedUsers([]);
        setBulkDeleteIds([]);
        setConfirmDeleteModal(false);
      } catch (bulkError) {
        console.error('Bulk delete error:', bulkError);
        alert('Erro ao excluir usuarios selecionados. Veja o console para detalhes.');
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    if (deletingUser) {
      setIsDeleting(true);
      deleteUserMutation.mutate(deletingUser.id);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const totalUsers = Array.isArray(users) ? users.length : 0;
  const activeAdmins = Array.isArray(users) ? users.filter((item) => item.role === 'ADMIN').length : 0;
  const activeUsers = Array.isArray(users)
    ? users.filter((item) => {
        const lastActivity = item.lastActivity || item.createdAt;
        if (!lastActivity) {
          return false;
        }
        const activityDate = new Date(lastActivity);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return activityDate >= thirtyDaysAgo;
      }).length
    : 0;



  return (
    <div className="h-full p-4 md:p-6 max-w-full overflow-auto">
      {showStats && (
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Painel de administracao</h1>
          <p className="text-gray-600 mt-2">Gerencie usuarios, configuracoes do sistema e monitore atividades</p>
        </div>
      )}

      {showTable && (
        <div className="flex justify-start items-center mb-6">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <span>+</span>
            Novo usuario
          </button>
        </div>
      )}

      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total de usuarios</h3>
            <p className="text-2xl font-bold text-blue-600">{isLoading ? 'Carregando...' : totalUsers}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Admins ativos</h3>
            <p className="text-2xl font-bold text-green-600">{isLoading ? 'Carregando...' : activeAdmins}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Usuarios ativos</h3>
            <p className="text-2xl font-bold text-purple-600">{isLoading ? 'Carregando...' : activeUsers}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar usuarios</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Erro: {error.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTable && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {selectedUsers.length > 0 && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-red-700">{selectedUsers.length} usuario(s) selecionado(s)</span>
              <button
                onClick={handleBulkDeleteClick}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Deletar selecionados
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    <input
                      type="checkbox"
                      checked={Array.isArray(users) && users.filter(u => u.role !== 'ADMIN' && u.id !== user?.id).length > 0 && users.filter(u => u.role !== 'ADMIN' && u.id !== user?.id).every(u => selectedUsers.includes(u.id))}
                      onChange={() => {
                        const selectableUsers = Array.isArray(users) ? users.filter(u => u.role !== 'ADMIN' && u.id !== user?.id) : [];
                        const allSelected = selectableUsers.every(u => selectedUsers.includes(u.id));
                        if (allSelected) {
                          setSelectedUsers([]);
                        } else {
                          setSelectedUsers(selectableUsers.map(u => u.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Função</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Última Atividade</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Plano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && (!Array.isArray(users) || users.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Carregando usuarios...
                    </td>
                  </tr>
                )}

                {!isLoading && !error && (!Array.isArray(users) || users.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="text-gray-500">
                        Nenhum usuario encontrado
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

                {Array.isArray(users) &&
                  users.map((userItem) => {
                    const disabled = userItem.id === user?.id;
                    const isAdmin = userItem.role === 'ADMIN';
                    const canSelect = !disabled && !isAdmin;
                    const isSelected = selectedUsers.includes(userItem.id);
                    return (
                      <tr
                        key={userItem.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={(e) => {
                          // Prevent modal opening when clicking checkbox
                          if ((e.target as HTMLInputElement).type === 'checkbox') return;
                          handleOpenUserDetailsModal(userItem);
                        }}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => {
                              event.stopPropagation();
                              if (isSelected) {
                                setSelectedUsers((prev) => prev.filter((id) => id !== userItem.id));
                              } else if (canSelect) {
                                setSelectedUsers((prev) => [...prev, userItem.id]);
                              }
                            }}
                            disabled={!canSelect}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">
                          <div className="flex items-center">
                            {userItem.name}
                            {disabled && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Você</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              userItem.role === 'ADMIN'
                                ? 'inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800'
                                : 'inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800'
                            }
                          >
                            {userItem.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${userItem.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={userItem.isOnline ? 'text-green-600 font-medium' : 'text-gray-600'}>
                              {userItem.isOnline ? 'Online agora' : formatDateTime(userItem.lastActivity)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">Free</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        editingUser={editingUser}
        currentUserId={user?.id || ''}
      />

      <UserDetailsModal
        isOpen={userDetailsModalOpen}
        onClose={handleCloseUserDetailsModal}
        user={editingUserDetails}
        onSave={handleSaveUserDetails}
        onDelete={handleDeleteUser}
        currentUserId={user?.id}
      />

      <ConfirmDeleteModal
        isOpen={confirmDeleteModal}
        onClose={() => {
          setConfirmDeleteModal(false);
          setDeletingUser(null);
          setBulkDeleteIds([]);
          setIsDeleting(false);
        }}
        onConfirm={handleConfirmDelete}
        userName={deletingUser?.name || ''}
        selectedCount={bulkDeleteIds.length > 0 ? bulkDeleteIds.length : undefined}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AdminPanel;
