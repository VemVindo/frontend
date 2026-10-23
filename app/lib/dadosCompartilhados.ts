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

export function rotuloDoVeiculo(tipoVeiculo: string): string {
  return ROTULO_VEICULO[tipoVeiculo] ?? tipoVeiculo;
}

export function formatarCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

// O telefone pode chegar com máscara ou com o DDI 55; fora dos formatos
// conhecidos, o valor segue como veio.
export function formatarTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '');
  const nacional = /^55\d{10,11}$/.test(digitos) ? digitos.slice(2) : digitos;
  const partes = /^(\d{2})(\d{4,5})(\d{4})$/.exec(nacional);
  return partes ? `(${partes[1]}) ${partes[2]}-${partes[3]}` : telefone;
}

export function linhasDadosCompartilhados(dados: DadosCompartilhados): LinhaDadoCompartilhado[] {
  return [
    { rotulo: 'Nome', valor: dados.nome },
    { rotulo: 'CPF', valor: formatarCpf(dados.cpf) },
    { rotulo: 'Telefone', valor: formatarTelefone(dados.telefone) },
    { rotulo: 'Veículo', valor: rotuloDoVeiculo(dados.tipoVeiculo) },
    { rotulo: 'Placa', valor: dados.placa ?? 'Sem placa' },
    { rotulo: 'Disponibilidade', valor: dados.disponivel ? 'Disponível para entregas' : 'Indisponível' },
  ];
}
