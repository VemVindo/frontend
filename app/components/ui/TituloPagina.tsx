import type { ReactNode } from 'react';

export interface TituloPaginaProps {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
}

export default function TituloPagina({ titulo, subtitulo, acao }: TituloPaginaProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6 md:mb-10">
      <div>
        <h1 className="font-titulo font-bold text-[22px] md:text-[26px]">{titulo}</h1>
        {subtitulo && <p className="text-[13px] text-texto-suave mt-1">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}
