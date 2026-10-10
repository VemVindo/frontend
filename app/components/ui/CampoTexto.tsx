'use client';

import { useId, type InputHTMLAttributes } from 'react';

export interface CampoTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  descricao?: string;
  erro?: string;
  aparencia?: 'padrao' | 'modal';
}

export default function CampoTexto({
  rotulo,
  descricao,
  erro,
  aparencia = 'padrao',
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
      <label htmlFor={idCampo} className={aparencia === 'modal' ? 'text-[11px] text-texto-apoio' : 'text-xs text-texto-corpo'}>
        {rotulo}
      </label>
      {descricao && (
        <p id={idDescricao} className="text-[11px] text-texto-apoio">
          {descricao}
        </p>
      )}
      <input
        id={idCampo}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[descricao && idDescricao, erro && idErro].filter(Boolean).join(' ') || undefined}
        className={`border px-3 text-texto-corpo outline-none focus:border-primaria focus:ring-2 focus:ring-primaria-clara ${aparencia === 'modal' ? 'min-w-0 h-9 rounded-lg bg-superficie text-xs placeholder:text-texto-apoio' : 'h-10 rounded-[7px] bg-superficie-suave text-[13px]'} ${erro ? 'border-erro' : 'border-borda'}`}
        {...props}
      />
      {erro && (
        <p id={idErro} className="text-[11px] text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}
