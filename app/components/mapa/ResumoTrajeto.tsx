import { formatarDistanciaRestante, formatarTempoRestante, horarioDeChegada } from '@/app/lib/mapa';

export interface ResumoTrajetoProps {
  distanciaRestanteM: number | null;
  duracaoRestanteS: number | null;
  estimado: boolean;
  mensagemSemDados?: string;
}

export default function ResumoTrajeto({
  distanciaRestanteM,
  duracaoRestanteS,
  estimado,
  mensagemSemDados = 'Aguardando a localização do entregador.',
}: ResumoTrajetoProps) {
  const distancia = formatarDistanciaRestante(distanciaRestanteM);
  const tempo = formatarTempoRestante(duracaoRestanteS);
  const chegada = horarioDeChegada(duracaoRestanteS);

  if (!distancia || !tempo) {
    return <p className="text-xs text-texto-apoio">{mensagemSemDados}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-2 gap-3" aria-live="polite">
        <div className="rounded-[14px] bg-primaria-clara p-3">
          <dt className="text-[11px] text-primaria-escura">Chegada prevista</dt>
          <dd className="font-titulo text-xl font-bold text-texto">{chegada}</dd>
          <dd className="text-[11px] text-texto-apoio">em {tempo}</dd>
        </div>
        <div className="rounded-[14px] bg-superficie-suave p-3 ring-1 ring-borda">
          <dt className="text-[11px] text-texto-apoio">Distância restante</dt>
          <dd className="font-titulo text-xl font-bold text-texto">{distancia}</dd>
        </div>
      </dl>
      {estimado && <p className="text-[11px] text-texto-suave">Estimativa aproximada, calculada em linha reta.</p>}
    </div>
  );
}
