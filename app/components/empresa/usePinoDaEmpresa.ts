import { useRef, useState } from 'react';
import { localizarEnderecoDaEmpresa } from '@/app/lib/api';
import { enderecoDaEmpresaParaLocalizar, paraValores, type ValoresDaEmpresa } from '@/app/lib/empresa';
import { CHAVE_GOOGLE_MAPS } from '@/app/lib/mapa';
import type { CadastroDaEmpresa, Coordenada } from '@/app/lib/tipos';

export type EtapaDoPino =
  'localizando' | 'salvo' | 'encontrado' | 'aproximado' | 'marcado' | 'nao-encontrado' | 'falhou' | 'desatualizado';

// Fora destas etapas o pino não vai no PUT: o back mantém o ponto salvo ou,
// se o endereço mudou, recalcula pelo endereço novo.
const ETAPAS_QUE_ENVIAM: ReadonlySet<EtapaDoPino> = new Set(['salvo', 'encontrado', 'aproximado', 'marcado']);

export function usePinoDaEmpresa() {
  const [pino, definirPino] = useState<Coordenada | null>(null);
  const [etapa, definirEtapa] = useState<EtapaDoPino>('localizando');
  const [tentativa, definirTentativa] = useState(0);
  const [enderecoEncontrado, definirEnderecoEncontrado] = useState<string | null>(null);
  // Uma busca antiga não pode mover o pino depois que a empresa mexeu nele ou no endereço.
  const buscaAtual = useRef(0);

  function mostrar(novoPino: Coordenada | null, novaEtapa: EtapaDoPino, encontrado: string | null = null) {
    definirPino(novoPino);
    definirEtapa(novaEtapa);
    definirEnderecoEncontrado(encontrado);
    definirTentativa((atual) => atual + 1);
  }

  async function localizar(valores: ValoresDaEmpresa) {
    const busca = ++buscaAtual.current;
    const endereco = enderecoDaEmpresaParaLocalizar(valores);
    if (!endereco) {
      mostrar(null, 'nao-encontrado');
      return;
    }
    definirEtapa('localizando');
    try {
      const { coordenada, precisao, enderecoEncontrado: encontrado } = await localizarEnderecoDaEmpresa(endereco);
      if (busca !== buscaAtual.current) return;
      if (!coordenada) mostrar(null, 'nao-encontrado');
      else mostrar(coordenada, precisao === 'exato' ? 'encontrado' : 'aproximado', encontrado);
    } catch {
      if (busca === buscaAtual.current) mostrar(null, 'falhou');
    }
  }

  // Começo da edição: usa o ponto salvo ou sugere um pelo endereço cadastrado.
  function iniciar(cadastro: CadastroDaEmpresa) {
    if (!CHAVE_GOOGLE_MAPS) return;
    buscaAtual.current += 1;
    if (cadastro.origem) mostrar(cadastro.origem, 'salvo');
    else void localizar(paraValores(cadastro));
  }

  function enderecoMudou() {
    buscaAtual.current += 1;
    definirEtapa('desatualizado');
    definirEnderecoEncontrado(null);
  }

  function marcar(ponto: Coordenada) {
    buscaAtual.current += 1;
    definirPino(ponto);
    definirEtapa('marcado');
  }

  function manter() {
    definirEtapa('marcado');
  }

  function encerrar() {
    buscaAtual.current += 1;
  }

  function paraEnvio(): { origemLat: number; origemLng: number } | Record<string, never> {
    if (!pino || !ETAPAS_QUE_ENVIAM.has(etapa)) return {};
    return { origemLat: pino.lat, origemLng: pino.lng };
  }

  return {
    pino,
    etapa,
    tentativa,
    enderecoEncontrado,
    localizar,
    iniciar,
    enderecoMudou,
    marcar,
    manter,
    encerrar,
    paraEnvio,
  };
}
