import Etiqueta from '@/app/components/ui/Etiqueta';
import { formatarTelefone, rotuloDoVeiculo } from '@/app/lib/dadosCompartilhados';
import { precisaDePlaca } from '@/app/lib/entregadores';
import type { DadosCompartilhados, TipoVeiculo } from '@/app/lib/tipos';

export interface ListaDaFrotaProps {
  entregadores: DadosCompartilhados[];
  onEditar?: (entregador: DadosCompartilhados) => void;
}

const BOTAO_EDITAR = 'cursor-pointer text-xs font-semibold text-destaque hover:underline';

export default function ListaDaFrota({ entregadores, onEditar }: ListaDaFrotaProps) {
  if (entregadores.length === 0) {
    return <p className="text-xs text-texto-apoio">Nenhum entregador na frota ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-[10px]">
      {entregadores.map((entregador) => (
        <li
          key={entregador.cpf}
          className="flex flex-col gap-2 rounded-[8px] border border-borda px-[13px] py-3 text-xs text-texto-corpo md:flex-row md:items-center md:gap-4"
        >
          <span className="text-sm font-medium md:flex-1">{entregador.nome}</span>
          <span className="text-texto-apoio md:w-[130px]">{formatarTelefone(entregador.telefone)}</span>
          <span className="text-texto-apoio md:w-[150px]">
            {rotuloDoVeiculo(entregador.tipoVeiculo)}
            {entregador.placa && precisaDePlaca(entregador.tipoVeiculo as TipoVeiculo) && ` - ${entregador.placa}`}
          </span>
          <span className="md:w-[120px]">
            <Etiqueta tom={entregador.disponivel ? 'sucesso' : 'neutro'}>
              {entregador.disponivel ? 'Disponível' : 'Indisponível'}
            </Etiqueta>
          </span>
          {onEditar && (
            <button
              type="button"
              onClick={() => onEditar(entregador)}
              aria-label={`Editar ${entregador.nome}`}
              className={`self-start md:self-auto ${BOTAO_EDITAR}`}
            >
              Editar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
