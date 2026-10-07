import type { DadosCompartilhados } from '@/app/lib/tipos';

export interface LinhaDadoCompartilhado {
  rotulo: string;
  valor: string;
}

const ROTULO_VEICULO: Record<string, string> = {
  MOTO: 'Moto',
  CARRO: 'Carro',
  BICICLETA: 'Bicicleta',
};

export function formatarCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

export function linhasDadosCompartilhados(dados: DadosCompartilhados): LinhaDadoCompartilhado[] {
  return [
    { rotulo: 'Nome', valor: dados.nome },
    { rotulo: 'CPF', valor: formatarCpf(dados.cpf) },
    { rotulo: 'Veículo', valor: ROTULO_VEICULO[dados.tipoVeiculo] ?? dados.tipoVeiculo },
    { rotulo: 'Placa', valor: dados.placa ?? 'Sem placa' },
    { rotulo: 'Disponibilidade', valor: dados.disponivel ? 'Disponível para entregas' : 'Indisponível' },
  ];
}
