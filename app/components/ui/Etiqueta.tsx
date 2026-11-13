import type { ReactNode } from 'react';

export type TomEtiqueta = 'sucesso' | 'alerta' | 'erro' | 'neutro';

export interface EtiquetaProps {
  tom?: TomEtiqueta;
  children: ReactNode;
}

const estilosPorTom: Record<TomEtiqueta, string> = {
  sucesso: 'bg-sucesso-fundo text-sucesso-texto',
  alerta: 'bg-alerta/15 text-texto',
  erro: 'bg-erro/10 text-erro',
  neutro: 'bg-primaria-clara text-primaria-escura',
};

export default function Etiqueta({ tom = 'neutro', children }: EtiquetaProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 h-[30px] whitespace-nowrap px-3 rounded-full text-xs font-semibold ${estilosPorTom[tom]}`}
    >
      {children}
    </span>
  );
}
