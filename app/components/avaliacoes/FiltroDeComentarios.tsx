import IconeEstrela from '@/app/components/icones/IconeEstrela';
import CampoTexto from '@/app/components/ui/CampoTexto';
import { NOTAS_DO_FILTRO, alternarNota, periodoInvalido } from '@/app/lib/comentarios';
import type { FiltroDeAvaliacoes } from '@/app/lib/tipos';

export interface FiltroDeComentariosProps {
  filtro: FiltroDeAvaliacoes;
  onAlterar: (filtro: FiltroDeAvaliacoes) => void;
}

const BOTAO = 'flex h-9 cursor-pointer items-center gap-1 rounded-[10px] border px-3 text-xs';
const ATIVO = 'border-primaria-clara bg-primaria-clara text-primaria-escura';
const INATIVO = 'border-borda bg-superficie text-texto-apoio';

export default function FiltroDeComentarios({ filtro, onAlterar }: FiltroDeComentariosProps) {
  const todas = filtro.notas.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Filtrar por nota" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={todas}
          onClick={() => onAlterar({ ...filtro, notas: [] })}
          className={`${BOTAO} ${todas ? ATIVO : INATIVO}`}
        >
          Todas
        </button>
        {NOTAS_DO_FILTRO.map((nota) => {
          const marcada = filtro.notas.includes(nota);
          return (
            <button
              key={nota}
              type="button"
              aria-pressed={marcada}
              aria-label={`Nota ${nota}`}
              onClick={() => onAlterar({ ...filtro, notas: alternarNota(filtro.notas, nota) })}
              className={`${BOTAO} ${marcada ? ATIVO : INATIVO}`}
            >
              {nota}
              <IconeEstrela className="size-3.5" />
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CampoTexto
          rotulo="De"
          type="date"
          value={filtro.de}
          onChange={(evento) => onAlterar({ ...filtro, de: evento.target.value })}
        />
        <CampoTexto
          rotulo="Até"
          type="date"
          value={filtro.ate}
          erro={periodoInvalido(filtro) ? 'A data final precisa ser depois da inicial.' : undefined}
          onChange={(evento) => onAlterar({ ...filtro, ate: evento.target.value })}
        />
      </div>
    </div>
  );
}
