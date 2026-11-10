'use client';

import Botao from '@/app/components/ui/Botao';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import DialogoFrota from './DialogoFrota';

export interface ConfirmacaoRemocaoEntregadorProps {
  entregador: DadosCompartilhados | null;
  removendo: boolean;
  erro: string | null;
  onFechar: () => void;
  onConfirmar: () => void;
}

export default function ConfirmacaoRemocaoEntregador({
  entregador,
  removendo,
  erro,
  onFechar,
  onConfirmar,
}: ConfirmacaoRemocaoEntregadorProps) {
  return (
    <DialogoFrota aberto={Boolean(entregador)} titulo="Remover entregador" onFechar={onFechar}>
      {entregador && (
        <>
          <p className="mb-5 text-xs leading-5 text-texto-apoio">
            Remover <span className="font-semibold text-texto-corpo">{entregador.nome}</span> da frota? Os pedidos em
            andamento serão reatribuídos a outro entregador disponível ou voltarão para a fila.
          </p>
          {erro && (
            <p role="alert" className="mb-4 text-xs text-erro">
              {erro}
            </p>
          )}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Botao variante="secundario" disabled={removendo} onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao variante="perigo" disabled={removendo} onClick={onConfirmar}>
              {removendo ? 'Removendo...' : 'Remover entregador'}
            </Botao>
          </div>
        </>
      )}
    </DialogoFrota>
  );
}
