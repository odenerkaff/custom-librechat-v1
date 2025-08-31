import { Fragment, useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useNavigate } from 'react-router-dom';

// Define User interface for proper typing
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  lastActivity: string;
  balance: number;
  provider: string;
  avatar?: string;
  emailVerified: boolean;
}

export default function Admin({ onClose }) {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    activeUsers: 0,
    loading: true,
    error: null as string | null
  });

  // Fetch admin stats with proper typing
  useEffect(() => {
    const fetchAdminStats = async () => {
      if (!user || user.role !== 'ADMIN') return;

      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));
        const response = await fetch('/api/admin/users');

        if (response.status === 403) {
          throw new Error('Acesso negado - Você não tem permissão');
        }
        if (!response.ok) {
          throw new Error('Erro ao carregar estatísticas');
        }

        const users: User[] = await response.json();
        const totalUsers = users.length;
        const totalAdmins = users.filter(user => user.role === 'ADMIN').length;
        const activeUsers = users.filter(user => {
          const lastActivity = new Date(user.lastActivity || user.createdAt);
          const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return lastActivity > oneMonthAgo;
        }).length;

        setStats({
          totalUsers,
          totalAdmins,
          activeUsers,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    fetchAdminStats();
  }, [user]);

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar o painel de administração.</p>
        </div>
      </div>
    );
  }

  const handleGoToAdminPanel = () => {
    if (onClose) onClose();
    navigate('/admin');
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="border-b border-border-light pb-4">
        <h1 className="text-2xl font-bold">Painel de Administração</h1>
        <p className="text-sm text-text-secondary mt-1">
          Gerencie usuários, configurações do sistema e monitore atividades
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Gerenciamento de Usuários</h2>
          <p className="text-sm text-gray-600 mb-4">
            Gerencie todos os usuários da plataforma. Crie, edite, visualize e remova contas de usuário.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total de Usuários</h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.loading ? '...' : stats.totalUsers}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Admins Ativos</h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.loading ? '...' : stats.totalAdmins}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Usuários Ativos</h3>
              <p className="text-2xl font-bold text-purple-600">
                {stats.loading ? '...' : stats.activeUsers}
              </p>
            </div>
          </div>

          {stats.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro ao carregar estatísticas</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{stats.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleGoToAdminPanel}
            className="px-6 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors"
          >
            Acessar Gerenciamento Completo
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Configurações do Sistema</h2>
          <p className="text-sm text-gray-600">
            Acesse recursos avançados de administração do sistema.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Logs do Sistema</h3>
              <p className="text-sm text-gray-600">Visualize logs de atividades e erros</p>
              <button className="mt-2 text-blue-600 hover:underline text-sm">
                Verificar Logs
              </button>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Estatísticas</h3>
              <p className="text-sm text-gray-600">Analise estatísticas de uso do sistema</p>
              <button className="mt-2 text-blue-600 hover:underline text-sm">
                Ver Estatísticas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
