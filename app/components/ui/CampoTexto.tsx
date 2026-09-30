'use client';

import { useId, type InputHTMLAttributes } from 'react';

interface CampoTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  descricao?: string;
  erro?: string;
}

export default function CampoTexto({
  rotulo,
  descricao,
  erro,
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
      <label htmlFor={idCampo} className="text-xs text-texto-corpo">
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
        className={`h-10 rounded-[7px] border bg-superficie-suave px-3 text-[13px] text-texto-corpo outline-none focus:border-primaria focus:ring-2 focus:ring-primaria-clara ${erro ? 'border-erro' : 'border-borda'}`}
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
