import { useRef, useState } from 'react';
import { localizarEndereco } from '@/app/lib/api';
import { CHAVE_GOOGLE_MAPS } from '@/app/lib/mapa';
import { enderecoParaLocalizar, type FormularioNovoPedido } from '@/app/lib/novoPedido';
import type { Coordenada, EnderecoLocalizado } from '@/app/lib/tipos';
import type { EtapaDoLocal } from './LocalNoMapa';

export const CONFIRME_O_PINO = 'Confirme o ponto de entrega no mapa antes de criar o pedido.';

function etapaDaBusca(achou: boolean, precisao: EnderecoLocalizado['precisao']): EtapaDoLocal {
  if (!achou) return 'nao-encontrado';
  return precisao === 'exato' ? 'encontrado' : 'aproximado';
}

export function useLocalDoPedido(dadosDoFormulario: FormularioNovoPedido) {
  const [destino, definirDestino] = useState<Coordenada | null>(null);
  const [etapa, definirEtapa] = useState<EtapaDoLocal>('pendente');
  const [tentativa, definirTentativa] = useState(0);
  const [enderecoEncontrado, definirEnderecoEncontrado] = useState<string | null>(null);
  const [erro, definirErro] = useState('');
  // Uma busca antiga não pode sobrescrever o pino depois que o endereço mudou.
  const buscaAtual = useRef(0);

  function esquecer() {
    buscaAtual.current += 1;
    definirDestino(null);
    definirEnderecoEncontrado(null);
    definirEtapa('pendente');
  }

  async function localizar() {
    const endereco = enderecoParaLocalizar(dadosDoFormulario);
    if (!endereco) return;
    const busca = ++buscaAtual.current;
    definirErro('');
    definirEtapa('localizando');
    try {
      const { coordenada, precisao, enderecoEncontrado: encontrado } = await localizarEndereco(endereco);
      if (busca !== buscaAtual.current) return;
      definirDestino(coordenada);
      definirEnderecoEncontrado(coordenada ? encontrado : null);
      definirEtapa(etapaDaBusca(coordenada !== null, precisao));
    } catch {
      if (busca !== buscaAtual.current) return;
      definirDestino(null);
      definirEnderecoEncontrado(null);
      definirEtapa('falhou');
    }
    definirTentativa((atual) => atual + 1);
  }

  function marcar(ponto: Coordenada) {
    definirDestino(ponto);
    definirEtapa('marcado');
    definirErro('');
  }

  function confirmar() {
    if (destino) marcar(destino);
  }

  // O entregador vai até o pino, então o estabelecimento precisa confirmá-lo.
  // Sem a chave o mapa nem aparece, e o back geocodifica o endereço sozinho.
  function faltaConfirmar(formulario: HTMLFormElement): boolean {
    if (!CHAVE_GOOGLE_MAPS || etapa === 'marcado') return false;
    definirErro(CONFIRME_O_PINO);
    const secao = formulario.querySelector('[data-local-no-mapa]');
    const alvo = secao?.querySelector<HTMLElement>('[data-confirmar]') ?? secao?.querySelector<HTMLElement>('button');
    alvo?.focus();
    return true;
  }

  return {
    destino,
    esquecer,
    faltaConfirmar,
    propriedades: {
      etapa,
      destino,
      tentativa,
      enderecoEncontrado,
      podeLocalizar: enderecoParaLocalizar(dadosDoFormulario) !== null,
      aoLocalizar: localizar,
      aoMarcar: marcar,
      aoConfirmar: confirmar,
      erro,
    },
  };
}
