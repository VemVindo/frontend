import type { ChangeEvent } from 'react';

interface CampoParametroProps {
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
        <label htmlFor={id} className="text-[11px] font-semibold text-texto-corpo md:text-xs md:font-normal">
          {rotulo}
        </label>
        <p id={idDescricao} className="mt-1 text-[10px] text-texto-apoio md:text-[11px]">
          {descricao}
        </p>
        {erro && (
          <p id={idErro} className="mt-1 text-[11px] text-erro">
            {erro}
          </p>
        )}
      </div>

      <div className="flex h-[38px] w-[104px] shrink-0 items-center gap-1 rounded-[8px] border border-borda bg-superficie-suave px-2 text-[11px] font-semibold text-texto-corpo focus-within:border-primaria focus-within:ring-2 focus-within:ring-primaria-clara md:h-10 md:w-[190px] md:rounded-[7px] md:px-[13px] md:text-[13px] md:font-normal">
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
          onChange={(evento: ChangeEvent<HTMLInputElement>) => onChange(evento.target.value)}
          className="w-full min-w-0 bg-transparent outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}
