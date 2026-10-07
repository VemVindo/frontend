import CabecalhoRecebedor from '@/app/components/layout/CabecalhoRecebedor';
import { PEDIDO_EXEMPLO } from '@/app/lib/exemplos';

// O [codigo] da URL é o código de acesso do recebedor, não o número do pedido:
// quem busca o pedido a partir do código é o backend.
export default function LayoutRastreio({ children }: LayoutProps<'/rastreio/[codigo]'>) {
  return (
    <>
      <CabecalhoRecebedor {...PEDIDO_EXEMPLO} />
      <main className="mx-auto w-full max-w-[1280px] px-[18px] pb-6 md:px-10 md:py-12">{children}</main>
    </>
  );
}
