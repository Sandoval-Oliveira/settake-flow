export const SEGMENTOS = [
  "Médico",
  "Clínica",
  "Hospital",
  "Profissional Liberal",
  "Advocacia",
  "Financeiro",
  "Estética",
  "Arquitetura",
  "Imobiliário",
  "Indústria",
  "Comércio",
  "Outros",
] as const;

export const ORIGENS = [
  "Orgânico WPP",
  "Orgânico Instagram",
  "Prospecção WPP",
  "Prospecção Instagram",
  "Prospecção Ativa",
  "Indicação Cliente",
  "Indicação Parceiro",
  "Meta ADS",
] as const;

export const AREAS_ATUACAO = [
  "Pediatra",
  "Obstetra / Ginecologista",
  "Dermatologista",
  "Cirurgião Plástico",
  "Cardiologista",
  "Endocrinologista",
  "Oftalmologista",
  "Ortopedista",
  "Mentorias",
  "Psiquiatra",
  "Dentista",
  "Psicólogo(a)",
  "Esteticista Corporais / Faciais",
  "Cabeleireiro(a)",
  "Educador Físico",
  "Corretor de Imóveis",
  "Advogado",
  "Contador",
  "Serviços",
] as const;

export const TIPOS_INTERACAO = ["Nota", "Ligação", "WhatsApp", "Email", "Reunião"] as const;
export const PRIORIDADES = ["Baixa", "Média", "Alta", "Urgente"] as const;
export const STATUS_TAREFA = ["Pendente", "Em Andamento", "Concluída", "Cancelada"] as const;
export const TIPOS_PESSOA = ["Cliente", "Fornecedor"] as const;

export type Segmento = (typeof SEGMENTOS)[number];
export type Origem = (typeof ORIGENS)[number];
export type AreaAtuacao = (typeof AREAS_ATUACAO)[number];
export type TipoInteracao = (typeof TIPOS_INTERACAO)[number];
export type Prioridade = (typeof PRIORIDADES)[number];
export type StatusTarefa = (typeof STATUS_TAREFA)[number];
export type TipoPessoa = (typeof TIPOS_PESSOA)[number];

export type Funil = "leads" | "vendas" | "nutricao";

export type Etapa = {
  id: string;
  funil: Funil;
  nome: string;
  ordem: number;
  cor: string | null;
  tipo_final: "qualificado" | "desqualificado" | "ganho" | "perdido" | null;
  probabilidade_fechamento?: number | null;
};

export type Lead = {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  segmento: Segmento | null;
  origem: Origem | null;
  quem_indicou: string | null;
  instagram: string | null;
  etapa_id: string | null;
  convertido: boolean | null;
  pessoa_id: string | null;
  observacoes: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export type PipelineLead = Lead & {
  etapa_nome?: string | null;
  etapa_cor?: string | null;
  etapa_ordem?: number | null;
  tipo_final?: Etapa["tipo_final"];
  dias_no_funil?: number | null;
  dias_na_etapa?: number | null;
  tarefas_pendentes?: number | null;
};

export type Pessoa = {
  id: string;
  nome: string;
  tipo: TipoPessoa | null;
  whatsapp: string | null;
  email: string | null;
  segmento: Segmento | null;
  origem: Origem | null;
  quem_indicou: string | null;
  instagram: string | null;
  area_atuacao: AreaAtuacao | null;
  endereco: string | null;
  cpf_cnpj: string | null;
  aniversario: string | null;
  etapa_nutricao_id: string | null;
  lead_origem_id: string | null;
  criado_em: string | null;
};

export type Oportunidade = {
  id: string;
  nome: string;
  etapa_id: string | null;
  pessoa_id: string | null;
  origem: Origem | null;
  item_id: number | string | null;
  valor: number | null;
  resultado: "Ganho" | "Perdido" | null;
  motivo_perda: string | null;
  data_fechamento: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export type PipelineVenda = Oportunidade & {
  pessoa_nome?: string | null;
  pessoa_whatsapp?: string | null;
  segmento?: Segmento | null;
  area_atuacao?: AreaAtuacao | null;
  servico_nome?: string | null;
  item_nome?: string | null;
  etapa_nome?: string | null;
  etapa_cor?: string | null;
  etapa_ordem?: number | null;
  ltv_atual?: number | null;
  dias_na_etapa?: number | null;
  tarefas_pendentes?: number | null;
};

export type PipelineNutricao = {
  id: string;
  nome: string;
  segmento: Segmento | null;
  area_atuacao: AreaAtuacao | null;
  origem: Origem | null;
  whatsapp: string | null;
  email?: string | null;
  aniversario?: string | null;
  total_transacoes?: number | null;

  etapa_nutricao_id: string | null;
  etapa_nome?: string | null;
  etapa_cor?: string | null;
  etapa_ordem?: number | null;
  ltv_total?: number | null;
  ultima_transacao?: string | null;
  dias_ultima_interacao?: number | null;
  tarefas_pendentes?: number | null;
};

export type Aniversariante = {
  id: string;
  nome: string;
  aniversario: string | null;
  whatsapp: string | null;
  segmento: Segmento | null;
  dias_para_aniversario: number | null;
  ltv_total: number | null;
};

export type Interacao = {
  id: string;
  tipo: TipoInteracao;
  descricao: string | null;
  lead_id: string | null;
  pessoa_id: string | null;
  oportunidade_id: string | null;
  criado_em: string | null;
};

export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade | null;
  status: StatusTarefa | null;
  prazo: string | null;
  lead_id: string | null;
  pessoa_id: string | null;
  oportunidade_id: string | null;
  concluida_em: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export type TarefaPendente = Tarefa & {
  lead_nome?: string | null;
  pessoa_nome?: string | null;
  oportunidade_nome?: string | null;
  atrasada?: boolean | null;
  prioridade_peso?: number | null;
};

export type MetricaConversao = {
  mes: string;
  total_leads: number | null;
  leads_convertidos: number | null;
  oportunidades: number | null;
  oportunidades_ganhas: number | null;
  valor_ganho: number | null;
  ticket_medio: number | null;
  origem: Origem | null;
};

export type ValorPipeline = {
  etapa_id: string;
  etapa_nome: string;
  etapa_cor: string | null;
  ordem: number | null;
  total_oportunidades: number | null;
  valor_total: number | null;
  ticket_medio: number | null;
};

export type Servico = {
  id: number | string;
  nome: string;
  grupo_nome: string;
};
