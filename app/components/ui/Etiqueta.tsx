import type { ReactNode } from 'react';

type Tom = 'sucesso' | 'alerta' | 'erro' | 'neutro';

interface EtiquetaProps {
  tom?: Tom;
  children: ReactNode;
}

const estilosPorTom: Record<Tom, string> = {
  sucesso: 'bg-sucesso-fundo text-sucesso-texto',
  alerta: 'bg-alerta/15 text-texto',
  erro: 'bg-erro/10 text-erro',
  neutro: 'bg-primaria-clara text-primaria-escura',
};

export default function Etiqueta({ tom = 'neutro', children }: EtiquetaProps) {
  return (
    <span className={`inline-flex items-center h-[30px] px-3 rounded-full text-[10px] font-semibold ${estilosPorTom[tom]}`}>
      {children}
    </span>
  );
}
