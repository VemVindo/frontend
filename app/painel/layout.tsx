import NavPainel from '@/app/components/layout/NavPainel';

export default function LayoutPainel({ children }: LayoutProps<'/painel'>) {
  return (
    <>
      <NavPainel />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-[42px] md:py-9">{children}</main>
    </>
  );
}
