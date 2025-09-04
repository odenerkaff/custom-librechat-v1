import React, { useState } from 'react';
import { useReferralData, useReferralHistory, useReferralLeaderboard, useReferralActions } from '~/hooks/Referral/useReferral';

const ReferralPanel = () => {
  const { data: referralData, isLoading, error } = useReferralData();
  const { data: history, total: totalReferrals } = useReferralHistory();
  const { data: leaderboard } = useReferralLeaderboard();
  const { shareReferralLink, regenerateReferralLink, isGeneratingLink } = useReferralActions();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'leaderboard'>('overview');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    if (!referralData?.referralLink) return;

    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  const handleShareLink = async () => {
    try {
      await shareReferralLink();
    } catch (err) {
      // Fallback: copy to clipboard
      await handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 max-w-7xl mx-auto min-h-[600px]">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados de indicação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao Carregar Dados</h3>
          <p className="text-gray-600">Não foi possível carregar os dados de indicação. Tente novamente.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const currentUserPosition = leaderboard.findIndex(item => item.name === referralData?.user.name);

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Programa de Indicação</h1>
        <p className="text-gray-600">
          Convide amigos e ganhe 500 créditos por cada pessoa que se cadastrar!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-center">
            <p className="text-blue-100 text-sm font-medium">Total de Indicações</p>
            <p className="text-3xl font-bold mt-2">{totalReferrals}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-center">
            <p className="text-green-100 text-sm font-medium">Créditos Ganhos</p>
            <p className="text-3xl font-bold mt-2">{totalReferrals * 500}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-center">
            <p className="text-purple-100 text-sm font-medium">Sua Posição</p>
            <p className="text-3xl font-bold mt-2">
              {currentUserPosition >= 0 ? `#${currentUserPosition + 1}` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Seu Link de Indicação</h2>

        {/* Link Display */}
        <div className="mb-4">
          <input
            type="text"
            value={referralData?.referralLink || ''}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm"
            placeholder="Carregando link de indicação..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleCopyLink}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              copySuccess
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={!referralData?.referralLink}
          >
            {copySuccess ? '✓ Copiado!' : 'Copiar Link'}
          </button>
          <button
            onClick={handleShareLink}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            disabled={!referralData?.referralLink}
          >
            Compartilhar
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2 text-center">
            <strong>Código de indicação:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{referralData?.referralCode}</code>
          </p>
          <p className="text-center">
            <strong>Cada pessoa indicada dá:</strong> +500 créditos para você
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="border-b">
          <div className="flex justify-center">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium whitespace-nowrap transition-colors text-sm lg:text-base ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium whitespace-nowrap transition-colors text-sm lg:text-base ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Histórico ({totalReferrals})
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-3 font-medium whitespace-nowrap transition-colors text-sm lg:text-base ${
                activeTab === 'leaderboard'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ranking
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[400px]">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Como Funciona</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                      1
                    </div>
                    <h3 className="text-lg font-medium">Compartilhe seu Link</h3>
                  </div>
                  <p className="text-gray-600 mb-6 ml-11 leading-relaxed">
                    Copie seu link único de indicação e compartilhe com amigos e conhecidos.
                  </p>

                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold mr-3">
                      3
                    </div>
                    <h3 className="text-lg font-medium">Ganhe Créditos</h3>
                  </div>
                  <p className="text-gray-600 mb-6 ml-11 leading-relaxed">
                    Receba <span className="font-semibold">automaticamente</span> 500 créditos para usar em suas conversas!
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                      2
                    </div>
                    <h3 className="text-lg font-medium">Amigo se Cadastra</h3>
                  </div>
                  <p className="text-gray-600 mb-6 ml-11 leading-relaxed">
                    Quando alguém usa seu link para se cadastrar, o sistema registra a indicação.
                  </p>

                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold mr-3">
                      4
                    </div>
                    <h3 className="text-lg font-medium">Continue Indicando</h3>
                  </div>
                  <p className="text-gray-600 mb-6 ml-11 leading-relaxed">
                    Quanto mais você indicar, mais créditos você ganha. Não há limite!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Histórico de Indicações</h2>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🎯</div>
                  <p className="text-gray-600">Você ainda não indicou ninguém</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Comece compartilhando seu link de indicação para ganhar créditos!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nome</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Data</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Créditos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {history.map((referral) => (
                        <tr key={referral.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {referral.referredUser.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {referral.referredUser.email}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              {referral.status === 'completed' ? 'Completado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDate(referral.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-medium text-green-600">
                            +500
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Ranking de Indicadores</h2>

              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhum usuário no ranking ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((item, index) => (
                    <div
                      key={item.referrerId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        item.name === referralData?.user.name
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.name === referralData?.user.name && (
                            <span className="text-sm text-blue-600">Você</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {item.totalReferrals}
                        </p>
                        <p className="text-sm text-gray-600">indicações</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralPanel;
