import { emailDeTeste, URL_DA_API } from './ambiente';
import { gerarCnpj, gerarCpf, gerarSufixo, gerarSufixoDeLetras } from './dados';

export interface Personas {
  empresa: { email: string; senha: string };
  entregador: { cpf: string; senha: string };
}

async function chamarApi(caminho: string, corpo: unknown, cookie?: string) {
  const resposta = await fetch(`${URL_DA_API}${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) throw new Error(`${caminho} respondeu HTTP ${resposta.status}: ${await resposta.text()}`);
  const sessao = resposta.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  return { corpo: await resposta.json(), sessao };
}

export async function prepararPersonas(): Promise<Personas> {
  const sufixo = gerarSufixo();
  const empresa = { email: emailDeTeste('autenticacao', sufixo), senha: `Empresa@${sufixo}` };
  const entregador = { cpf: gerarCpf(), senha: `Entregador@${sufixo}` };

  const cadastro = await chamarApi('/auth/cadastrar/empresa', {
    nomeFantasia: `Lanchonete Selenium ${sufixo}`,
    razaoSocial: `Lanchonete Selenium ${sufixo} Ltda`,
    cnpj: gerarCnpj(),
    email: empresa.email,
    telefone: '61933330009',
    cep: '70040010',
    logradouro: 'SBS Quadra 2',
    numero: 12,
    bairro: 'Asa Sul',
    cidade: 'Brasilia',
    uf: 'DF',
    senha: empresa.senha,
  });
  const novo = await chamarApi(
    '/entregadores',
    {
      nome: `Elisa Selenium ${gerarSufixoDeLetras()}`,
      cpf: entregador.cpf,
      telefone: '61977770009',
      tipoVeiculo: 'BICICLETA',
    },
    cadastro.sessao,
  );
  const primeiroLogin = await chamarApi('/auth/login/entregador', {
    cpf: entregador.cpf,
    senha: novo.corpo.senhaTemporaria,
  });
  await chamarApi(
    '/auth/entregador/trocar-senha',
    { senhaAtual: novo.corpo.senhaTemporaria, novaSenha: entregador.senha, cienteDadosCompartilhados: true },
    primeiroLogin.sessao,
  );
  return { empresa, entregador };
}
