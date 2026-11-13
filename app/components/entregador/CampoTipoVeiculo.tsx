import { rotuloDoVeiculo } from '@/app/lib/dadosCompartilhados';
import { TIPOS_DE_VEICULO } from '@/app/lib/entregadores';
import type { TipoVeiculo } from '@/app/lib/tipos';

export interface CampoTipoVeiculoProps {
  id: string;
  valor: TipoVeiculo | '';
  erro?: string;
  desabilitado?: boolean;
  /** Sem a opção "Selecione", para quando o entregador já tem um veículo. */
  obrigatorio?: boolean;
  onChange: (tipoVeiculo: TipoVeiculo | '') => void;
}

export default function CampoTipoVeiculo({
  id,
  valor,
  erro,
  desabilitado,
  obrigatorio,
  onChange,
}: CampoTipoVeiculoProps) {
  const idDescricao = `${id}-descricao`;
  const idErro = `${id}-erro`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-texto-corpo">
        Tipo de veículo
      </label>
      <p id={idDescricao} className="text-xs text-texto-apoio">
        Moto e carro pedem a placa
      </p>
      <select
        id={id}
        value={valor}
        disabled={desabilitado}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idDescricao} ${idErro}` : idDescricao}
        onChange={(evento) => onChange(evento.target.value as TipoVeiculo | '')}
        className={`h-10 rounded-[7px] border bg-superficie-suave px-2 text-sm text-texto-corpo outline-none focus:border-primaria focus:ring-2 focus:ring-primaria-clara ${erro ? 'border-erro' : 'border-borda'}`}
      >
        {!obrigatorio && <option value="">Selecione</option>}
        {TIPOS_DE_VEICULO.map((tipo) => (
          <option key={tipo} value={tipo}>
            {rotuloDoVeiculo(tipo)}
          </option>
        ))}
      </select>
      {erro && (
        <p id={idErro} className="text-xs text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}
