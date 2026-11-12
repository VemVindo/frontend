import IconeEscudo from '@/app/components/icones/IconeEscudo';
import IconeInfo from '@/app/components/icones/IconeInfo';
import { linhasDadosCompartilhados } from '@/app/lib/dadosCompartilhados';
import type { DadosCompartilhados } from '@/app/lib/tipos';

interface PainelDadosCompartilhadosProps {
  dados: DadosCompartilhados;
}

export default function PainelDadosCompartilhados({ dados }: PainelDadosCompartilhadosProps) {
  return (
    <section
      aria-labelledby="titulo-dados-compartilhados"
      className="w-full rounded-[18px] bg-superficie p-4 ring-1 ring-borda xl:p-5"
    >
      <h2 id="titulo-dados-compartilhados" className="flex items-center gap-2 text-[15px] font-semibold text-texto">
        <IconeEscudo className="h-5 w-5 text-primaria" />O que as empresas veem sobre você
      </h2>
      <p className="mt-1 text-sm text-texto-apoio">
        Só depois que você aceita o convite de uma empresa, ela passa a ver:
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {linhasDadosCompartilhados(dados).map(({ rotulo, valor }) => (
          <div key={rotulo} className="contents">
            <dt className="text-texto-apoio">{rotulo}</dt>
            <dd className="font-medium text-texto">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex gap-2 text-xs leading-relaxed text-texto-apoio">
        <IconeInfo className="h-4 w-4 shrink-0 mt-px" />
        Se você sair da frota, a empresa deixa de ver esses dados e fica só com o histórico das entregas que você fez
        para ela.
      </p>
      <p className="mt-2 flex gap-2 text-xs leading-relaxed text-texto-apoio">
        <IconeInfo className="h-4 w-4 shrink-0 mt-px" />
        <span>
          WhatsApp: durante uma entrega em andamento, a empresa pode abrir uma conversa com você no WhatsApp pelo seu
          telefone, e você com ela. As mensagens ficam só no WhatsApp; a plataforma não envia nem guarda nenhuma.
        </span>
      </p>
      <p className="mt-2 flex gap-2 text-xs leading-relaxed text-texto-apoio">
        <IconeInfo className="h-4 w-4 shrink-0 mt-px" />
        <span>
          Localização: só durante uma entrega em andamento e só depois que você tocar em &quot;Compartilhar
          localização&quot;. O recebedor vê sua posição no mapa, se a empresa deixar o mapa ligado. Para calcular a rota
          e o tempo de chegada, sua posição e o endereço de entrega são enviados ao Google Maps. A posição fica guardada
          só até a entrega terminar e então é apagada.
        </span>
      </p>
    </section>
  );
}
