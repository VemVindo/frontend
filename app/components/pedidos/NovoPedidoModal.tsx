'use client';
import { useEffect, useId, useRef } from 'react';
import IconeFechar from '@/app/components/icones/IconeFechar';
import Botao from '@/app/components/ui/Botao';
import type { CriarPedidoResposta } from '@/app/lib/tipos';
import CamposNovoPedido from './CamposNovoPedido';
import { useCadastroPedido } from './useCadastroPedido';
export interface NovoPedidoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onCriado?: (pedido: CriarPedidoResposta) => void;
}
export default function NovoPedidoModal({ aberto, onFechar, onCriado }: NovoPedidoModalProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idDoDialogo = useId();
  const {
    dadosDoFormulario,
    erros,
    atualizarCampo,
    processarEnvio,
    fechar,
    enviando,
    empresa,
    mensagemDeEstado,
    erroDeEnvio,
  } = useCadastroPedido(onFechar, onCriado);
  useEffect(() => {
    if (!aberto || !dialogo.current) return;
    const modal = dialogo.current;
    const elementoComFocoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const rolagemAnterior = document.body.style.overflow;
    modal.showModal();
    document.body.style.overflow = 'hidden';
    modal.querySelector<HTMLInputElement>('input')?.focus();
    return () => {
      modal.close();
      document.body.style.overflow = rolagemAnterior;
      elementoComFocoAnterior?.focus();
    };
  }, [aberto]);

  return (
    <dialog
      ref={dialogo}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${idDoDialogo}-titulo`}
      onCancel={(evento) => {
        evento.preventDefault();
        fechar();
      }}
      onClick={(evento) => {
        if (evento.target !== evento.currentTarget) return;
        const limites = evento.currentTarget.getBoundingClientRect();
        if (
          evento.clientX < limites.left ||
          evento.clientX > limites.right ||
          evento.clientY < limites.top ||
          evento.clientY > limites.bottom
        )
          fechar();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto overscroll-contain rounded-[20px] border-0 bg-superficie p-5 text-texto backdrop:bg-sobreposicao/55 sm:p-6"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 id={`${idDoDialogo}-titulo`} className="font-titulo text-lg font-bold">
          Novo pedido
        </h2>
        <button
          type="button"
          aria-label="Fechar novo pedido"
          onClick={fechar}
          disabled={enviando}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-primaria"
        >
          <IconeFechar className="size-5" />
        </button>
      </div>
      <form noValidate onSubmit={processarEnvio} aria-busy={enviando}>
        <fieldset disabled={enviando} className="flex min-w-0 flex-col gap-3">
          <CamposNovoPedido
            dadosDoFormulario={dadosDoFormulario}
            erros={erros}
            atualizarCampo={atualizarCampo}
            idDoDialogo={idDoDialogo}
          />
          <p id={`${idDoDialogo}-aviso`} role="status" aria-live="polite" className="text-xs text-texto-apoio">
            {mensagemDeEstado}
          </p>
          {erroDeEnvio && (
            <p role="alert" className="text-xs text-erro">
              {erroDeEnvio}
            </p>
          )}
          <Botao
            type="submit"
            disabled={enviando || !empresa}
            aria-describedby={`${idDoDialogo}-aviso`}
            larguraTotal
            className="mt-2 h-11 rounded-xl text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria"
          >
            {enviando ? 'Criando pedido...' : 'Criar pedido'}
          </Botao>
        </fieldset>
      </form>
    </dialog>
  );
}
