# SetTake CRM

# PROMPT LOVABLE — CRM SETTAKE

Crie um CRM completo chamado **SetTake CRM** conectado ao meu projeto Supabase já configurado. Todas as tabelas e views estão criadas — não gere nenhuma migration, apenas leia e escreva nas tabelas existentes.

---

## CONEXÃO SUPABASE

Conecte ao **mesmo projeto Supabase** do ERP financeiro já existente. Todas as tabelas abaixo já existem.

---

## SCHEMA EXISTENTE NO SUPABASE

### Tabelas principais do CRM:

**crm_funil_etapas**: id, funil (enum: 'leads' | 'vendas' | 'nutricao'), nome, ordem, cor (hex), tipo_final (text: 'qualificado' | 'desqualificado' | 'ganho' | 'perdido' | null)

**crm_leads**: id, nome, whatsapp, email, segmento (enum), origem (enum), quem_indicou, instagram, etapa_id (FK → crm_funil_etapas), convertido (boolean), pessoa_id (FK → pessoas, preenchido na conversão), observacoes, criado_em, atualizado_em

**pessoas** (tabela expandida — também usada pelo ERP financeiro):
id, nome, tipo (enum: 'Cliente' | 'Fornecedor'), whatsapp, email, segmento (enum), origem (enum), quem_indicou, instagram, area_atuacao (enum), endereco, cpf_cnpj, aniversario (date), etapa_nutricao_id (FK → crm_funil_etapas), lead_origem_id (FK → crm_leads), criado_em

**crm_oportunidades**: id, nome, etapa_id (FK → crm_funil_etapas), pessoa_id (FK → pessoas), origem (enum), item_id (FK → item — serviços do ERP), valor (numeric), resultado (enum: 'Ganho' | 'Perdido'), motivo_perda, data_fechamento, criado_em, atualizado_em

**crm_interacoes**: id, tipo (enum: 'Nota' | 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião'), descricao, lead_id?, pessoa_id?, oportunidade_id?, criado_em

**crm_tarefas**: id, titulo, descricao, prioridade (enum: 'Baixa' | 'Média' | 'Alta' | 'Urgente'), status (enum: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Cancelada'), prazo (timestamptz), lead_id?, pessoa_id?, oportunidade_id?, concluida_em, criado_em, atualizado_em

### Tabelas do ERP (somente leitura no CRM):
**item**: id, grupo_id, nome — buscar apenas onde natureza_id = 1 (serviços de receita)
**grupo**: id, natureza_id, nome

### Enums disponíveis:
- **crm_segmento**: 'Médico', 'Clínica', 'Hospital', 'Profissional Liberal', 'Advocacia', 'Financeiro', 'Estética', 'Arquitetura', 'Imobiliário', 'Indústria', 'Comércio', 'Outros'
- **crm_origem**: 'Orgânico WPP', 'Orgânico Instagram', 'Prospecção WPP', 'Prospecção Instagram', 'Prospecção Ativa', 'Indicação Cliente', 'Indicação Parceiro', 'Meta ADS'
- **crm_area_atuacao**: 'Pediatra', 'Obstetra / Ginecologista', 'Dermatologista', 'Cirurgião Plástico', 'Cardiologista', 'Endocrinologista', 'Oftalmologista', 'Ortopedista', 'Mentorias', 'Psiquiatra', 'Dentista', 'Psicólogo(a)', 'Esteticista Corporais / Faciais', 'Cabeleireiro(a)', 'Educador Físico', 'Corretor de Imóveis', 'Advogado', 'Contador', 'Serviços'

### Views disponíveis (somente leitura):
- **crm_pipeline_leads**: leads com etapa, dias_no_funil, dias_na_etapa, tarefas_pendentes
- **crm_pipeline_vendas**: oportunidades com pessoa, serviço, ltv_atual (do financeiro), dias_na_etapa, tarefas_pendentes
- **crm_pipeline_nutricao**: pessoas no funil de nutrição com ltv_total integrado do financeiro
- **crm_aniversariantes**: pessoas com aniversário nos próximos 30 dias, com dias_para_aniversario e ltv_total
- **crm_tarefas_pendentes**: tarefas em aberto com contexto de lead/pessoa/oportunidade, flag atrasada, prioridade_peso
- **crm_metricas_conversao**: KPIs mensais — leads, conversões, valor ganho, ticket médio, breakdown por origem
- **crm_valor_pipeline**: valor total e ticket médio por etapa do funil de vendas

---

## DESIGN SYSTEM

**Tema:** escuro exclusivo — igual ao ERP já existente.
- Fundo principal: `#0F1117`
- Superfície de card: `#1A1D27`
- Bordas: `#2A2D3E`
- Texto primário: `#F0F2F8`
- Texto secundário: `#8B8FA8`
- **Accent principal (brand):** `#E8B800` (amarelo dourado)
- Gradient da marca: `linear-gradient(135deg, #E8B800 0%, #F5820A 100%)`
- Positivo/ganho: `#22C55E`
- Negativo/perdido: `#EF4444`
- Alerta/pendente: `#F59E0B`
- Violeta para destaques neutros: `#8B5CF6`

**Tipografia:** Inter. Sidebar fixa 240px, logo "SC" com gradient da marca.

**Cards de Kanban:**
- Fundo `#1A1D27`, borda `1px solid #2A2D3E`, border-radius `10px`
- Borda esquerda colorida `4px` com a cor da etapa
- Hover: borda `#E8B800` com 30% opacidade, leve elevação

**Badges de prioridade:**
- Urgente: fundo `#EF4444` 20% opacidade, texto `#EF4444`
- Alta: fundo `#F59E0B` 20% opacidade, texto `#F59E0B`
- Média: fundo `#3B82F6` 20% opacidade, texto `#3B82F6`
- Baixa: fundo `#6B7280` 20% opacidade, texto `#6B7280`

**Badges de origem:** pill com fundo `#2A2D3E`, texto `#8B8FA8`, ícone correspondente (📱 WPP, 📸 Instagram, 🎯 ADS, 🤝 Indicação)

---

## ESTRUTURA DE PÁGINAS

### 1. DASHBOARD (`/`)

**Header:** "Bom dia, SetTake 👋" com a data atual.

**Linha 1 — Cards de KPIs** (4 cards horizontais, dados de `crm_metricas_conversao` do mês atual):
- Total de Leads no mês (ícone Users)
- Taxa de Conversão Lead→Oportunidade em % (ícone TrendingUp, colorido em amarelo)
- Taxa de Conversão Oportunidade→Ganho em % (ícone Target, colorido em verde)
- Valor Ganho no mês em R$ (ícone DollarSign, colorido em verde)

**Linha 2 — Pipeline + Aniversariantes** (dois painéis lado a lado):

*Painel esquerdo — Valor por Etapa (dados de `crm_valor_pipeline`):*
- Lista vertical de etapas do funil de vendas
- Cada etapa: bolinha colorida com a cor da etapa, nome, barra de progresso proporcional ao valor, valor total em R$ e quantidade de oportunidades
- Total do pipeline no rodapé em amarelo bold

*Painel direito — Aniversariantes (dados de `crm_aniversariantes`):*
- Título "🎂 Aniversariantes — Próximos 30 dias"
- Lista de cards compactos: avatar com inicial do nome, nome, data do aniversário formatada (ex: "dia 23"), dias_para_aniversario ("em 3 dias" em amarelo, "Hoje! 🎉" em verde pulsante se = 0), segmento, LTV em verde pequeno
- Botão de WhatsApp ao lado de cada card que abre `https://wa.me/55{whatsapp}` (remover formatação do número)
- Se vazio: "Nenhum aniversariante nos próximos 30 dias 🎈"

**Linha 3 — Tarefas do Dia + Métricas de Origem** (dois painéis lado a lado):

*Painel esquerdo — Tarefas para Hoje (dados de `crm_tarefas_pendentes` filtrando prazo = hoje ou atrasadas):*
- Título "📋 Foco do Dia"
- Lista de tarefas com: badge de prioridade, título, contexto (lead/pessoa/oportunidade), horário do prazo, botão "Concluir" que faz UPDATE status = 'Concluída'
- Tarefas atrasadas com fundo vermelho escuro `#2D0F0F` e badge "⚠ Atrasada"
- Máximo 8 itens, link "Ver todas" que vai para `/tarefas`

*Painel direito — Origem dos Leads no Ano (dados de `crm_metricas_conversao` somados):*
- Título "Origem dos Leads"
- Gráfico de barras horizontais (Recharts) mostrando total por origem
- Cores por origem: ADS em amarelo, Instagram orgânico em violeta, WPP orgânico em verde, Indicação em azul
- Abaixo: taxa de conversão de cada origem (convertidos/total × 100%)

---

### 2. FUNIL DE LEADS (`/leads`)

**Kanban board** com dados de `crm_pipeline_leads`.

**Header da página:**
- Título "Funil de Leads"
- Contador total de leads ativos (não convertidos)
- Botão primário "+ Novo Lead" (amarelo, abre drawer)
- Busca rápida por nome ou WhatsApp

**Colunas do Kanban** (uma por etapa do funil 'leads', ordenadas por `ordem`):
- Header da coluna: nome da etapa, cor como dot, contagem de cards, valor não se aplica aqui
- Cards arrastáveis entre colunas (drag and drop)
- Scroll vertical dentro de cada coluna quando ultrapassar a altura

**Card de Lead:**
- Nome em destaque
- Badge de segmento
- Badge de origem (com ícone)
- WhatsApp clicável (abre wa.me)
- "há X dias" na etapa atual (dias_na_etapa) em texto secundário pequeno
- Ícone de tarefa pendente em amarelo se tarefas_pendentes > 0 (com contador)
- Menu de ações (três pontos): Editar, Converter para Contato (só em Qualificado), Mover para Nutrição, Excluir
- Ao clicar no card: abre painel lateral direito com detalhes completos

**Comportamento ao arrastar para "Qualificado" (tipo_final = 'qualificado'):**
- Exibe modal de conversão (ver seção Fluxos Críticos abaixo)

**Comportamento ao arrastar para "Desqualificado" (tipo_final = 'desqualificado'):**
- Exibe modal: "Mover para Nutrição?" com seletor de etapa do funil 3
- Se confirmado: atualiza lead.etapa_id, cria pessoa se não existir, define pessoa.etapa_nutricao_id

**Drawer "Novo Lead" e "Editar Lead":**
- Nome (obrigatório)
- WhatsApp (input com máscara (00) 00000-0000)
- E-mail
- Instagram (com @ automático se não digitado)
- Segmento (select com todas as opções do enum)
- Origem (select)
- Quem indicou? (text, visível apenas quando origem = 'Indicação Cliente' ou 'Indicação Parceiro')
- Etapa (select de etapas do funil leads)
- Observações (textarea)
- Botões: Cancelar / Salvar

**Painel lateral de detalhes do Lead (ao clicar no card):**
- Header: nome, badge etapa colorida, botão "Editar" e botão "..."
- Dados: segmento, origem, whatsapp (clicável), email, instagram, quem indicou, criado_em, dias no funil
- Seção "Interações": lista de crm_interacoes vinculadas ao lead, ordenadas por criado_em DESC. Formulário inline para adicionar nova interação (tipo + descrição + botão salvar)
- Seção "Tarefas": lista de crm_tarefas vinculadas ao lead. Botão "+ Tarefa" abre mini-form inline
- Botão de destaque "Converter para Contato" (verde, só visível se etapa tipo_final = 'qualificado' ou a qualquer momento via menu)

---

### 3. FUNIL DE VENDAS (`/vendas`)

**Kanban board** com dados de `crm_pipeline_vendas`.

**Header da página:**
- Título "Funil de Vendas"
- Total do pipeline em R$ (soma de valor das oportunidades em aberto)
- Botão "+ Nova Oportunidade" (amarelo)
- Busca por nome da oportunidade ou pessoa

**Colunas do Kanban** (etapas do funil 'vendas'):
- Header da coluna: nome, cor, contagem, **soma de valor em R$** (diferencial vs leads)
- Cards arrastáveis

**Card de Oportunidade:**
- Nome da oportunidade em destaque
- Valor em R$ em amarelo bold
- Nome da pessoa/contato com avatar (inicial)
- Badge do serviço (item_id → nome do serviço)
- Badge de origem
- Dias na etapa (dias_na_etapa) em texto secundário
- LTV atual do cliente em verde pequeno (ex: "LTV R$ 8.400")
- Ícone de tarefa pendente com contador se > 0
- Menu de ações: Editar, Marcar como Ganho, Marcar como Perdido, Excluir

**Comportamento ao arrastar/marcar como "Ganho":**
- Modal: confirmar data de fechamento + campo opcional "Observações do fechamento"
- Atualiza resultado = 'Ganho', data_fechamento
- Toast: "🎉 Oportunidade ganha! Lembre de criar a transação no financeiro."

**Comportamento ao arrastar/marcar como "Perdido":**
- Modal: campo obrigatório "Motivo da perda" (texto livre)
- Toggle: "Mover contato para Nutrição?" + seletor de etapa do funil 3
- Atualiza resultado = 'Perdido', motivo_perda

**Drawer "Nova/Editar Oportunidade":**
- Nome (obrigatório)
- Pessoa (select com busca — busca em `pessoas` por nome)
- Etapa (select de etapas do funil vendas)
- Serviço (select de `item` onde natureza_id = 1, agrupado por grupo)
- Origem (select)
- Valor (input numérico, R$)
- Data de fechamento estimada (date picker)
- Botões: Cancelar / Salvar

**Painel lateral de detalhes (ao clicar no card):**
- Header: nome da oportunidade, badge de etapa, valor grande
- Dados da pessoa: nome (link para /contatos/:id), whatsapp, segmento, area_atuacao
- LTV do financeiro: valor total já pago, número de transações concluídas
- Serviço e origem
- Seção "Interações": igual ao painel de leads
- Seção "Tarefas": igual ao painel de leads
- Histórico de movimentações (quando a etapa mudou)

---

### 4. NUTRIÇÃO (`/nutricao`)

**Layout misto:** kanban simplificado ou lista agrupada por etapa (escolha o que renderizar melhor com 7 colunas).

**Use lista agrupada por etapa**, não kanban horizontal — 7 colunas ficariam apertadas.

**Header:** "Funil de Nutrição" + total de contatos em nutrição + busca

**Cada grupo de etapa:**
- Header da etapa: bolinha colorida, nome, contagem
- Cards horizontais dos contatos com: nome, segmento, area_atuacao, origem, última transação (do LTV integrado), LTV total em verde, dias desde última interação, tarefas_pendentes
- Botão "Reagendar Contato" que cria tarefa rápida vinculada à pessoa
- Drag entre grupos para mover de etapa

**"Cliente Ativo"** (etapa especial): cards com destaque em verde — esses já são clientes pagantes no financeiro. Mostrar LTV com mais destaque.

---

### 5. CONTATOS (`/contatos`)

**Tabela completa** de pessoas com todos os campos CRM.

**Filtros:** busca por nome, segmento (select), area_atuacao (select), tipo (Cliente/Fornecedor), etapa de nutrição (select).

**Tabela colunas:** Nome, Segmento, Área de Atuação, Origem, WhatsApp (clicável), LTV (do financeiro, em verde), Etapa de Nutrição (badge colorido), Aniversário, Ações.

**Botão "+ Novo Contato":** abre drawer completo com todos os campos de `pessoas`.

**Drawer "Novo/Editar Contato":**
- Nome (obrigatório)
- Tipo (Cliente / Fornecedor)
- WhatsApp (com máscara)
- E-mail
- Instagram
- CPF ou CNPJ
- Aniversário (date picker — **não exige o ano**, campo month/day opcional — mas salvar como DATE com ano fictício 1900 se o usuário não preencher o ano)
- Segmento (select)
- Área de Atuação (select)
- Origem (select)
- Quem Indicou? (text, visível apenas em Indicação)
- Endereço (textarea)
- Etapa de Nutrição (select de etapas do funil nutricao)
- Botões: Cancelar / Salvar

**Página de detalhe do Contato** (`/contatos/:id`):
- Header: nome, tipo (badge), etapa de nutrição (badge), botão Editar
- Grid de 3 colunas:
  - Coluna 1: dados pessoais (whatsapp clicável com wa.me, email, instagram, cpf_cnpj, endereco, aniversario, segmento, area_atuacao, origem)
  - Coluna 2: Oportunidades vinculadas (cards compactos de crm_oportunidades onde pessoa_id = id, com etapa e valor)
  - Coluna 3: Resumo financeiro integrado do ERP — LTV total, total de transações concluídas, última transação, ticket médio (buscar de ltv_clientes)
- Seção "Histórico de Interações": timeline de crm_interacoes + formulário de nova interação
- Seção "Tarefas": lista e criação de tarefas vinculadas à pessoa

---

### 6. TAREFAS (`/tarefas`)

**Layout em três colunas:** Pendente | Em Andamento | Concluída (kanban de status)

**Header:** "Gestão de Tarefas" + "+ Nova Tarefa" + filtros (prioridade, vinculado a lead/pessoa/oportunidade, busca)

**Card de tarefa:**
- Título em destaque
- Badge de prioridade (colorido)
- Prazo: data e hora, vermelho se atrasada com ícone de alerta ⚠️
- Contexto vinculado: "👤 Nome do lead", "🤝 Nome da pessoa", "💼 Nome da oportunidade" — clicável, vai para o registro
- Descrição em texto secundário (truncada em 2 linhas)
- Botão rápido "Concluir" ou "Em andamento" para avançar o status
- Drag entre colunas de status

**Filtros rápidos no header:** Hoje | Atrasadas | Esta semana | Urgentes

**Drawer "Nova/Editar Tarefa":**
- Título (obrigatório)
- Prioridade (select com cores: Urgente / Alta / Média / Baixa)
- Status (select)
- Prazo (date + time picker)
- Vincular a: toggle entre Lead / Contato / Oportunidade → select do registro correspondente com busca
- Descrição (textarea)
- Botões: Cancelar / Salvar

---

## FLUXO CRÍTICO — CONVERSÃO DE LEAD

Disparado ao mover lead para etapa com `tipo_final = 'qualificado'` ou ao clicar "Converter para Contato":

**Modal em 2 etapas:**

*Etapa 1 — Dados do Contato:*
- Título: "Converter Lead em Contato"
- Campos pré-preenchidos do lead: Nome, WhatsApp, Email, Instagram, Segmento, Origem, Quem Indicou
- Campos adicionais a preencher: Tipo (Cliente/Fornecedor, padrão Cliente), Área de Atuação, CPF/CNPJ, Endereço, Aniversário, Etapa de Nutrição (opcional)
- Botão "Próximo →"

*Etapa 2 — Abrir Oportunidade:*
- Título: "Criar Oportunidade"
- Toggle: "Criar oportunidade agora?" (padrão: ativo)
- Se ativo: campos Nome da Oportunidade (pré-preenchido com o nome do contato), Etapa inicial (padrão: primeira etapa do funil vendas), Serviço (select de item), Origem (herdada do lead), Valor (numeric)
- Botão "Converter e Salvar"

*Ao confirmar:*
1. INSERT em `pessoas` com todos os dados preenchidos
2. UPDATE em `crm_leads`: convertido = TRUE, pessoa_id = id do novo contato
3. UPDATE em `pessoas`: lead_origem_id = lead.id
4. Se toggle ativo: INSERT em `crm_oportunidades` com etapa do funil de vendas
5. Toast: "✅ Lead convertido! Contato e oportunidade criados."
6. Fechar modal, atualizar kanban de leads

---

## NAVEGAÇÃO SIDEBAR

Ícones Lucide, itens verticais, item ativo com gradient da marca:

- 📊 Dashboard → `/`
- 👥 Leads → `/leads` (badge com total de leads ativos)
- 💼 Vendas → `/vendas` (badge com valor do pipeline)
- 🌱 Nutrição → `/nutricao`
- 👤 Contatos → `/contatos`
- ✅ Tarefas → `/tarefas` (badge vermelho com tarefas atrasadas se > 0)

Rodapé da sidebar: "SetTake CRM" em texto pequeno secundário.

---

## REGRAS TÉCNICAS OBRIGATÓRIAS

1. **Nunca usar** localStorage, sessionStorage ou qualquer browser storage API
2. **Formatação monetária:** sempre `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
3. **Formatação de data:** sempre `dd/MM/yyyy` em português, usando date-fns com locale pt-BR
4. **WhatsApp links:** sempre `https://wa.me/55${numero.replace(/\D/g, '')}` — remover todos os não-dígitos e prefixar com 55
5. **Drag and drop do Kanban:** usar `@dnd-kit/core` + `@dnd-kit/sortable` — ao soltar card em nova coluna, fazer UPDATE imediato no Supabase com o novo etapa_id, com rollback visual em caso de erro
6. **Toasts** de sucesso (verde) e erro (vermelho) em todas as operações
7. **Loading states:** skeleton nos kanban boards, spinner nos botões de ação
8. **Estado vazio:** mensagem e ícone em colunas sem cards
9. **LTV integrado:** buscar de `ltv_clientes` (view do ERP) sempre que exibir dados de um contato. Se pessoa não tiver transações, exibir "R$ 0,00" sem erro
10. **Serviços no select de oportunidades:** buscar `item JOIN grupo ON grupo.id = item.grupo_id` onde `grupo.natureza_id = 1`, agrupando por `grupo.nome`
11. **Responsivo:** sidebar colapsa em ícones em telas < 1024px
12. Usar **Recharts** para gráficos, **Lucide React** para ícones, **date-fns** para datas
13. Todas as queries via **supabase-js client** já configurado pelo Lovable

---

## PRIORIDADE DE ENTREGA

Se não for possível gerar tudo de uma vez, priorizar:
1. Layout base (sidebar + roteamento)
2. Dashboard com KPIs e aniversariantes
3. Funil de Leads (kanban + drawer)
4. Funil de Vendas (kanban + drawer)
5. Fluxo de conversão Lead → Contato + Oportunidade
6. Tarefas
7. Contatos (lista + detalhe)
8. Nutrição

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://settake-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0d08655e-32d9-40c5-bae2-89e4e9cb93b6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
