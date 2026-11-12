import Card from '@/app/components/ui/Card';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import AcoesDaFrota from './AcoesDaFrota';
import ListaDaFrota, { type EstadoDesempenho } from './ListaDaFrota';

export interface PainelDaFrotaProps {
  entregadores: DadosCompartilhados[] | null;
  erro: boolean;
  aviso: string | null;
  desempenhoPorCpf: Record<string, EstadoDesempenho>;
  totalPagoPorCpf: Record<string, number>;
  erroTotalPago: boolean;
  onCadastrar: () => void;
  onEditar: (entregador: DadosCompartilhados) => void;
  onRemover: (entregador: DadosCompartilhados) => void;
  onConvidar: () => void;
}

export default function PainelDaFrota({
  entregadores,
  erro,
  aviso,
  desempenhoPorCpf,
  totalPagoPorCpf,
  erroTotalPago,
  onCadastrar,
  onEditar,
  onRemover,
  onConvidar,
}: PainelDaFrotaProps) {
  return (
    <Card titulo="Entregadores">
      {aviso && (
        <p role="status" className="mb-3 text-xs text-sucesso-texto">
          {aviso}
        </p>
      )}
      {erro && (
        <p role="alert" className="text-xs text-erro">
          Não foi possível carregar a frota agora.
        </p>
      )}
      {!entregadores && !erro && <p className="text-xs text-texto-apoio">Carregando a frota...</p>}
      {entregadores && (
        <ListaDaFrota
          entregadores={entregadores}
          desempenhoPorCpf={desempenhoPorCpf}
          totalPagoPorCpf={totalPagoPorCpf}
          erroTotalPago={erroTotalPago}
          onEditar={onEditar}
          onRemover={onRemover}
        />
      )}
      <AcoesDaFrota onCadastrar={onCadastrar} onConvidar={onConvidar} className="mt-4 md:hidden" />
    </Card>
  );
}
