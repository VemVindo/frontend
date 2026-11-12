'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { consultarResumoDashboard, listarAvaliacoes, listarFrota, listarPedidosDaEmpresa } from '@/app/lib/api';
import { formatarDataHora } from '@/app/lib/pedidos';
import { TELA_PEDIDOS } from '@/app/lib/rotas';
import type { AvaliacaoDaEmpresa, DadosCompartilhados, PedidoAtivo } from '@/app/lib/tipos';
import type { ResumoDoDashboard } from '@/app/lib/tiposDashboard';

type Periodo = 'hoje' | '7dias' | '30dias';

interface Intervalo {
  inicio: Date;
  fim: Date;
}

const STATUS = [
  { campo: 'totalPedidosPendentes', rotulo: 'Pendente', cor: 'bg-alerta' },
  { campo: 'totalPedidosAndamento', rotulo: 'Em andamento', cor: 'bg-primaria' },
  { campo: 'totalPedidosConcluidos', rotulo: 'Concluída', cor: 'bg-sucesso' },
  { campo: 'totalPedidosCancelados', rotulo: 'Cancelada', cor: 'bg-texto-suave' },
] as const;

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function intervaloDoPeriodo(periodo: Periodo, agora = new Date()): Intervalo {
  const fim = new Date(agora);
  const inicio = inicioDoDia(agora);
  if (periodo === '7dias') inicio.setDate(inicio.getDate() - 6);
  if (periodo === '30dias') inicio.setDate(inicio.getDate() - 29);
  return { inicio, fim };
}

function estaNoIntervalo(dataIso: string, intervalo: Intervalo): boolean {
  const data = new Date(dataIso);
  return data >= intervalo.inicio && data <= intervalo.fim;
}

function estaNaFaixa(dataIso: string, faixa: Intervalo): boolean {
  const data = new Date(dataIso);
  return data >= faixa.inicio && data < faixa.fim;
}

function dataParaFiltro(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = Math.round(minutos % 60);
  return minutosRestantes > 0 ? `${horas} h ${minutosRestantes} min` : `${horas} h`;
}

function formatarDistancia(metros: number): string {
  return `${(metros / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

function tempoDesde(dataIso: string): string {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(dataIso).getTime()) / 60_000));
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  if (horas < 24) return minutosRestantes ? `há ${horas} h ${minutosRestantes} min` : `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

function criarBarras(entregas: string[], periodo: Periodo, intervalo: Intervalo) {
  if (periodo === 'hoje') {
    const barras = Array.from({ length: 6 }, (_, indice) => ({
      rotulo: `${String(indice * 4).padStart(2, '0')}h`,
      inicio: new Date(intervalo.inicio.getTime() + indice * 4 * 60 * 60 * 1000),
      fim: new Date(intervalo.inicio.getTime() + (indice + 1) * 4 * 60 * 60 * 1000),
      total: 0,
    }));
    entregas.forEach((dataIso) => {
      const hora = new Date(dataIso).getHours();
      const barra = barras[Math.min(Math.floor(hora / 4), barras.length - 1)];
      if (barra) barra.total += 1;
    });
    return barras;
  }

  if (periodo === '7dias') {
    return Array.from({ length: 7 }, (_, indice) => {
      const inicio = new Date(intervalo.inicio);
      inicio.setDate(inicio.getDate() + indice);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 1);
      return {
        rotulo: inicio.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
        inicio,
        fim,
        total: entregas.filter((dataIso) => estaNaFaixa(dataIso, { inicio, fim })).length,
      };
    });
  }

  const diasNoPeriodo =
    Math.floor((inicioDoDia(intervalo.fim).getTime() - intervalo.inicio.getTime()) / 86_400_000) + 1;
  const quantidadeDeSemanas = Math.ceil(diasNoPeriodo / 7);
  return Array.from({ length: quantidadeDeSemanas }, (_, indice) => {
    const inicio = new Date(intervalo.inicio);
    inicio.setDate(inicio.getDate() + indice * 7);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 7);
    const ultimoDia = Math.min(indice * 7 + 7, diasNoPeriodo);
    return {
      rotulo: `${indice * 7 + 1}–${ultimoDia}`,
      inicio,
      fim,
      total: entregas.filter((dataIso) => estaNaFaixa(dataIso, { inicio, fim })).length,
    };
  });
}

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function LinkVerTodos({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 text-xs font-bold text-texto hover:text-primaria focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primaria"
    >
      {rotulo} →
    </Link>
  );
}

export default function PaginaDashboard() {
  const [periodo, setPeriodo] = useState<Periodo>('7dias');
  const [pedidos, setPedidos] = useState<PedidoAtivo[] | null>(null);
  const [erroPedidos, setErroPedidos] = useState(false);
  const [frota, setFrota] = useState<DadosCompartilhados[] | null>(null);
  const [erroFrota, setErroFrota] = useState(false);
  const [resumo, setResumo] = useState<ResumoDoDashboard | null>(null);
  const [erroResumo, setErroResumo] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDaEmpresa[] | null>(null);
  const [erroAvaliacoes, setErroAvaliacoes] = useState(false);

  const intervalo = useMemo(() => intervaloDoPeriodo(periodo), [periodo]);
  const entregasNoPeriodo = useMemo(
    () =>
      (pedidos ?? []).flatMap((pedido) =>
        pedido.status === 'FINALIZADO' && pedido.finalizadoEm && estaNoIntervalo(pedido.finalizadoEm, intervalo)
          ? [pedido.finalizadoEm]
          : [],
      ),
    [intervalo, pedidos],
  );
  const pedidosPendentes = useMemo(
    () =>
      (pedidos ?? [])
        .filter((pedido) => pedido.status === 'PENDENTE' && estaNoIntervalo(pedido.criadoEm, intervalo))
        .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
        .slice(0, 4),
    [intervalo, pedidos],
  );
  const barras = useMemo(
    () => criarBarras(entregasNoPeriodo, periodo, intervalo),
    [entregasNoPeriodo, intervalo, periodo],
  );
  const totalDeStatus = resumo ? STATUS.reduce((total, status) => total + resumo[status.campo], 0) : 0;
  const maiorBarra = Math.max(1, ...barras.map((barra) => barra.total));

  useEffect(() => {
    let cancelado = false;
    listarPedidosDaEmpresa()
      .then((lista) => {
        if (!cancelado) {
          setPedidos(lista);
          setErroPedidos(false);
        }
      })
      .catch(() => {
        if (!cancelado) setErroPedidos(true);
      });
    listarFrota()
      .then((lista) => {
        if (!cancelado) {
          setFrota(lista);
          setErroFrota(false);
        }
      })
      .catch(() => {
        if (!cancelado) setErroFrota(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    setResumo(null);
    setErroResumo(false);
    consultarResumoDashboard({
      dataInicio: intervalo.inicio.toISOString(),
      dataFinal: intervalo.fim.toISOString(),
    })
      .then((dados) => {
        if (!cancelado) {
          setResumo(dados);
          setErroResumo(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setErroResumo(true);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [intervalo]);

  useEffect(() => {
    let cancelado = false;
    setAvaliacoes(null);
    setErroAvaliacoes(false);
    const filtro = {
      notas: [],
      de: dataParaFiltro(intervalo.inicio),
      ate: dataParaFiltro(intervalo.fim),
    };
    listarAvaliacoes(filtro)
      .then((lista) => {
        if (!cancelado) {
          setAvaliacoes(lista);
          setErroAvaliacoes(false);
        }
      })
      .catch(() => {
        if (!cancelado) setErroAvaliacoes(true);
      });
    return () => {
      cancelado = true;
    };
  }, [intervalo]);

  const indicadores = [
    {
      rotulo: 'Tempo médio',
      valor: resumo ? formatarDuracao(resumo.tempoMedioEntregaMinutos) : '—',
    },
    {
      rotulo: 'Avaliação média',
      valor: erroResumo
        ? 'Indisponível'
        : resumo
          ? `${resumo.mediaAvaliacoes.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ★`
          : '—',
    },
    {
      rotulo: 'Distância percorrida',
      valor: resumo ? formatarDistancia(resumo.totalDistanciaPercorrida) : '—',
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-[22px] bg-primaria px-5 py-5 text-white md:px-7 md:py-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-white/75">Visão geral do estabelecimento</p>
        <h1 className="mt-2 font-titulo text-[22px] font-bold leading-tight md:text-[28px]">
          {resumo
            ? `${resumo.totalPedidosConcluidos.toLocaleString('pt-BR')} ${
                resumo.totalPedidosConcluidos === 1 ? 'entrega concluída' : 'entregas concluídas'
              } ${periodo === 'hoje' ? 'hoje' : periodo === '30dias' ? 'em 30 dias' : 'em 7 dias'}`
            : 'Resumo das entregas'}
        </h1>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex min-h-[76px] flex-col justify-center rounded-[14px] bg-white/15 px-4 py-3">
            <span className="text-[11px] text-white/75">Pedidos</span>
            <span className="mt-1 text-lg font-bold md:text-xl">
              {resumo ? resumo.totalPedidos.toLocaleString('pt-BR') : '—'}
            </span>
          </div>
          {indicadores.map((item) => (
            <div
              key={item.rotulo}
              className="flex min-h-[76px] flex-col justify-center rounded-[14px] bg-white/15 px-4 py-3"
            >
              <span className="text-[11px] text-white/75">{item.rotulo}</span>
              <span className="mt-1 text-lg font-bold md:text-xl">{item.valor}</span>
            </div>
          ))}
        </div>
        {erroResumo && (
          <p role="alert" className="mt-3 text-xs text-white">
            Não foi possível carregar o resumo do dashboard.
          </p>
        )}
      </section>

      <div className="flex w-fit rounded-[13px] bg-superficie p-1" role="group" aria-label="Período do dashboard">
        {(
          [
            ['hoje', 'Hoje'],
            ['7dias', '7 dias'],
            ['30dias', '30 dias'],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={periodo === valor}
            onClick={() => setPeriodo(valor)}
            className={`min-w-[78px] cursor-pointer rounded-[10px] px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primaria ${
              periodo === valor
                ? 'bg-primaria-clara font-semibold text-primaria-escura'
                : 'text-texto-apoio hover:text-texto'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-[18px] bg-superficie p-4 md:p-5" aria-labelledby="pedidos-pendentes">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 id="pedidos-pendentes" className="font-titulo text-[15px] font-bold">
                Pedidos pendentes
              </h2>
              <LinkVerTodos href={TELA_PEDIDOS} rotulo="Ver todos" />
            </header>
            {erroPedidos && (
              <p role="alert" className="text-xs text-erro">
                Não foi possível carregar os pedidos.
              </p>
            )}
            {!pedidos && !erroPedidos && <p className="text-xs text-texto-apoio">Carregando pedidos...</p>}
            {pedidos && pedidosPendentes.length === 0 && (
              <p className="text-xs text-texto-apoio">Nenhum pedido pendente no momento.</p>
            )}
            {pedidosPendentes.length > 0 && (
              <ul className="divide-y divide-borda">
                {pedidosPendentes.map((pedido) => (
                  <li
                    key={pedido.id}
                    className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[62px_minmax(0,1fr)_auto_auto]"
                  >
                    <span className="text-xs font-semibold text-texto-corpo">#{pedido.id}</span>
                    <span className="truncate text-xs text-texto-corpo">{pedido.recebedor}</span>
                    <span className="text-[11px] text-texto-apoio">{tempoDesde(pedido.criadoEm)}</span>
                    <span className="hidden rounded-full bg-primaria-clara px-2 py-1 text-[10px] font-medium text-primaria-escura sm:inline-flex">
                      Pendente
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[18px] bg-superficie p-4 md:p-5" aria-labelledby="pedidos-periodo">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 id="pedidos-periodo" className="font-titulo text-[15px] font-bold">
                Entregas por período
              </h2>
              <span className="text-xs text-texto-apoio">
                {entregasNoPeriodo.length} {entregasNoPeriodo.length === 1 ? 'entrega' : 'entregas'}
              </span>
            </header>
            {erroPedidos && (
              <p role="alert" className="text-xs text-erro">
                Não foi possível carregar os pedidos.
              </p>
            )}
            {!pedidos && !erroPedidos && <p className="text-xs text-texto-apoio">Carregando pedidos...</p>}
            {pedidos && (
              <div className="flex h-[148px] items-end justify-around gap-2 pt-2">
                {barras.map((barra, indice) => (
                  <div
                    key={`${barra.rotulo}-${indice}`}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] text-texto-apoio">{barra.total || ''}</span>
                    <div className="flex h-[88px] w-full max-w-[46px] items-end rounded-t-[9px] bg-primaria-clara">
                      <div
                        role="img"
                        aria-label={`${barra.total} ${barra.total === 1 ? 'entrega' : 'entregas'} em ${barra.rotulo}`}
                        className={`w-full rounded-t-[9px] ${indice === barras.length - 1 && periodo === '7dias' ? 'bg-primaria' : 'bg-primaria-clara'}`}
                        style={{ height: `${barra.total === 0 ? 0 : Math.max(12, (barra.total / maiorBarra) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-texto-suave md:text-[10px]">{barra.rotulo}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-[18px] bg-superficie p-4 md:p-5" aria-labelledby="status-pedidos">
            <h2 id="status-pedidos" className="font-titulo text-[15px] font-bold">
              Status dos pedidos
            </h2>
            {erroResumo && (
              <p role="alert" className="mt-3 text-xs text-erro">
                Não foi possível carregar os status dos pedidos.
              </p>
            )}
            {!resumo && !erroResumo && <p className="mt-3 text-xs text-texto-apoio">Carregando status...</p>}
            {resumo && (
              <>
                <div
                  className="mt-3 flex h-[10px] overflow-hidden rounded-full bg-superficie-suave"
                  aria-label={`${totalDeStatus} pedidos no período`}
                >
                  {STATUS.map((status) => {
                    const total = resumo[status.campo];
                    return total > 0 ? (
                      <div
                        key={status.campo}
                        aria-label={`${status.rotulo}: ${total}`}
                        className={status.cor}
                        style={{ width: `${(total / Math.max(1, totalDeStatus)) * 100}%` }}
                      />
                    ) : null;
                  })}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {STATUS.map((status) => {
                    const total = resumo[status.campo];
                    return (
                      <li key={status.campo} className="flex items-center gap-1.5 text-[11px] text-texto-apoio">
                        <span aria-hidden="true" className={`size-2 rounded-full ${status.cor}`} />
                        {status.rotulo} <span className="font-medium text-texto-corpo">{total}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>

          <section className="rounded-[18px] bg-superficie p-4 md:p-5" aria-labelledby="frota-dashboard">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 id="frota-dashboard" className="font-titulo text-[15px] font-bold">
                Frota
              </h2>
              <LinkVerTodos href="/painel/frota" rotulo="Ver todos" />
            </header>
            {erroFrota && (
              <p role="alert" className="text-xs text-erro">
                Não foi possível carregar a frota.
              </p>
            )}
            {!frota && !erroFrota && <p className="text-xs text-texto-apoio">Carregando frota...</p>}
            {frota && frota.length === 0 && <p className="text-xs text-texto-apoio">Nenhum entregador vinculado.</p>}
            {frota && frota.length > 0 && (
              <ul className="space-y-3">
                {frota.slice(0, 3).map((entregador) => {
                  const desempenho = resumo?.relatorioPorEntregador.find((item) => item.cpf === entregador.cpf);
                  return (
                    <li key={entregador.cpf} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`size-2 shrink-0 rounded-full ${entregador.disponivel ? 'bg-sucesso' : 'bg-texto-suave'}`}
                        />
                        <span className="truncate">{entregador.nome}</span>
                      </span>
                      <span className="text-right text-[11px] text-texto-apoio">
                        {desempenho
                          ? `${desempenho.totalPedidosAndamento + desempenho.totalPedidosConcluidos} entregas · ${
                              desempenho.totalPago === null || desempenho.totalPago === undefined
                                ? 'pagamento não informado'
                                : `${formatarReais(desempenho.totalPago)} pagos`
                            }`
                          : erroResumo
                            ? 'Resumo indisponível'
                            : 'Carregando...'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-[18px] bg-superficie p-4 md:p-5" aria-labelledby="avaliacoes-recentes">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 id="avaliacoes-recentes" className="font-titulo text-[15px] font-bold">
                Avaliações recentes
              </h2>
              <LinkVerTodos href="/painel/avaliacoes" rotulo="Ver todas" />
            </header>
            {erroAvaliacoes && (
              <p role="alert" className="text-xs text-erro">
                Não foi possível carregar as avaliações.
              </p>
            )}
            {!avaliacoes && !erroAvaliacoes && <p className="text-xs text-texto-apoio">Carregando avaliações...</p>}
            {avaliacoes && avaliacoes.length === 0 && (
              <p className="text-xs text-texto-apoio">Nenhuma avaliação neste período.</p>
            )}
            {avaliacoes && avaliacoes.length > 0 && (
              <ul className="space-y-3">
                {[...avaliacoes]
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .slice(0, 2)
                  .map((avaliacao) => (
                    <li key={avaliacao.idPedido} className="border-b border-borda pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-alerta" aria-label={`${avaliacao.nota} de 5 estrelas`}>
                          {'★'.repeat(avaliacao.nota)}
                          {'☆'.repeat(Math.max(0, 5 - avaliacao.nota))}
                        </span>
                        <time dateTime={avaliacao.data} className="shrink-0 text-[10px] text-texto-apoio">
                          {formatarDataHora(avaliacao.data)}
                        </time>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-texto-corpo">
                        {avaliacao.comentario ? `“${avaliacao.comentario}”` : 'Sem comentário escrito.'}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-texto-apoio">
                        {avaliacao.entregador ?? 'Entregador não informado'}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
