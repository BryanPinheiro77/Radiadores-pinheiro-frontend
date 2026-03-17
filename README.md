
# Radiadores Pinheiro — Frontend

Interface web do sistema de gestão operacional da oficina Radiadores Pinheiro.

## Tecnologias

- React 19 + Vite 8
- TypeScript
- Tailwind CSS v3
- Recharts
- Axios
- React Router DOM

## Pré-requisitos

- Node.js 18+
- npm

## Instalação
```bash
git clone https://github.com/BryanPinheiro77/Radiadores-pinheiro-frontend
cd Radiadores-pinheiro-frontend
npm install --legacy-peer-deps
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:
```env
VITE_API_URL=http://localhost:8080
```

Em produção aponta para a URL do backend no Railway.

## Rodando localmente
```bash
npm run dev
```

Acessa em `http://localhost:5173`

## Build para produção
```bash
npm run build
```

## Deploy

O projeto é hospedado na **Vercel**. O deploy é automático a cada push na branch `main`.

## Estrutura do projeto
```
src/
├── api/
│   └── axios.ts          # Instância do Axios com interceptor JWT
├── assets/
│   └── logo-radiadores.jpg
├── components/
│   └── layout/
│       ├── Layout.tsx    # Layout base com sidebar
│       └── Sidebar.tsx   # Navegação lateral
├── pages/
│   ├── Login.tsx         # Autenticação
│   ├── Dashboard.tsx     # Painel principal com gráficos
│   ├── Produtos.tsx      # Gestão de estoque
│   ├── Vendas.tsx        # Registro de vendas e serviços
│   ├── Despesas.tsx      # Controle de despesas
│   ├── Reposicao.tsx     # Pedidos de reposição com PDF
│   ├── Precificacao.tsx  # Calculadora de precificação
│   └── Relatorios.tsx    # Relatórios com filtros e gráficos
├── routes/
│   └── PrivateRoute.tsx  # Proteção de rotas autenticadas
├── types/
│   └── index.ts          # Interfaces TypeScript
└── App.tsx               # Rotas da aplicação
```

## Funcionalidades

- **Login** com autenticação JWT
- **Dashboard** com indicadores do mês, gráfico de faturamento vs despesas e saldo acumulado
- **Produtos** com busca por nome, filtro por categoria e controle de estoque mínimo
- **Vendas** com suporte a produtos e serviços, desconto em R$ ou %, custo de serviço opcional
- **Despesas** com filtro por período, categoria e descrição, suporte a despesas únicas, recorrentes e parceladas
- **Reposição de estoque** com sugestões automáticas, pedidos manuais e geração de PDF
- **Precificação** com cálculo de markup e margem
- **Relatórios** com filtros por período, gráficos por produto e categoria

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API backend |

## Licença
