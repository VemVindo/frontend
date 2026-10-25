'use client';

import { useEffect } from 'react';
import IconeFechar from '@/app/components/icones/IconeFechar';
import IconeInfo from '@/app/components/icones/IconeInfo';
import { TEMPO_DO_AVISO_MS } from '@/app/lib/avisos';

export interface AvisoFlutuanteProps {
  texto: string | null;
  onFechar: () => void;
}

export default function AvisoFlutuante({ texto, onFechar }: AvisoFlutuanteProps) {
  useEffect(() => {
    if (!texto) return;
    const temporizador = setTimeout(onFechar, TEMPO_DO_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [texto, onFechar]);

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-[18px]">
      {texto && (
        <div className="pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-[14px] bg-sobreposicao px-4 py-3 text-sm text-white shadow-lg">
          <IconeInfo className="size-5 shrink-0 text-lilas" />
          <p className="flex-1">{texto}</p>
          <button type="button" onClick={onFechar} aria-label="Fechar aviso" className="shrink-0 cursor-pointer text-lilas hover:text-white">
            <IconeFechar className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
