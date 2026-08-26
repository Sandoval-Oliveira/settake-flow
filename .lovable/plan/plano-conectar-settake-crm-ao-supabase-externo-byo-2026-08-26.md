# Plano: Conectar SetTake CRM ao Supabase externo (BYO)

## Objetivo
Trocar a origem dos dados do SetTake CRM do Lovable Cloud gerenciado para um projeto Supabase já existente (que você construiu e que tem as tabelas do CRM).

## Contexto atual
- O Lovable Cloud foi ativado e criou um projeto Supabase gerenciado (vazio).
- O app usa os arquivos gerados em `src/integrations/supabase/` (cliente browser, cliente service role e middleware de auth).
- O `src/lib/supabase.ts` já foi ajustado com um cast genérico para funcionar enquanto os tipos gerados não refletem o schema do CRM.

## Passos

### 1. Coletar e armazenar as credenciais do Supabase externo
- **Client-side (`.env`)**: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do seu projeto Supabase.
- **Server-side (secrets)**: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY` do seu projeto Supabase.
- Usar o formulário seguro de secrets para as server keys e atualizar o `.env` com as client keys.

### 2. Substituir as variáveis de ambiente
- Atualizar `.env` para apontar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para o seu Supabase.
- Garantir que `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no secret store também apontem para o seu Supabase.
- Os arquivos gerados em `src/integrations/supabase/client.ts` e `client.server.ts` já leem essas variáveis, então **não é necessário reescrever o cliente** — basta repontar as credenciais.

### 3. Validar a compatibilidade do schema
- Confirmar que as tabelas e views no seu Supabase externo seguem os nomes e colunas esperados pelo app (leads, pessoas, oportunidades, tarefas, interacoes, funis e views de pipeline/métricas).
- Caso haja diferenças, ajustar `src/lib/crm-types.ts` e `src/lib/crm-api.ts` para refletir o schema real.

### 4. Verificar os tipos gerados
- Os tipos gerados em `src/integrations/supabase/types.ts` refletem o schema do Lovable Cloud (vazio). Como seu Supabase externo já tem tabelas, os tipos podem ser regenerados, mas o cast genérico em `src/lib/supabase.ts` já permite o app funcionar sem isso imediatamente.
- Decisão: regenerar os tipos do Supabase externo agora ou deixar o cast genérico e fazer a tipagem forte depois.

### 5. Testar a conexão
- Rodar `bunx tsc --noEmit` para garantir que o build/typecheck não quebra.
- Subir o preview e verificar se os dados do seu Supabase aparecem no dashboard/funis.

### 6. Limpeza opcional
- Depois de confirmar que tudo funciona, você pode desativar/remover o projeto Supabase gerenciado pelo Lovable Cloud no dashboard para evitar confusão (o app não usará mais ele).

## O que não será feito
- Nenhuma migration será criada no Lovable Cloud (você já tem as tabelas no Supabase externo).
- Não vamos reescrever os arquivos gerados do cliente Supabase, apenas repontar as credenciais.
