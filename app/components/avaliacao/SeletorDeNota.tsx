import IconeEstrela from '@/app/components/icones/IconeEstrela';
import { ESTRELAS, rotuloDaNota } from '@/app/lib/avaliacao';

export interface SeletorDeNotaProps {
  nota: number | null;
  desabilitado: boolean;
  onEscolher: (nota: number) => void;
}

export default function SeletorDeNota({ nota, desabilitado, onEscolher }: SeletorDeNotaProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div role="radiogroup" aria-label="Nota da entrega" className="flex gap-3">
        {ESTRELAS.map((estrela) => {
          const acesa = nota !== null && estrela <= nota;
          return (
            <button
              key={estrela}
              type="button"
              role="radio"
              aria-checked={nota === estrela}
              aria-label={`${estrela} de 5 estrelas`}
              disabled={desabilitado}
              onClick={() => onEscolher(estrela)}
              className={`cursor-pointer disabled:cursor-not-allowed ${acesa ? 'text-alerta' : 'text-primaria-clara'}`}
            >
              <IconeEstrela className="size-9" />
            </button>
          );
        })}
      </div>
      <p className="text-xs text-texto-apoio">{rotuloDaNota(nota)}</p>
      <button
        type="button"
        role="radio"
        aria-checked={nota === 0}
        disabled={desabilitado}
        onClick={() => onEscolher(0)}
        className={`cursor-pointer text-[11px] underline disabled:cursor-not-allowed ${nota === 0 ? 'text-texto' : 'text-texto-suave'}`}
      >
        Nenhuma estrela (nota 0)
      </button>
    </div>
  );
}
