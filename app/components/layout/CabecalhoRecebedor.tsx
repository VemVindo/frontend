import Avatar from '@/app/components/ui/Avatar';

interface CabecalhoRecebedorProps {
  nomeEstabelecimento: string;
  iniciaisEstabelecimento: string;
  numeroPedido: string;
}

export default function CabecalhoRecebedor({
  nomeEstabelecimento,
  iniciaisEstabelecimento,
  numeroPedido,
}: CabecalhoRecebedorProps) {
  return (
    <header className="md:bg-superficie">
      <div className="mx-auto flex h-[76px] max-w-[1280px] items-center gap-3 px-[18px] md:px-9">
        <Avatar iniciais={iniciaisEstabelecimento} variante="marca" tamanho={38} />
        <div>
          <p className="font-bold md:font-titulo text-[13px] md:text-[15px]">{nomeEstabelecimento}</p>
          <p className="text-[11px] text-texto-suave">Pedido #{numeroPedido}</p>
        </div>
      </div>
    </header>
  );
}
