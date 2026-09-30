type Variante = 'escuro' | 'claro' | 'marca';

interface AvatarProps {
  iniciais: string;
  variante?: Variante;
  tamanho?: number;
}

const estilosPorVariante: Record<Variante, string> = {
  escuro: 'rounded-full bg-primaria-escura text-white',
  claro: 'rounded-full bg-primaria-clara text-primaria-escura',
  marca: 'rounded-[11px] bg-texto text-white',
};

export default function Avatar({ iniciais, variante = 'claro', tamanho = 44 }: AvatarProps) {
  return (
    <span
      aria-hidden
      style={{ width: tamanho, height: tamanho }}
      className={`inline-flex shrink-0 items-center justify-center font-titulo font-bold text-[13px] ${estilosPorVariante[variante]}`}
    >
      {iniciais}
    </span>
  );
}
