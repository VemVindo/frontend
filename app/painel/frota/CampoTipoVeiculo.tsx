import { rotuloDoVeiculo } from '@/app/lib/dadosCompartilhados';
import { TIPOS_DE_VEICULO } from '@/app/lib/entregadores';
import type { TipoVeiculo } from '@/app/lib/tipos';

export interface CampoTipoVeiculoProps {
  id: string;
  valor: TipoVeiculo | '';
  erro?: string;
  desabilitado?: boolean;
  onChange: (tipoVeiculo: TipoVeiculo | '') => void;
}

export default function CampoTipoVeiculo({ id, valor, erro, desabilitado, onChange }: CampoTipoVeiculoProps) {
  const idDescricao = `${id}-descricao`;
  const idErro = `${id}-erro`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-texto-corpo">
        Tipo de veículo
      </label>
      <p id={idDescricao} className="text-[11px] text-texto-apoio">
        Moto e carro pedem a placa
      </p>
      <select
        id={id}
        value={valor}
        disabled={desabilitado}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idDescricao} ${idErro}` : idDescricao}
        onChange={(evento) => onChange(evento.target.value as TipoVeiculo | '')}
        className={`h-10 rounded-[7px] border bg-superficie-suave px-2 text-[13px] text-texto-corpo outline-none focus:border-primaria focus:ring-2 focus:ring-primaria-clara ${erro ? 'border-erro' : 'border-borda'}`}
      >
        <option value="">Selecione</option>
        {TIPOS_DE_VEICULO.map((tipo) => (
          <option key={tipo} value={tipo}>
            {rotuloDoVeiculo(tipo)}
          </option>
        ))}
      </select>
      {erro && (
        <p id={idErro} className="text-[11px] text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}
