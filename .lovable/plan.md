# VicTy: da tese à estratégia

## Objetivo e limites
Atualizar a narrativa do site e os estados da demo, preservando a identidade visual atual. VicTy passa a apresentar também a direção de Strategy Network e o posicionamento “The infrastructure for thesis-driven investing.”, sem tornar a primeira tela institucional ou API-first.

Não alterar Thesis Engine, OpenAI, autenticação, wallet, execução, serviços de salvamento ou arquitetura de persistência. Não criar tabelas, migrations, follow/fork reais, ranking, perfis públicos ou distribuição de receita.

## 1. Página inicial
- Manter “Invest in what you believe.” e “Invest in a thesis, not a ticker.”.
- Trocar o texto de apoio por “Turn any belief about the future into an explainable, investable onchain strategy.”.
- CTA principal “Build your thesis” abre a demo; “Explore strategies” leva à seção de descoberta.
- Apresentar “FROM BELIEF TO STRATEGY” com cinco etapas: “What do you believe?” → “VicTy maps the exposures” → “Finds assets that represent them” → “Builds an editable strategy” → “You decide what to invest in”. Integrar essa história às seções existentes, evitando explicações repetidas.
- Adicionar “Your thesis doesn't have to stay private.” com o texto do briefing e quatro cards: Create, Publish, Build a track record e Earn. Em Earn, usar exatamente “Creators may earn a share of VicTy execution revenue when others invest through their strategies.”, sem percentual ou promessa de renda. Identificar os recursos sociais como direção futura do produto.
- Adicionar “Explore strategies” com @maya — **The Robotics Decade** e @lucas — **Brazil Rate Cycle**, resumos e temas fornecidos. Criadores fictícios, desempenho simulado e seguidores de demonstração serão explicitamente identificados.
- Mais abaixo, incluir “Built to work anywhere.”, o texto institucional fornecido e o fluxo VicTy App / AI Agents / Wallets / Fintechs / Creator Platforms → VicTy API → Thesis Engine → Strategies → Execution.
- Preservar logos, personagens, seção da equipe, formulário real de early access e suas confirmações.

## 2. Tela inicial da demo e prévias
- Manter os quatro exemplos atuais de tese, sob “Thesis examples”.
- Incluir “Or explore a public strategy” com os mesmos exemplos de @maya e @lucas.
- Ao escolher uma estratégia, abrir uma prévia sem chamar a IA nem modificar a sessão de investimento: criador, título, tese, exposições, composição ilustrativa, justificativa, riscos e desempenho simulado.
- “Use as inspiration” preenche o campo de tese com a ideia escolhida; a jornada existente começa apenas quando o usuário confirmar.
- “Build your own thesis” retorna ao campo de entrada. Follow e Fork ficam desabilitados com “Coming soon”.
- A prévia será reutilizada na página inicial e na demo, sem exigir uma nova página pública ou acesso a dados privados.

## 3. Estado de publicação após salvar
O fluxo atual salva pelo painel e abre o detalhe privado. Adicionar nesse detalhe, após o salvamento existente, as opções “Keep private” e “Publish strategy”, sem modificar esse fluxo.

- A estratégia permanece privada por padrão.
- “Publish strategy” abre um formulário com nome da estratégia, descrição curta, nome do criador e Visibility: Public.
- Confirmar com “Your strategy is live.”, acompanhado de identificação clara de **publicação de demonstração, disponível somente nesta sessão**.
- “View public strategy” abre a prévia local; “Share” compartilha ou copia um resumo textual identificado como demonstração. Não gerar um link que prometa acesso público a uma estratégia privada.
- Conforme sua escolha, publicações demonstrativas existem apenas enquanto a aplicação está aberta: aparecem na lista mista da demo durante a navegação, desaparecem ao atualizar e são removidas ao sair ou trocar de conta. Não usar armazenamento persistente para esse estado.
- Manter as publicações demonstrativas separadas dos exemplos fictícios e dos registros privados salvos no banco.

## 4. Terminologia e apresentação
- Thesis descreve a crença/ideia; Strategy descreve sua composição estruturada e potencialmente compartilhável.
- Preferir “Build strategy”, “Save strategy” e “Publish strategy” nos pontos correspondentes, preservando “Build your thesis” na primeira tela.
- Usar os componentes, cores, fontes e animações atuais, com movimentos discretos e respeito à preferência de movimento reduzido.
- Ajustar somente textos e apresentação nas telas privadas quando necessário para manter essa distinção; não alterar contratos de dados.

## Detalhes técnicos
- Criar um modelo frontend `PublicStrategy` com id, creatorHandle, creatorName, title, thesisSummary, themes, visibility, simulatedPerformance, followers e isDemo; complementar com exposições, composição, justificativa e riscos.
- Criar dados estáticos dos dois exemplos e componentes reutilizáveis para cards, lista mista, prévia e diálogo de publicação.
- Manter as publicações de sessão em estado React compartilhado entre as páginas, sem localStorage, sessionStorage ou novas chamadas ao banco; limpar esse estado na mudança de usuário.
- Converter os dados já carregados do detalhe privado para a prévia somente após a confirmação local de publicação. Não buscar registros privados por uma página pública nem incluir seus identificadores, credenciais ou conteúdo em URLs.
- Atualizar metadados específicos das páginas cujo conteúdo mudar e documentar a separação entre apresentação social e serviços existentes.

## Validação e entrega
- Verificar primeira tela, descoberta e exemplos na demo, inclusive prévia → inspiração → início da jornada existente.
- Verificar com uma sessão autenticada o detalhe salvo → manter privado/publicar → confirmação → prévia → compartilhamento textual → lista mista.
- Confirmar que atualizar remove apenas o estado demonstrativo de publicação e não interfere nas estratégias privadas já salvas; conferir saída/troca de conta.
- Conferir telas largas e estreitas, texto sem sobreposição, navegação por teclado, formulários e ausência de erros.
- Entregar um resumo das seções alteradas, mudanças da demo, componentes reutilizáveis, exemplos adicionados e estado de publicação preparado, confirmando que backend, autenticação, wallet, banco e OpenAI não foram alterados.