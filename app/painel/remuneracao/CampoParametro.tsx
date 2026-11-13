import type { ChangeEvent } from 'react';
import { somenteValorEmReais } from '@/app/lib/entrada';

export interface CampoParametroProps {
  id: string;
  rotulo: string;
  descricao: string;
  valor: string;
  erro?: string;
  desabilitado?: boolean;
  onChange: (valor: string) => void;
}

export default function CampoParametro({
  id,
  rotulo,
  descricao,
  valor,
  erro,
  desabilitado,
  onChange,
}: CampoParametroProps) {
  const idDescricao = `${id}-descricao`;
  const idErro = `${id}-erro`;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[8px] border bg-superficie px-[11px] py-3 md:px-[15px] ${erro ? 'border-erro' : 'border-borda'}`}
    >
      <div>
        <label htmlFor={id} className="text-xs font-semibold text-texto-corpo md:font-normal">
          {rotulo}
        </label>
        <p id={idDescricao} className="mt-1 text-xs text-texto-apoio">
          {descricao}
        </p>
        {erro && (
          <p id={idErro} className="mt-1 text-xs text-erro">
            {erro}
          </p>
        )}
      </div>

      <div className="flex h-[38px] w-[104px] shrink-0 items-center gap-1 rounded-[8px] border border-borda bg-superficie-suave px-2 text-xs font-semibold text-texto-corpo focus-within:border-primaria focus-within:ring-2 focus-within:ring-primaria-clara md:h-10 md:w-[190px] md:rounded-[7px] md:px-[13px] md:text-sm md:font-normal">
        <span aria-hidden>R$</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          disabled={desabilitado}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${idDescricao} ${idErro}` : idDescricao}
          onChange={(evento: ChangeEvent<HTMLInputElement>) => onChange(somenteValorEmReais(evento.target.value))}
          className="w-full min-w-0 bg-transparent outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}
