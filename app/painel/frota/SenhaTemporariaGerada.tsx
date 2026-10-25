import Botao from '@/app/components/ui/Botao';
import { formatarDataHora } from '@/app/lib/pedidos';
import type { EntregadorCadastrado } from '@/app/lib/tipos';

export interface SenhaTemporariaGeradaProps {
  cadastrado: EntregadorCadastrado;
  onCadastrarOutro: () => void;
}

export default function SenhaTemporariaGerada({ cadastrado, onCadastrarOutro }: SenhaTemporariaGeradaProps) {
  return (
    <div role="status" className="flex flex-col gap-4">
      <p className="text-[13px] text-sucesso-texto">{cadastrado.entregador.nome} foi cadastrado.</p>
      <div className="rounded-[8px] border border-borda bg-superficie-suave px-4 py-3">
        <p className="text-xs text-texto-apoio">Senha temporária</p>
        <p className="mt-1 select-all font-mono text-lg font-semibold text-texto">{cadastrado.senhaTemporaria}</p>
        <p className="mt-1 text-[11px] text-texto-apoio">
          Vale até {formatarDataHora(cadastrado.senhaTemporariaExpiraEm)}.
        </p>
      </div>
      <p className="text-xs text-texto-apoio">
        Passe esta senha ao entregador. Ele entra em &quot;Sou entregador&quot; com o CPF e essa senha, cria a própria
        senha e aceita o convite para entrar na frota. Ela não aparece de novo.
      </p>
      <Botao variante="claro" className="self-start" onClick={onCadastrarOutro}>
        Cadastrar outro entregador
      </Botao>
    </div>
  );
}
