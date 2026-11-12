'use client';

import { useId, type InputHTMLAttributes } from 'react';

export interface CampoTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  descricao?: string;
  erro?: string;
  aparencia?: 'padrao' | 'modal';
  reservarEspacoDescricao?: boolean;
}

const APARENCIAS = {
  padrao: { rotulo: 'text-sm font-medium text-texto-corpo', campo: 'h-10 rounded-[7px] bg-superficie-suave text-sm' },
  modal: {
    rotulo: 'text-xs font-medium text-texto-corpo',
    campo: 'min-w-0 h-9 rounded-lg bg-superficie text-xs placeholder:text-texto-apoio',
  },
};

export default function CampoTexto({
  rotulo,
  descricao,
  erro,
  aparencia = 'padrao',
  reservarEspacoDescricao = false,
  id,
  className = '',
  ...props
}: CampoTextoProps) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idDescricao = `${idCampo}-descricao`;
  const idErro = `${idCampo}-erro`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={idCampo} className={APARENCIAS[aparencia].rotulo}>
        {rotulo}
      </label>
      {descricao && (
        <p id={idDescricao} className="text-xs text-texto-apoio">
          {descricao}
        </p>
      )}
      {!descricao && reservarEspacoDescricao && <span aria-hidden="true" className="min-h-[17px]" />}
      <input
        id={idCampo}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[descricao && idDescricao, erro && idErro].filter(Boolean).join(' ') || undefined}
        className={`border px-3 text-texto-corpo outline-none focus:border-primaria focus:ring-2 focus:ring-primaria-clara ${APARENCIAS[aparencia].campo} ${erro ? 'border-erro' : 'border-borda'}`}
        {...props}
      />
      {erro && (
        <p id={idErro} className="text-xs text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}
