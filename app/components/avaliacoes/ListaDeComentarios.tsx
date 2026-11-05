import EstrelasDaNota from '@/app/components/avaliacoes/EstrelasDaNota';
import { formatarDataHora } from '@/app/lib/pedidos';
import type { AvaliacaoDaEmpresa } from '@/app/lib/tipos';

export interface ListaDeComentariosProps {
  avaliacoes: AvaliacaoDaEmpresa[];
}

export default function ListaDeComentarios({ avaliacoes }: ListaDeComentariosProps) {
  if (avaliacoes.length === 0) {
    return <p className="text-xs text-texto-apoio">Nenhuma avaliação encontrada com esses filtros.</p>;
  }

  return (
    <ul className="flex flex-col gap-[10px]">
      {avaliacoes.map((avaliacao) => (
        <li
          key={avaliacao.idPedido}
          className="flex flex-col gap-2 rounded-[10px] border border-borda p-3 md:flex-row md:gap-6"
        >
          <EstrelasDaNota nota={avaliacao.nota} />
          <div className="flex flex-1 flex-col gap-1">
            {avaliacao.comentario ? (
              <p className="text-xs text-texto-corpo">&quot;{avaliacao.comentario}&quot;</p>
            ) : (
              <p className="text-xs text-texto-suave">Sem comentário escrito.</p>
            )}
            <p className="flex flex-wrap gap-x-3 text-[11px] text-texto-apoio">
              <span>{avaliacao.entregador ?? 'Entregador não informado'}</span>
              <span>Pedido #{avaliacao.idPedido}</span>
              <span>{formatarDataHora(avaliacao.data)}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
