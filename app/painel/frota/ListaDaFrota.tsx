'use client';

import { useState } from 'react';
import Avatar from '@/app/components/ui/Avatar';
import { rotuloDoVeiculo } from '@/app/lib/dadosCompartilhados';
import { iniciais } from '@/app/lib/texto';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import type { DesempenhoEntregador } from '@/app/lib/tiposDesempenho';

export type EstadoDesempenho =
  { estado: 'carregando' } | { estado: 'carregado'; dados: DesempenhoEntregador } | { estado: 'erro' };

export interface ListaDaFrotaProps {
  entregadores: DadosCompartilhados[];
  desempenhoPorCpf: Record<string, EstadoDesempenho>;
  totalPagoPorCpf: Record<string, number>;
  erroTotalPago: boolean;
  onEditar: (entregador: DadosCompartilhados) => void;
  onRemover: (entregador: DadosCompartilhados) => void;
}

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarAvaliacao(desempenho: EstadoDesempenho | undefined) {
  if (!desempenho || desempenho.estado === 'carregando') return 'Carregando...';
  if (desempenho.estado === 'erro') return null;
  const nota = desempenho.dados.avaliacao_media;
  return nota === null ? 'Sem avaliação' : nota.toFixed(1);
}

function mostrarEntregas(desempenho: EstadoDesempenho | undefined) {
  if (!desempenho || desempenho.estado === 'carregando') return 'Carregando...';
  if (desempenho.estado === 'erro') return null;
  const total = desempenho.dados.total_entregas;
  return `${total} ${total === 1 ? 'entrega' : 'entregas'}`;
}

export default function ListaDaFrota({
  entregadores,
  desempenhoPorCpf,
  totalPagoPorCpf,
  erroTotalPago,
  onEditar,
  onRemover,
}: ListaDaFrotaProps) {
  const [menuAbertoPara, setMenuAbertoPara] = useState<string | null>(null);

  if (entregadores.length === 0) {
    return <p className="text-xs text-texto-apoio">Nenhum entregador na frota ainda.</p>;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="mb-[10px] hidden grid-cols-[minmax(190px,1fr)_130px_110px_110px_140px_40px] items-center gap-3 rounded-[8px] bg-superficie-suave px-[13px] py-[10px] text-[11px] uppercase text-texto-apoio md:grid"
      >
        <span>Entregador</span>
        <span>Status</span>
        <span>Avaliação</span>
        <span>Entregas</span>
        <span>Total ganho</span>
        <span />
      </div>
      <ul className="flex flex-col gap-2">
        {entregadores.map((entregador) => {
          const desempenho = desempenhoPorCpf[entregador.cpf];
          const avaliacao = mostrarAvaliacao(desempenho);
          const entregas = mostrarEntregas(desempenho);
          const menuAberto = menuAbertoPara === entregador.cpf;
          const totalPago = totalPagoPorCpf[entregador.cpf];

          return (
            <li
              key={entregador.cpf}
              className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-[8px] border border-borda px-[13px] py-3 text-xs text-texto-corpo md:grid-cols-[minmax(190px,1fr)_130px_110px_110px_140px_40px] md:gap-3"
            >
              <span className="col-span-1 flex min-w-0 items-center gap-3 pr-9 md:pr-0">
                <Avatar iniciais={iniciais(entregador.nome)} tamanho={36} />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-semibold">{entregador.nome}</span>
                  <span className="text-[11px] text-texto-apoio">{rotuloDoVeiculo(entregador.tipoVeiculo)}</span>
                </span>
              </span>

              <div className="col-span-1 flex flex-wrap items-center gap-x-5 gap-y-2 md:contents">
                <span
                  className={`flex items-center gap-2 font-medium ${entregador.disponivel ? 'text-sucesso-texto' : 'text-texto-apoio'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full ${entregador.disponivel ? 'bg-sucesso-texto' : 'bg-texto-suave'}`}
                  />
                  {entregador.disponivel ? 'Disponível' : 'Indisponível'}
                </span>

                {desempenho?.estado === 'erro' ? (
                  <span role="alert" className="text-[11px] text-erro md:col-span-2">
                    Não foi possível carregar o desempenho.
                  </span>
                ) : (
                  <>
                    <span className="font-medium" aria-label={avaliacao ?? 'Sem avaliação'}>
                      {avaliacao === 'Carregando...' ? (
                        <span className="text-texto-apoio">{avaliacao}</span>
                      ) : avaliacao === 'Sem avaliação' ? (
                        <span className="text-texto-apoio">{avaliacao}</span>
                      ) : (
                        <>
                          <span aria-hidden="true">★ </span>
                          {avaliacao}
                        </>
                      )}
                    </span>
                    <span className="text-texto-corpo">{entregas}</span>
                  </>
                )}
                <span className="text-[11px] font-medium text-texto-corpo">
                  <span className="text-texto-apoio md:hidden">Total ganho: </span>
                  {erroTotalPago
                    ? 'Indisponível'
                    : totalPago === undefined
                      ? 'Carregando...'
                      : formatarReais(totalPago)}
                </span>
              </div>

              <div className="absolute right-2 top-2 md:relative md:right-auto md:top-auto md:justify-self-end">
                <button
                  type="button"
                  aria-label={`Ações de ${entregador.nome}`}
                  aria-haspopup="menu"
                  aria-expanded={menuAberto}
                  onClick={() => setMenuAbertoPara(menuAberto ? null : entregador.cpf)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-full text-lg font-bold leading-none text-texto-apoio hover:bg-superficie-suave focus-visible:outline-2 focus-visible:outline-primaria"
                >
                  <span aria-hidden="true">•••</span>
                </button>
                {menuAberto && (
                  <div
                    role="menu"
                    aria-label={`Ações de ${entregador.nome}`}
                    className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-[10px] border border-borda bg-superficie p-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuAbertoPara(null);
                        onEditar(entregador);
                      }}
                      className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs font-semibold text-texto-corpo hover:bg-superficie-suave focus-visible:outline-2 focus-visible:outline-primaria"
                    >
                      Editar dados
                    </button>
                    <div aria-hidden="true" className="my-1 border-t border-borda" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuAbertoPara(null);
                        onRemover(entregador);
                      }}
                      className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs font-semibold text-erro hover:bg-superficie-suave focus-visible:outline-2 focus-visible:outline-primaria"
                    >
                      Remover entregador
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
