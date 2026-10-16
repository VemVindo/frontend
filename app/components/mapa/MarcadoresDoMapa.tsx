import Image from 'next/image';

// Marcadores do Figma (Recebedor e Entregador, área do mapa), nos tamanhos
// originais dos SVGs. O ponto de ancoragem é o centro do círculo; o rótulo
// fica fora da caixa para não deslocar a âncora.

const ROTULO = 'absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[9.66px] font-bold leading-none';

export function MarcadorOrigem({ nome }: { nome: string }) {
  return (
    <div className="relative">
      <Image src="/mapa/marcador-origem.svg" alt="" width={20.9} height={23.6842} unoptimized />
      <span className={`${ROTULO} top-full mt-[3px] text-primaria`}>{nome}</span>
    </div>
  );
}

// "Você" para o recebedor; para o entregador, o nome de quem recebe.
export function MarcadorDestino({ rotulo }: { rotulo: string }) {
  return (
    <div className="relative">
      <span className={`${ROTULO} bottom-full mb-[5px] text-mapa-destino`}>{rotulo}</span>
      <Image src="/mapa/marcador-destino.svg" alt="" width={27.2816} height={30.5299} unoptimized />
    </div>
  );
}

export function MarcadorEntregador() {
  return (
    <div className="relative flex items-center justify-center">
      <Image src="/mapa/marcador-halo.svg" alt="" width={52} height={55} unoptimized />
      <Image
        src="/mapa/marcador-entregador.svg"
        alt=""
        width={33.8983}
        height={33.8983}
        unoptimized
        className="absolute"
      />
    </div>
  );
}
