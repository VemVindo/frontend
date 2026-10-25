import CampoTexto from '@/app/components/ui/CampoTexto';
import { periodoDeConclusaoInvalido } from '@/app/lib/finalizados';
import type { PeriodoDeConclusao } from '@/app/lib/tipos';

export interface FiltroDePeriodoProps {
  periodo: PeriodoDeConclusao;
  onAlterar: (periodo: PeriodoDeConclusao) => void;
}

export default function FiltroDePeriodo({ periodo, onAlterar }: FiltroDePeriodoProps) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <CampoTexto
        rotulo="Concluído de"
        type="date"
        value={periodo.de}
        onChange={(evento) => onAlterar({ ...periodo, de: evento.target.value })}
      />
      <CampoTexto
        rotulo="Até"
        type="date"
        value={periodo.ate}
        erro={periodoDeConclusaoInvalido(periodo) ? 'A data final precisa ser depois da inicial.' : undefined}
        onChange={(evento) => onAlterar({ ...periodo, ate: evento.target.value })}
      />
    </div>
  );
}
