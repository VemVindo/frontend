import Avatar from '@/app/components/ui/Avatar';

interface CabecalhoEntregadorProps {
  nome: string;
  iniciais: string;
  veiculo: string;
}

export default function CabecalhoEntregador({ nome, iniciais, veiculo }: CabecalhoEntregadorProps) {
  return (
    <header className="bg-superficie">
      <div className="mx-auto flex h-[70px] md:h-[76px] max-w-[1280px] items-center gap-3 px-[18px] md:px-9">
        <Avatar iniciais={iniciais} variante="escuro" tamanho={42} />
        <div>
          <p className="font-titulo font-bold text-[15px]">{nome}</p>
          <p className="text-[11px] text-texto-suave">{veiculo}</p>
        </div>
      </div>
    </header>
  );
}
