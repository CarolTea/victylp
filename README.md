# VicTy

> **Invest in what you believe.**
>
> Transforme ideias em estratégias. Entenda suas escolhas. Invista nos seus termos.

As pessoas têm opiniões sobre o futuro, mas transformar uma convicção em uma decisão de investimento exige conhecimento sobre ativos, riscos e mercados. **A VicTy constrói essa ponte:** parte de uma ideia, identifica as exposições econômicas envolvidas e apresenta uma composição que a pessoa consegue compreender e ajustar.

Nossa visão é tornar essas estratégias também compartilháveis: descobrir ideias de outros criadores, entender seus fundamentos, adaptá-las e decidir como participar. Pelo aplicativo da VicTy ou, futuramente, dentro de wallets e plataformas parceiras.

**Built by women. Built for independent decisions.**

[Conheça a VicTy](https://victy.finance) · [Experimente a demo](https://victy.finance/demo) · [Roadmap](#roadmap) · [Desenvolvimento local](#desenvolvimento-local)

## Da convicção à composição

> “Acredito que a inteligência artificial vai aumentar a demanda por energia.”

A VicTy ajuda a explorar o que essa ideia significa economicamente, quais instrumentos do catálogo podem representá-la e onde essa representação é limitada. Cada ativo vem acompanhado de uma explicação sobre seu papel e seus riscos.

1. **Expresse uma convicção.** Escreva sua ideia e responda às perguntas de esclarecimento quando necessário.
2. **Entenda a interpretação.** Revise as exposições econômicas identificadas e suas limitações.
3. **Explore a composição.** Examine os ativos propostos, ajuste os pesos e faça perguntas à VicTy.
4. **Aprove uma simulação.** Conecte uma wallet compatível e assine uma mensagem de aprovação.
5. **Salve sua tese.** Entre por e-mail para acessar suas teses em um dashboard privado, com acompanhamento ilustrativo.

A unidade da experiência é a tese: o usuário deve compreender por que cada instrumento está ali antes de decidir sobre ele.

## Três pilares

| Pilar | Proposta | Estágio neste repositório |
| --- | --- | --- |
| **Thesis Engine** | Traduzir convicções em composições compreensíveis, com fundamentos e limitações. | Implementado na demo, com integração de IA e catálogo curado para simulação. |
| **SocialFi** | Descobrir, compartilhar e adaptar estratégias de criadores e comunidades. | Interface demonstrativa, exemplos e publicação em memória durante a sessão. Rede persistente e remuneração estão no roadmap. |
| **API-first** | Levar a inteligência da VicTy a wallets, aplicativos, fintechs e agentes. | Direção de arquitetura e distribuição. Ainda não há uma API pública para parceiros neste repositório. |

## O que funciona hoje

Este repositório contém o **MVP demonstrativo da VicTy**, desenvolvido para hackathon. Ele reúne a aplicação web e suas funções de servidor.

| Recurso | Implementação atual |
| --- | --- |
| Landing page e early access | Apresentação do produto e cadastro com persistência. |
| Conversa com IA | Integração com OpenAI para esclarecimento, interpretação, composição e explicações, mediante configuração do servidor. |
| Catálogo de instrumentos | Seleção curada e validação dos ativos propostos. Preços de referência são dados fixos de demonstração. |
| Sessões da demo | Persistência de sessões anônimas com credenciais próprias. |
| Wallet Solana | Descoberta, conexão e assinatura real de mensagem, com verificação criptográfica no servidor. |
| Conta e teses privadas | Login por e-mail, salvamento de teses e consultas restritas ao proprietário. |
| Dashboard | Composição salva e desempenho simulado determinístico. |
| Estratégias públicas | Exemplos demonstrativos e publicação temporária na sessão aberta. |

**A demo não executa investimentos reais.** A assinatura da wallet acontece fora da blockchain: não envia transações, não realiza swaps e não movimenta recursos. A indicação `solana:devnet` define o contexto da aprovação; não é prova de execução on-chain. Não é necessário saldo de SOL para assinar essa mensagem.

As rotas identificadas como **Jupiter demo**, os preços e o desempenho são simulados. A presença de um instrumento no catálogo não comprova disponibilidade de negociação na Solana, liquidez ou elegibilidade do usuário. Esses pontos precisam ser verificados antes da integração de execução real.

## Princípios do produto

- **Entender antes de investir.** Explicar a relação entre tese, instrumento e risco em linguagem acessível.
- **Decisão do usuário.** Alterações propostas pela IA dependem de revisão e aplicação explícita. A execução futura será autorizada individualmente pela wallet.
- **Controle dos ativos.** A arquitetura proposta é não custodial; o aplicativo não solicita chaves privadas.
- **Catálogo delimitado.** A IA trabalha com candidatos curados, e o servidor valida os ativos e as alocações retornadas.
- **Limitações visíveis.** Uma tese sem cobertura suficiente deve receber uma explicação, sem preencher a composição com ativos sem relação com a ideia.
- **Resultados identificados.** Simulações e dados ilustrativos não representam rentabilidade observada.

## Arquitetura

```text
Aplicação React / TanStack Start
  ├── Landing page e descoberta de estratégias
  ├── Demo: convicção → interpretação → composição
  ├── Wallet: conexão e assinatura de mensagem no navegador
  └── Dashboard privado
          │
          ▼
Funções de servidor TanStack
  ├── Thesis Engine → provedor OpenAI + validação do catálogo
  ├── Sessões, desafios e verificação de aprovação
  └── Autenticação e persistência → Supabase / PostgreSQL
```

As interfaces de provedores separam IA, wallet, catálogo, preços e execução da interface visual. Isso permite evoluir as integrações preservando a experiência do usuário.

| Camada | Tecnologia |
| --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS 4, Radix UI e Motion |
| Aplicação e rotas | TanStack Start, TanStack Router e React Query |
| Build | Vite e configuração integrada ao Lovable |
| IA | SDK OpenAI, saídas estruturadas e validação com Zod |
| Dados e autenticação | Supabase, PostgreSQL e políticas de acesso por proprietário |
| Migrações | SQL versionado em `drizzle/migrations/` |
| Wallet Solana | `@solana/kit` e `@solana/kit-plugin-wallet` |
| Testes | Bun, testes TypeScript e validação de persistência em PostgreSQL isolado |

### Solana no MVP

O cliente usa `createClient().use(walletSigner(...))` para descobrir e conectar wallets compatíveis com `solana:signMessage`. O servidor emite um desafio com nonce, prazo de validade e vínculo à sessão, origem, wallet e operação simulada. A assinatura Ed25519 é verificada antes do consumo único do desafio.

Essa aprovação é independente do login por e-mail utilizado para salvar e consultar teses. Não há programa on-chain próprio nem integração de swap em produção neste repositório.

Detalhes: [aprovação por wallet](docs/solana-demo-wallet.md) e [Thesis Engine](docs/thesis-engine.md).

## Desenvolvimento local

### Pré-requisitos

- Bun instalado; o repositório versiona `bun.lock` e configura a instalação em `bunfig.toml`.
- Acesso a um projeto Supabase/Lovable Cloud com o esquema e a autenticação configurados.
- Chave OpenAI para utilizar a IA real, ou configuração explícita de mock para desenvolvimento.
- Wallet compatível com assinatura de mensagens e contexto Solana Devnet para testar a aprovação.

### Instalação

```sh
git clone https://github.com/CarolTea/victylp.git
cd victylp
bun install --frozen-lockfile
```

Crie `.env.local`, ignorado pelo Git, com os valores do seu ambiente:

```dotenv
# Configuração pública utilizada pelo navegador
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL

# Configuração do servidor
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_DE_SERVIDOR

# IA: consulte também .env.ai.example
AI_PROVIDER=openai
OPENAI_API_KEY=SUA_CHAVE_OPENAI
# Opcional: OPENAI_MODEL pode substituir o modelo padrão do código.
```

Mantenha `SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY` exclusivamente no servidor, sem prefixo `VITE_`. Configure os endereços de retorno do login por e-mail para a origem local e a origem publicada.

O banco precisa conter as migrações de [`drizzle/migrations/`](drizzle/migrations/). A instalação de dependências não provisiona o banco. Confira o histórico aplicado e utilize o fluxo de migrações existente no Lovable/Drizzle; não reaplique migrações nem use `supabase db push` como substituto desse histórico.

```sh
bun run dev
```

Abra o endereço informado pelo Vite. As rotas principais são `/`, `/demo`, `/auth` e `/dashboard`.

Para desenvolver com respostas de IA locais, use `AI_PROVIDER=mock` com `NODE_ENV=development`. Esse modo não substitui o banco nem os demais serviços. Falhas da integração real não ativam respostas mock automaticamente.

### Verificação

```sh
bun test tests/
bunx tsc --noEmit
bun run lint
bun run build
```

Os testes automatizados não substituem a validação do login por e-mail, da extensão de wallet e do banco configurado. Consulte o [roteiro de persistência](docs/thesis-persistence-validation.md) para testes com contas distintas e banco descartável. Esse documento também registra resultados e limitações de verificações anteriores; eles não garantem o estado do deploy atual.

Os scripts `tests/evaluate-thesis.ts` e `tests/evaluate-scope.ts` são avaliações opcionais com chamadas pagas de IA, ativadas explicitamente com `--live` e credenciais. Não são necessários para explorar a interface.

### Estrutura

```text
src/
├── routes/                # Landing, demo, autenticação e dashboard
├── components/            # Interface e componentes reutilizáveis
├── lib/
│   ├── ai/                # Engine, prompts, schemas e provedor de IA
│   ├── assets/            # Catálogo curado e seleção de candidatos
│   ├── demo/              # Sessões, provedores e aprovação da simulação
│   ├── strategies/        # Exemplos e publicação social em memória
│   ├── thesis/            # Tipos, consultas e desempenho ilustrativo
│   └── wallet/            # Integração Solana no navegador
└── integrations/supabase/ # Clientes, autenticação e tipos do banco
drizzle/migrations/        # Histórico SQL
tests/                     # Testes e avaliações opcionais
docs/                      # Decisões técnicas e roteiros de validação
```

## Roadmap

As fases abaixo indicam prioridades de evolução, sem compromisso de datas. Os itens concluídos descrevem implementações presentes no código; a disponibilidade depende da configuração e validação do ambiente.

### 1. Experiência demonstrativa — base implementada

- [x] Identidade visual, landing page e cadastro de early access.
- [x] Jornada interativa de convicção, esclarecimento e composição.
- [x] Thesis Engine com integração de IA, catálogo curado e validação das respostas.
- [x] Persistência de sessões anônimas.
- [x] Conexão de wallet e aprovação criptográfica de simulações.
- [x] Login por e-mail, teses privadas e dashboard com desempenho ilustrativo.
- [x] Interface demonstrativa de descoberta e publicação de estratégias na sessão.
- [ ] Consolidar a validação ponta a ponta do ambiente publicado e o roteiro de apresentação.

### 2. Execução e acompanhamento reais

- [ ] Verificar mints, disponibilidade, elegibilidade e liquidez dos instrumentos executáveis.
- [ ] Integrar preços e cotações reais, com validade e custos explícitos.
- [ ] Integrar Jupiter para compras e vendas individuais autorizadas pela wallet.
- [ ] Tratar rejeição, expiração, falha e confirmação de transações sem duplicar operações.
- [ ] Associar transações confirmadas às teses e reconciliar quantidades executadas.
- [ ] Substituir o desempenho ilustrativo por acompanhamento baseado em dados verificáveis.

### 3. SocialFi — estratégias como conteúdo compartilhável

- [ ] Persistir estratégias públicas, autoria e versões.
- [ ] Permitir descobrir, acompanhar e adaptar estratégias de outros criadores.
- [ ] Separar histórico de simulação e resultados de execução verificados.
- [ ] Definir critérios transparentes para descoberta e rankings.
- [ ] Validar atribuição de execuções, regras e remuneração de criadores.

### 4. API-first — distribuição por parceiros

- [ ] Expor contratos versionados para interpretação e composição de teses.
- [ ] Oferecer autenticação de parceiros, quotas, observabilidade e documentação.
- [ ] Disponibilizar exemplos de integração com wallets, aplicativos e agentes.
- [ ] Validar modelo comercial e pilotos com parceiros.

O [roadmap original de implementação](roadmap.md) registra os marcos iniciais da interface e da persistência.

## Modelo de negócio em validação

A visão comercial considera três fontes potenciais de receita:

1. **Execuções:** taxa transparente sobre volume efetivamente executado pelas integrações da VicTy.
2. **Estratégias:** participação de criadores na receita de execuções atribuídas às suas estratégias.
3. **API:** cobrança por uso, licenciamento ou participação na receita de integrações com parceiros.

Preços, divisão de receitas e viabilidade econômica ainda estão em validação. A demo não implementa cobrança nem remuneração de criadores. A métrica proposta, **Thesis Volume**, representa o volume financeiro realmente executado a partir de teses; valores simulados não contam como esse volume.

## Documentação e colaboração

- [Thesis Engine e catálogo](docs/thesis-engine.md)
- [Wallet Solana e aprovação da simulação](docs/solana-demo-wallet.md)
- [Persistência, isolamento entre usuários e testes manuais](docs/thesis-persistence-validation.md)
- [Diretrizes do repositório](AGENTS.md)
- [Projeto no Lovable](https://lovable.dev/projects/1f73bb9a-bf1c-4531-8dd9-02e54c881eea)

Este repositório está conectado ao Lovable. Preserve o histórico publicado: não faça force push nem reescreva commits já enviados. Alterações na branch conectada sincronizam com o editor. Ao contribuir, mantenha integrações atrás das interfaces de provedores e preserve a autorização por proprietário no acesso às teses.

---

A VicTy está em desenvolvimento. Composições e simulações não constituem promessa de retorno. Instrumentos possuem riscos e condições próprias de acesso, que precisarão ser avaliados para a execução real.
