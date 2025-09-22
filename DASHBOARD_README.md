# Dashboard SaaS - Componente React

Um dashboard moderno e completo para aplicações SaaS, construído com React, TailwindCSS, Recharts e shadcn/ui.

## 🚀 Funcionalidades

### 📈 Indicadores de Aquisição
- **Novos usuários**: Gráfico de linha mostrando tendência diária
- **CAC (Custo de Aquisição)**: Valor médio gasto para adquirir um cliente
- **Taxa de conversão**: Conversão de usuários free para pago
- **Origem dos usuários**: Gráfico de pizza com distribuição por canal (Orgânico, Pago, Referral)

### 👥 Indicadores de Engajamento
- **Usuários totais, DAU, MAU**: Métricas básicas de usuários
- **DAU/MAU Ratio**: Barra visual mostrando engajamento relativo
- **Tempo médio de sessão**: Gráfico de barras por dia da semana
- **Funcionalidades mais utilizadas**: Tabela com top 5 recursos
- **NPS (Net Promoter Score)**: Indicador visual com cores dinâmicas

### 💰 Indicadores Financeiros
- **MRR/ARR**: Receitas recorrentes mensais e anuais (destaques principais)
- **ARPU**: Receita média por usuário
- **LTV**: Lifetime Value do cliente
- **Margem Bruta**: Percentual de lucro

### 🔄 Indicadores de Retenção & Churn
- **Churn Rate**: Taxa de cancelamento (destaque vermelho)
- **Revenue Churn**: Gráfico de linha mostrando perda de receita ao longo do tempo

## 🛠️ Tecnologias Utilizadas

- **React 18**: Framework principal
- **TailwindCSS**: Estilização e responsividade
- **Recharts**: Gráficos interativos
- **shadcn/ui**: Componentes de UI modernos
- **Lucide React**: Ícones consistentes
- **TypeScript**: Tipagem segura

## 📦 Instalação

### 1. Instalar dependências

```bash
# Instalar Recharts para gráficos
npm install recharts

# Ou com yarn
yarn add recharts
```

### 2. Configurar shadcn/ui

Se ainda não configurou o shadcn/ui no projeto:

```bash
npx shadcn-ui@latest init
```

### 3. Instalar componentes necessários

```bash
npx shadcn-ui@latest add card table
```

## 📁 Estrutura de Arquivos

```
client/src/components/
├── Dashboard.tsx              # Componente principal do dashboard
├── DashboardExample.tsx       # Exemplo de uso
└── ui/
    ├── card.tsx              # Componentes de card (shadcn/ui)
    └── table.tsx             # Componentes de tabela (shadcn/ui)
```

## 🎯 Como Usar

### Integrado no Painel Admin

O dashboard está integrado na aba **"Dashboard"** do painel de administração. Para acessá-lo:

1. Faça login como administrador
2. Vá para **Configurações > Admin > Acessar Gerenciamento Completo**
3. No painel admin, clique na aba **"📊 Dashboard"**
4. Use o **seletor de período** para filtrar dados
5. Clique em **"Atualizar"** para recarregar dados em tempo real

### Uso Independente

Se quiser usar o dashboard como componente separado:

```tsx
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}
```

### Integração com Backend

O dashboard vem com dados mockados. Para conectar com uma API real:

```tsx
import { useQuery } from '@tanstack/react-query';

// Substitua mockData por dados da API
const { data: dashboardData, isLoading, error } = useQuery({
  queryKey: ['dashboard-metrics'],
  queryFn: () => fetch('/api/dashboard/metrics').then(res => res.json()),
});

// Use dashboardData ao invés de mockData
```

## 🎨 Personalização

### Cores e Tema

O dashboard usa classes Tailwind padrão. Para personalizar:

```tsx
// Modificar cores dos cards
<Card className="border-blue-200 bg-blue-50">

// Alterar cores dos gráficos
<Line type="monotone" dataKey="daily" stroke="#8B5CF6" />
```

### Layout Responsivo

O dashboard é totalmente responsivo:

- **Mobile**: Cards empilhados, gráficos ajustados
- **Tablet**: 2-3 colunas de cards
- **Desktop**: Layout completo com 4 colunas

### Adicionar Novos Indicadores

Para adicionar novos indicadores:

1. Adicione dados ao `mockData`
2. Crie um novo componente de seção
3. Importe e adicione ao componente `Dashboard`

## 📊 Formatação de Dados

O dashboard inclui funções utilitárias para formatação:

- `formatCurrency()`: Formata valores em reais (pt-BR)
- `formatNumber()`: Formata números com separadores
- `formatPercent()`: Formata percentuais

## 🔄 Atualização em Tempo Real

Para implementar atualização em tempo real:

```tsx
import { useQuery } from '@tanstack/react-query';

const Dashboard = () => {
  const { data, refetch } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  return (
    // ... componente
  );
};
```

## 📱 Responsividade

O dashboard usa um sistema de grid responsivo:

- `grid-cols-1 md:grid-cols-3`: 1 coluna mobile, 3 desktop
- `lg:grid-cols-2`: 2 colunas em telas grandes
- Gráficos usam `ResponsiveContainer` para se ajustar automaticamente

## 🎯 Métricas Incluídas

### 📈 Aquisição
- Novos usuários diários/mensais
- CAC (Customer Acquisition Cost)
- Taxa de conversão free→pago
- Distribuição por canal (gráfico pizza)

### 👥 Engajamento
- Métricas de usuários ativos (DAU/MAU)
- Tempo médio de sessão (gráfico barras)
- Funcionalidades mais populares (tabela)
- Satisfação do usuário (NPS)

### 💰 Financeiro
- **MRR** (verde escuro) - Receita mensal recorrente
- **ARR** (verde claro) - Receita anual recorrente
- **LTV** - Lifetime Value
- **ARPU** - Receita por usuário
- **Margem Bruta** - Margem de lucro
- **Churn Rate** (vermelho) - Taxa de cancelamento

### 🔄 Retenção
- **Churn Rate** (vermelho) - Taxa de cancelamento mensal
- **Revenue Churn** - Perda de receita (gráfico linha)

## 🚀 Próximos Passos

Para expandir o dashboard:

1. **Filtros de Data**: Adicionar seletores de período
2. **Comparação**: Métricas de comparação mês a mês
3. **Alertas**: Notificações para métricas críticas
4. **Drill-down**: Detalhes ao clicar em métricas
5. **Export**: Funcionalidade de exportar dados
6. **Tempo Real**: WebSocket para atualizações live

## 📄 Licença

Este componente é parte do projeto LibreChat. Consulte a licença principal do projeto.
