import React from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import AdminPanel from '../components/Admin/Panel';
import { FileMapContext, SetConvoProvider } from '~/Providers';
import { useFileMap } from '~/hooks';

export default function AdminRoute() {
  const { user } = useAuthContext();
  const fileMap = useFileMap({ isAuthenticated: !!user });

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h3>
          <p className="text-gray-600">Você não tem permissão para acessar o painel de administração.</p>
        </div>
      </div>
    );
  }

  const AdminSidebar = ({ activeTab, setActiveTab }: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
  }) => (
    <div className="w-64 bg-white border-r border-border-light flex flex-col">
      <div className="p-6 border-b border-border-light">
        <h2 className="text-lg font-semibold text-text-primary">Administração</h2>
        <p className="text-sm text-text-secondary">Painel de Controle</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => window.location.href = '/c/new'}
          className="w-full text-left px-3 py-2 rounded-lg transition-colors bg-green-100 text-green-700 hover:bg-green-200"
        >
          ← Voltar ao Chat
        </button>

        <hr className="my-2" />

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          📊 Dashboard
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'users'
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          👥 Usuários
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          📋 Logs do Sistema
        </button>
      </nav>

      <div className="p-4 border-t border-border-light">
        <div className="text-xs text-gray-500">
          Conectado como: {user?.name || user?.email}
        </div>
      </div>
    </div>
  );

  const AdminLayout = () => {
    const [activeTab, setActiveTab] = React.useState('dashboard');

    const renderAdminContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <AdminPanel showStats={true} showTable={false} />;
        case 'users':
          return <AdminPanel showStats={false} showTable={true} />;
        case 'logs':
          return (
            <div className="flex-1 p-6">
              <h2 className="text-2xl font-bold mb-6">Logs do Sistema</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Funcionalidade de logs será implementada em breve...</p>
              </div>
            </div>
          );
        default:
          return <AdminPanel showStats={true} showTable={false} />;
      }
    };

    return (
      <SetConvoProvider>
        <FileMapContext.Provider value={fileMap}>
          <div className="flex h-screen bg-gray-50">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 flex flex-col overflow-hidden">
              {renderAdminContent()}
            </div>
          </div>
        </FileMapContext.Provider>
      </SetConvoProvider>
    );
  };

  return <AdminLayout />;
}
