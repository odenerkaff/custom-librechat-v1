import React from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import AdminPanel from '../components/Admin/Panel';
import { FileMapContext, SetConvoProvider } from '~/Providers';
import { useFileMap } from '~/hooks';

export default function AdminRoute() {
  const { user } = useAuthContext();
  const fileMap = useFileMap({ isAuthenticated: !!user });
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

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

  const AdminSidebar = ({
    activeTab,
    setActiveTab,
    collapsed,
    onToggleCollapse
  }: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
  }) => (
    <div className={`${collapsed ? 'w-16' : 'w-72'} bg-white border-r border-border-light flex flex-col transition-all duration-300 ease-in-out`}>
      <div className={`${collapsed ? 'p-4' : 'p-6'} border-b border-border-light`}>
        {!collapsed && (
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-text-primary">Administração</h2>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Recolher menu"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
        {!collapsed && (
          <p className="text-sm text-text-secondary">Painel de Controle</p>
        )}
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-gray-100 transition-colors mx-auto"
            title="Expandir menu"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <nav className={`${collapsed ? 'p-2' : 'p-4'} space-y-2`}>
        {!collapsed && (
          <>
            <button
              onClick={() => window.location.href = '/c/new'}
              className="w-full text-left px-3 py-2 rounded-lg transition-colors bg-green-100 text-green-700 hover:bg-green-200 whitespace-nowrap"
            >
              ← Voltar ao Chat
            </button>
            <hr className="my-2" />
          </>
        )}

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`${collapsed ? 'w-full px-2 py-3 text-center' : 'w-full text-left px-3 py-2'} rounded-lg transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Dashboard' : undefined}
        >
          {collapsed ? '📊' : '📊 Dashboard'}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`${collapsed ? 'w-full px-2 py-3 text-center' : 'w-full text-left px-3 py-2'} rounded-lg transition-colors ${
            activeTab === 'users'
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Usuários' : undefined}
        >
          {collapsed ? '👥' : '👥 Usuários'}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`${collapsed ? 'w-full px-2 py-3 text-center' : 'w-full text-left px-3 py-2'} rounded-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Logs do Sistema' : undefined}
        >
          {collapsed ? '📋' : '📋 Logs do Sistema'}
        </button>

        {collapsed && (
          <button
            onClick={() => window.location.href = '/c/new'}
            className="w-full px-2 py-3 text-center rounded-lg transition-colors bg-green-100 text-green-700 hover:bg-green-200"
            title="Voltar ao Chat"
          >
            ←
          </button>
        )}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-border-light">
          <div className="text-xs text-gray-500">
            Conectado como: {user?.name || user?.email}
          </div>
        </div>
      )}
    </div>
  );

  const AdminLayout = () => {
    // Handle URL hash navigation
    React.useEffect(() => {
      const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && ['dashboard', 'users', 'logs'].includes(hash)) {
          setActiveTab(hash);
        }
      };

      // Check initial hash
      const initialHash = window.location.hash.replace('#', '');
      if (initialHash && ['dashboard', 'users', 'logs'].includes(initialHash)) {
        setActiveTab(initialHash);
      }

      // Listen for hash changes
      window.addEventListener('hashchange', handleHashChange);

      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }, []);

    const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      window.location.hash = tab;
    };

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
          <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col">
              {renderAdminContent()}
            </div>
          </div>
        </FileMapContext.Provider>
      </SetConvoProvider>
    );
  };

  return <AdminLayout />;
}
