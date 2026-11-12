import IconeAdicionarPessoa from '@/app/components/icones/IconeAdicionarPessoa';
import IconeConvite from '@/app/components/icones/IconeConvite';
import Botao from '@/app/components/ui/Botao';

export interface AcoesDaFrotaProps {
  onCadastrar: () => void;
  onConvidar: () => void;
  className?: string;
}

const BOTAO =
  'inline-flex h-auto min-h-11 items-center justify-center gap-2 rounded-[14px] px-5 py-2 text-center text-sm md:h-11 md:whitespace-nowrap md:py-0';

export default function AcoesDaFrota({ onCadastrar, onConvidar, className = '' }: AcoesDaFrotaProps) {
  return (
    <div className={`flex flex-col gap-3 md:flex-row ${className}`}>
      <Botao variante="claro" onClick={onConvidar} className={BOTAO}>
        <IconeConvite className="size-5 shrink-0" />
        Convidar entregador que já usa o VemVindo
      </Botao>
      <Botao variante="primario" onClick={onCadastrar} className={BOTAO}>
        <IconeAdicionarPessoa className="size-5 shrink-0" />
        Cadastrar entregador
      </Botao>
    </div>
  );
}
