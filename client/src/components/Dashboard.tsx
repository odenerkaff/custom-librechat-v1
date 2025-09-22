import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Star,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  UserPlus,
  RefreshCw
} from 'lucide-react';

// Mock data - ready for backend integration
const mockData = {
  acquisition: {
    newUsers: [
      { date: '2024-01-01', daily: 45, monthly: 1200 },
      { date: '2024-01-02', daily: 52, monthly: 1250 },
      { date: '2024-01-03', daily: 38, monthly: 1280 },
      { date: '2024-01-04', daily: 61, monthly: 1320 },
      { date: '2024-01-05', daily: 49, monthly: 1360 },
      { date: '2024-01-06', daily: 55, monthly: 1400 },
      { date: '2024-01-07', daily: 67, monthly: 1450 },
    ],
    cac: 45.50,
    conversionRate: 3.2,
    userSources: [
      { name: 'Orgânico', value: 65, color: '#10B981' },
      { name: 'Pago', value: 25, color: '#3B82F6' },
      { name: 'Referral', value: 10, color: '#F59E0B' },
    ]
  },
  engagement: {
    totalUsers: 15420,
    dau: 3240,
    mau: 8920,
    dauMauRatio: 0.36,
    sessionTime: [
      { day: 'Seg', time: 24 },
      { day: 'Ter', time: 28 },
      { day: 'Qua', time: 22 },
      { day: 'Qui', time: 31 },
      { day: 'Sex', time: 26 },
      { day: 'Sáb', time: 19 },
      { day: 'Dom', time: 16 },
    ],
    topFeatures: [
      { feature: 'Chat AI', usage: 8920, percentage: 85 },
      { feature: 'Geração de Imagens', usage: 6540, percentage: 62 },
      { feature: 'Análise de Dados', usage: 4230, percentage: 40 },
      { feature: 'Tradução', usage: 3120, percentage: 30 },
      { feature: 'Resumos', usage: 2890, percentage: 27 },
    ],
    nps: 72
  },
  financial: {
    mrr: 45680,
    arr: 548160,
    arpu: 29.50,
    ltv: 142.30,
    grossMargin: 78.5
  },
  retention: {
    churnRate: 2.8,
    revenueChurn: [
      { month: 'Jan', churn: 2.1 },
      { month: 'Fev', churn: 2.8 },
      { month: 'Mar', churn: 1.9 },
      { month: 'Abr', churn: 3.2 },
      { month: 'Mai', churn: 2.5 },
      { month: 'Jun', churn: 2.8 },
    ]
  }
};

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Component sections
const AcquisitionMetrics = () => (
  <div className="space-y-6">

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Novos Usuários (Hoje)</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockData.acquisition.newUsers[mockData.acquisition.newUsers.length - 1].daily)}</div>
          <p className="text-xs text-muted-foreground">
            +12% em relação a ontem
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CAC</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(mockData.acquisition.cac)}</div>
          <p className="text-xs text-muted-foreground">
            -5% em relação ao mês passado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(mockData.acquisition.conversionRate)}</div>
          <p className="text-xs text-muted-foreground">
            Free → Pago
          </p>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Novos Usuários - Tendência</CardTitle>
          <CardDescription>Usuários novos por dia nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData.acquisition.newUsers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
              <YAxis />
              <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')} />
              <Line type="monotone" dataKey="daily" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Origem dos Usuários</CardTitle>
          <CardDescription>Distribuição por canal de aquisição</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockData.acquisition.userSources}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockData.acquisition.userSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  </div>
);

const EngagementMetrics = () => (
  <div className="space-y-6">

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockData.engagement.totalUsers)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DAU</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockData.engagement.dau)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MAU</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(mockData.engagement.mau)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DAU/MAU Ratio</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockData.engagement.dauMauRatio.toFixed(2)}</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${mockData.engagement.dauMauRatio * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tempo Médio de Sessão</CardTitle>
          <CardDescription>Minutos por sessão nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData.engagement.sessionTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="time" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NPS (Net Promoter Score)</CardTitle>
          <CardDescription>Satisfação dos usuários</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <div className={`text-6xl font-bold mb-4 ${
            mockData.engagement.nps >= 70 ? 'text-green-600' :
            mockData.engagement.nps >= 30 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {mockData.engagement.nps}
          </div>
          <div className="flex items-center gap-2">
            <Star className={`h-5 w-5 ${
              mockData.engagement.nps >= 70 ? 'text-green-600' :
              mockData.engagement.nps >= 30 ? 'text-yellow-600' : 'text-red-600'
            }`} />
            <span className="text-sm text-muted-foreground">
              {mockData.engagement.nps >= 70 ? 'Excelente' :
               mockData.engagement.nps >= 30 ? 'Bom' : 'Precisa Melhorar'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Funcionalidades Mais Utilizadas</CardTitle>
        <CardDescription>Top 5 funcionalidades por uso</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionalidade</TableHead>
              <TableHead className="text-right">Usuários</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.engagement.topFeatures.map((feature, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{feature.feature}</TableCell>
                <TableCell className="text-right">{formatNumber(feature.usage)}</TableCell>
                <TableCell className="text-right">{feature.percentage}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

const FinancialMetrics = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Primeira linha: MRR, LTV, ARPU */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR (Monthly Recurring Revenue)</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-800">{formatCurrency(mockData.financial.mrr)}</div>
          <p className="text-xs text-green-600">
            +15% em relação ao mês passado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">LTV</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(mockData.financial.ltv)}</div>
          <p className="text-xs text-muted-foreground">
            Lifetime Value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARPU</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(mockData.financial.arpu)}</div>
          <p className="text-xs text-muted-foreground">
            Receita por usuário
          </p>
        </CardContent>
      </Card>

      {/* Segunda linha: ARR, Margem Bruta, Churn Rate */}
      <Card className="bg-green-100 border-green-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARR</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-700" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-900">{formatCurrency(mockData.financial.arr)}</div>
          <p className="text-xs text-green-700">
            Receita anual recorrente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Margem Bruta</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatPercent(mockData.financial.grossMargin)}</div>
          <p className="text-xs text-muted-foreground">
            Margem de lucro
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Churn Rate</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-800">{formatPercent(mockData.retention.churnRate)}</div>
          <p className="text-xs text-red-600">
            Taxa de cancelamento mensal
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const RetentionMetrics = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Churn Rate</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-800">{formatPercent(mockData.retention.churnRate)}</div>
          <p className="text-xs text-red-600">
            Taxa de cancelamento mensal
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Churn</CardTitle>
          <CardDescription>Perda de receita por churn nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData.retention.revenueChurn}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value}%`, 'Churn']} />
              <Line type="monotone" dataKey="churn" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdate(new Date());
    // Aqui você pode adicionar lógica para recarregar dados da API
    window.location.reload();
  };

  const periodOptions = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: '12m', label: 'Últimos 12 meses' },
    { value: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Última atualização: {lastUpdate.toLocaleString('pt-BR')}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Dashboard Sections */}
      <AcquisitionMetrics />
      <EngagementMetrics />
      <FinancialMetrics />
      <RetentionMetrics />
    </div>
  );
};

export default Dashboard;
