import { formatarDistanciaRestante, formatarTempoRestante } from '@/app/lib/mapa';

export interface PilulaTrajetoProps {
  distanciaRestanteM: number | null;
  duracaoRestanteS: number | null;
  className?: string;
}

export default function PilulaTrajeto({ distanciaRestanteM, duracaoRestanteS, className = '' }: PilulaTrajetoProps) {
  const tempo = formatarTempoRestante(duracaoRestanteS);
  const distancia = formatarDistanciaRestante(distanciaRestanteM);
  if (!tempo || !distancia) return null;

  return (
    <p
      className={`flex h-[30px] items-center whitespace-nowrap rounded-[15px] bg-superficie px-5 text-[11.5px] font-bold text-texto md:h-9 md:rounded-[14px] md:pl-10 md:font-titulo md:text-xs ${className}`}
    >
      <span aria-hidden className="mr-1">
        ◷
      </span>
      {tempo} · {distancia} restantes
    </p>
  );
}
