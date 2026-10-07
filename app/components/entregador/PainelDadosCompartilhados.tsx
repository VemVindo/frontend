import IconeEscudo from '@/app/components/icones/IconeEscudo';
import IconeInfo from '@/app/components/icones/IconeInfo';
import { linhasDadosCompartilhados } from '@/app/lib/dadosCompartilhados';
import type { DadosCompartilhados } from '@/app/lib/tipos';

interface PainelDadosCompartilhadosProps {
  dados: DadosCompartilhados;
}

export default function PainelDadosCompartilhados({ dados }: PainelDadosCompartilhadosProps) {
  return (
    <section aria-labelledby="titulo-dados-compartilhados" className="w-full rounded-xl bg-superficie xl:bg-fundo p-4 xl:p-5">
      <h2 id="titulo-dados-compartilhados" className="flex items-center gap-2 text-[15px] font-semibold text-texto">
        <IconeEscudo className="h-5 w-5 text-primaria" />
        O que as empresas veem sobre você
      </h2>
      <p className="mt-1 text-[13px] text-texto-suave">
        Só depois que você aceita o convite de uma empresa, ela passa a ver:
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        {linhasDadosCompartilhados(dados).map(({ rotulo, valor }) => (
          <div key={rotulo} className="contents">
            <dt className="text-texto-suave">{rotulo}</dt>
            <dd className="font-medium text-texto">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex gap-2 text-[12px] text-texto-suave">
        <IconeInfo className="h-4 w-4 shrink-0 mt-px" />
        Se você sair da frota, a empresa deixa de ver esses dados e fica só com o histórico das entregas que você fez para ela.
      </p>
    </section>
  );
}
