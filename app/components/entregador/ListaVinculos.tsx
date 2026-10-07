'use client';

import { useState } from 'react';
import IconeEmpresa from '@/app/components/icones/IconeEmpresa';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import type { Vinculo } from '@/app/lib/tipos';
import type { AcaoVinculo } from '@/app/lib/vinculos';

export interface ListaVinculosProps {
  vinculos: Vinculo[];
  ocupado: number | null;
  onResponder: (id: number, acao: AcaoVinculo) => void;
}

const ITEM = 'flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-superficie-suave p-4';

export default function ListaVinculos({ vinculos, ocupado, onResponder }: ListaVinculosProps) {
  const [confirmandoSaida, setConfirmandoSaida] = useState<number | null>(null);
  const pendentes = vinculos.filter((v) => v.status === 'PENDENTE');
  const ativos = vinculos.filter((v) => v.status === 'ATIVO');

  return (
    <>
      <Card titulo="Convites">
        {pendentes.length === 0 ? (
          <p className="text-xs text-texto-apoio">Nenhum convite aguardando resposta.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendentes.map((v) => (
              <li key={v.id} className={ITEM}>
                <span className="flex items-center gap-2 text-[13px]">
                  <IconeEmpresa className="size-5 text-primaria" />
                  <span><strong>{v.empresa}</strong> quer você na frota</span>
                </span>
                <span className="flex gap-2">
                  <Botao variante="secundario" disabled={ocupado === v.id} onClick={() => onResponder(v.id, 'recusar')}>
                    Recusar
                  </Botao>
                  <Botao disabled={ocupado === v.id} onClick={() => onResponder(v.id, 'aceitar')}>
                    Aceitar
                  </Botao>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card titulo="Empresas em que você trabalha">
        {ativos.length === 0 ? (
          <p className="text-xs text-texto-apoio">Você ainda não faz parte de nenhuma frota.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ativos.map((v) => (
              <li key={v.id} className={ITEM}>
                <span className="flex items-center gap-2 text-[13px] font-semibold">
                  <IconeEmpresa className="size-5 text-primaria" />
                  {v.empresa}
                </span>
                {confirmandoSaida === v.id ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-texto-apoio">Sair da frota?</span>
                    <Botao variante="secundario" onClick={() => setConfirmandoSaida(null)}>
                      Cancelar
                    </Botao>
                    <Botao
                      disabled={ocupado === v.id}
                      onClick={() => {
                        setConfirmandoSaida(null);
                        onResponder(v.id, 'encerrar');
                      }}
                    >
                      Confirmar saída
                    </Botao>
                  </span>
                ) : (
                  <Botao variante="secundario" onClick={() => setConfirmandoSaida(v.id)}>
                    Sair da frota
                  </Botao>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
