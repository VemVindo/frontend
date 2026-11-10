'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import IconeFechar from '@/app/components/icones/IconeFechar';

export interface DialogoFrotaProps {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}

export default function DialogoFrota({ aberto, titulo, onFechar, children }: DialogoFrotaProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idDoDialogo = useId();

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
        onFechar();
      }}
      onClick={(evento) => {
        if (evento.target !== evento.currentTarget) return;
        const limites = evento.currentTarget.getBoundingClientRect();
        if (
          evento.clientX < limites.left ||
          evento.clientX > limites.right ||
          evento.clientY < limites.top ||
          evento.clientY > limites.bottom
        ) {
          onFechar();
        }
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] overflow-y-auto overscroll-contain rounded-[20px] border-0 bg-superficie p-5 text-texto shadow-xl backdrop:bg-sobreposicao/55 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={`${idDoDialogo}-titulo`} className="font-titulo text-lg font-bold">
          {titulo}
        </h2>
        <button
          type="button"
          aria-label={`Fechar ${titulo.toLowerCase()}`}
          onClick={onFechar}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-primaria"
        >
          <IconeFechar className="size-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
