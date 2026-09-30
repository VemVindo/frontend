import CabecalhoEntregador from '@/app/components/layout/CabecalhoEntregador';

// Dados fixos até o login do entregador estar pronto.
const entregadorExemplo = {
  nome: 'Marcos Vinícius',
  iniciais: 'MV',
  veiculo: 'Moto · RGB4E27',
};

export default function LayoutEntregador({ children }: LayoutProps<'/entregador'>) {
  return (
    <>
      <CabecalhoEntregador {...entregadorExemplo} />
      <main className="mx-auto w-full max-w-[1280px] px-[18px] py-5 md:px-10 md:py-6">{children}</main>
    </>
  );
}
