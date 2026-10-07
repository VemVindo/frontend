'use client';

import { useState } from 'react';
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from '@/app/components/estilos';
import IconeEmpresa from '@/app/components/icones/IconeEmpresa';
import type { Vinculo } from '@/app/lib/tipos';
import type { AcaoVinculo } from '@/app/lib/vinculos';

interface ListaVinculosProps {
  vinculos: Vinculo[];
  ocupado: number | null;
  onResponder: (id: number, acao: AcaoVinculo) => void;
}

export default function ListaVinculos({ vinculos, ocupado, onResponder }: ListaVinculosProps) {
  const [confirmandoSaida, setConfirmandoSaida] = useState<number | null>(null);
  const pendentes = vinculos.filter((v) => v.status === 'PENDENTE');
  const ativos = vinculos.filter((v) => v.status === 'ATIVO');

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="titulo-convites">
        <h2 id="titulo-convites" className="text-[15px] font-semibold text-[#1D1B2E]">Convites</h2>
        {pendentes.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#8B8A9A]">Nenhum convite aguardando resposta.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {pendentes.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
                <span className="flex items-center gap-2 text-[14px] text-[#1D1B2E]">
                  <IconeEmpresa className="h-5 w-5 text-[#6C5DD3]" />
                  <span><strong>{v.empresa}</strong> quer você na frota</span>
                </span>
                <span className="flex gap-2">
                  <button type="button" disabled={ocupado === v.id} onClick={() => onResponder(v.id, 'recusar')} className={BOTAO_SECUNDARIO}>
                    Recusar
                  </button>
                  <button type="button" disabled={ocupado === v.id} onClick={() => onResponder(v.id, 'aceitar')} className={BOTAO_PRIMARIO}>
                    Aceitar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-frotas">
        <h2 id="titulo-frotas" className="text-[15px] font-semibold text-[#1D1B2E]">Empresas em que você trabalha</h2>
        {ativos.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#8B8A9A]">Você ainda não faz parte de nenhuma frota.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {ativos.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
                <span className="flex items-center gap-2 text-[14px] font-medium text-[#1D1B2E]">
                  <IconeEmpresa className="h-5 w-5 text-[#6C5DD3]" />
                  {v.empresa}
                </span>
                {confirmandoSaida === v.id ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-[#8B8A9A]">Sair da frota?</span>
                    <button type="button" onClick={() => setConfirmandoSaida(null)} className={BOTAO_SECUNDARIO}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={ocupado === v.id}
                      onClick={() => {
                        setConfirmandoSaida(null);
                        onResponder(v.id, 'encerrar');
                      }}
                      className={BOTAO_PRIMARIO}
                    >
                      Confirmar saída
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmandoSaida(v.id)} className={BOTAO_SECUNDARIO}>
                    Sair da frota
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
