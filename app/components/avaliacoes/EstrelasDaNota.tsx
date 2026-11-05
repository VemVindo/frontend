import IconeEstrela from '@/app/components/icones/IconeEstrela';

export interface EstrelasDaNotaProps {
  nota: number;
}

const POSICOES = [1, 2, 3, 4, 5];

export default function EstrelasDaNota({ nota }: EstrelasDaNotaProps) {
  return (
    <span role="img" aria-label={`Nota ${nota} de 5`} className="flex gap-0.5">
      {POSICOES.map((posicao) => (
        <IconeEstrela key={posicao} className={`size-4 ${posicao <= nota ? 'text-primaria' : 'text-primaria-clara'}`} />
      ))}
    </span>
  );
}
