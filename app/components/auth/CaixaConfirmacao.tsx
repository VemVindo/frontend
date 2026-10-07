'use client';

import { useId, type ReactNode } from 'react';

interface CaixaConfirmacaoProps {
  marcado: boolean;
  onAlterar: (marcado: boolean) => void;
  children: ReactNode;
}

export default function CaixaConfirmacao({ marcado, onAlterar, children }: CaixaConfirmacaoProps) {
  const id = useId();

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        required
        checked={marcado}
        onChange={(e) => onAlterar(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#6C5DD3] hover:cursor-pointer"
      />
      <label htmlFor={id} className="text-[13px] text-[#1D1B2E] hover:cursor-pointer">
        {children}
      </label>
    </div>
  );
}
