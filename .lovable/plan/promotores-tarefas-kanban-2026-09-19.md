# Prompt Lovable — CRM · Promotores, Tarefas e Kanban

O banco já foi atualizado (tabela `crm_promotores`, view `crm_promotores_resumo`, coluna `promotor_id` em `crm_leads` e `pessoas`). Cole no chat da Lovable do projeto settake-flow:

---
## 1. Corrigir a tela /tarefas (não abre)
A rota `src/routes/tarefas.tsx` quebra ao carregar. Investigue o erro no console (provável: view `calendario` retornando vazio para usuário sem papel ERP, ou `crm_tarefas_pendentes` com join nulo) e:
- Envolver cada fetch em tratamento de erro; se `calendario` falhar ou vier vazio, renderizar só as tarefas do CRM.
- Nunca deixar a página inteira em branco: mostrar estado vazio/erro com botão "Tentar novamente".
- Garantir que `TarefasCalendario` aceite `prazo` nulo.

## 2. Nova área: Promotores (/promotores)
Adicione item "Promotores" no `AppSidebar` (ícone Handshake), visível para todos os papéis.

**Lista** (tabela via `crm_promotores_resumo`): nome, empresa, meta_indicacoes, indicacoes, faltam, barra de progresso (pct_meta), clientes_convertidos, receita_gerada (BRL), receita_prevista, dias_restantes, ativo. Ordenar por pct_meta desc. Ações: editar, desativar (admin/sócio podem excluir).

**Diálogo criar/editar** (tabela `crm_promotores`): nome*, pessoa_id (select de `pessoas` — empresa vinculada, ex.: Mavē Arquitetura), whatsapp, email, meta_indicacoes*, prazo_inicio*, prazo_fim, ativo, observacoes.

**Drawer de detalhe**: cabeçalho com meta X/Y e progresso; abas "Indicações" (leads com `promotor_id` = este, com etapa e status) e "Clientes" (pessoas com `promotor_id` = este, com receita concluída e prevista via `transacoes`).

Exemplo de uso: Vanessa e Marina (Mavē Arquitetura) → 2 promotoras, meta 3 cada, prazo 6 meses, ambas com pessoa_id da Mavē.

## 3. Integração com Leads (origem = Indicação)
- No `LeadDialog`, quando `origem` for "Indicação", exibir select obrigatório "Indicado por" listando `crm_promotores` ativos → salvar em `crm_leads.promotor_id`.
- Card do Kanban e tabela de leads: chip pequeno "Indicado por {nome}" quando `promotor_id` preenchido.
- No `ConverterLeadDialog`, ao criar/atualizar a `pessoa`, copiar `promotor_id` do lead para `pessoas.promotor_id` (base da métrica de receita por promotor).
- Se "Indicação" não existir em `crm_config_origens`, criar.

## 4. Dashboard
Card "Receita por promotor" (top 5 de `crm_promotores_resumo` por receita_gerada) e card "Metas de indicação" (promotores ativos com faltam > 0, ordenados por dias_restantes).

## 5. Kanban mais suave e profissional
Em `src/components/crm/Kanban.tsx` (dnd-kit):
- Usar `DragOverlay` para o card arrastado (sombra `shadow-xl`, `rotate-[1.5deg]`, `scale-[1.02]`, `opacity-95`).
- Card de origem fica com `opacity-40` durante o arraste.
- Colunas com `transition-colors duration-200`; coluna de destino em hover ganha `ring-2 ring-primary/30 bg-primary/5`.
- Reordenação com `transform`/`transition` do `useSortable` (`transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1)'`).
- Cards: `transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`, cantos `rounded-xl`, espaçamento `gap-3`.
- Ao soltar, atualização otimista (mover no estado antes do PATCH; reverter com toast em caso de erro).
- Respeitar `prefers-reduced-motion`.

Não altere schema. Regenere `types.ts` incluindo `crm_promotores` e `crm_promotores_resumo`.
---
