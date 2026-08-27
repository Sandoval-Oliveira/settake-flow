import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, Panel, SelectField } from "@/components/crm/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useRankingReceita } from "@/lib/crm-funis";
import { formatMoney } from "@/lib/format";

type Periodo = "mes" | "3meses" | "ano" | "ano_passado";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "mes", label: "Este mês" },
  { value: "3meses", label: "Últimos 3 meses" },
  { value: "ano", label: "Este ano" },
  { value: "ano_passado", label: "Ano passado" },
];

function rangeFor(periodo: Periodo) {
  const hoje = new Date();
  const iso = (d: Date) => d.toISOString();
  if (periodo === "mes") {
    return {
      inicio: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
      fim: iso(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)),
    };
  }
  if (periodo === "3meses") {
    return {
      inicio: iso(new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)),
      fim: iso(hoje),
    };
  }
  if (periodo === "ano_passado") {
    return {
      inicio: iso(new Date(hoje.getFullYear() - 1, 0, 1)),
      fim: iso(new Date(hoje.getFullYear() - 1, 11, 31, 23, 59, 59)),
    };
  }
  return {
    inicio: iso(new Date(hoje.getFullYear(), 0, 1)),
    fim: iso(new Date(hoje.getFullYear(), 11, 31, 23, 59, 59)),
  };
}

export function RankingReceita({ onSelect }: { onSelect?: (pessoaId: string) => void }) {
  const [periodo, setPeriodo] = useState<Periodo>("ano");
  const { inicio, fim } = useMemo(() => rangeFor(periodo), [periodo]);
  const { data, isLoading } = useRankingReceita(inicio, fim);

  const ranking = data?.ranking ?? [];
  const evolucao = data?.evolucao ?? [];
  const topo = ranking[0]?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Ranking de Receita</h2>
        <div className="w-52">
          <SelectField
            value={periodo}
            onChange={(v) => setPeriodo((v as Periodo) ?? "ano")}
            options={PERIODOS.map((p) => ({ value: p.value, label: p.label }))}
            allowEmpty={false}
            placeholder="Período"
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Top 10 clientes">
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <EmptyState icon="💰" message="Nenhuma receita no período" />
          ) : (
            <table className="crm-table w-full">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th>Nome</th>
                  <th style={{ width: 130 }}>Segmento</th>
                  <th style={{ width: 70 }}>Nº</th>
                  <th style={{ width: 130 }}>Total</th>
                  <th style={{ width: 120 }}>Participação</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr
                    key={r.pessoa_id}
                    onClick={onSelect ? () => onSelect(r.pessoa_id) : undefined}
                    className={onSelect ? "cursor-pointer" : undefined}
                  >
                    <td className="font-semibold text-brand">{i + 1}</td>
                    <td className="font-medium">{r.nome}</td>
                    <td className="text-muted-foreground">{r.segmento ?? "—"}</td>
                    <td>{r.transacoes}</td>
                    <td className="font-semibold text-brand">{formatMoney(r.total)}</td>
                    <td>
                      <span className="block h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <span
                          className="brand-gradient block h-full rounded-full"
                          style={{ width: `${topo ? (r.total / topo) * 100 : 0}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Evolução mensal de receita">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : evolucao.length === 0 ? (
            <EmptyState icon="📈" message="Sem dados no período" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucao} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                  <CartesianGrid stroke="#2A2D3E" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    stroke="#8B8FA8"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#2A2D3E" }}
                  />
                  <YAxis
                    stroke="#8B8FA8"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#2A2D3E" }}
                    tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1A1D27",
                      border: "1px solid #2A2D3E",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#F0F2F8",
                    }}
                    formatter={(v: number) => [formatMoney(v), "Receita"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#E8B800"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#E8B800" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
