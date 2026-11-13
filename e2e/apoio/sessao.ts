import type { Tela } from './tela';

export async function entrarComoEmpresa(tela: Tela, email: string, senha: string): Promise<void> {
  await tela.abrir('/');
  await tela.preencher('EMAIL', email);
  await tela.preencher('SENHA', senha);
  await tela.clicarBotao('Acessar');
}

export async function entrarComoEntregador(tela: Tela, cpf: string, senha: string): Promise<void> {
  await tela.abrir('/login/entregador');
  await tela.preencher('CPF', cpf);
  await tela.preencher('SENHA', senha);
  await tela.clicarBotao('Acessar');
}

export async function sairDoPainel(tela: Tela): Promise<void> {
  await tela.clicarBotao('Sair');
  await tela.esperarCaminho('/');
}

export async function sairDoAppDoEntregador(tela: Tela): Promise<void> {
  await tela.clicarBotao('Sair');
  await tela.esperarCaminho('/login/entregador');
}

export async function irPeloMenu(tela: Tela, item: string): Promise<void> {
  await tela.clicarLink(item);
}

const AVISO_DO_LIMITE_DE_LOGIN = 'Não foi possível entrar agora';
const ESPERA_DO_LIMITE_DE_LOGIN_MS = 20_000;
const TENTATIVAS_DE_LOGIN = 4;

async function entrarRespeitandoOLimite(tela: Tela, entrar: () => Promise<void>, destinos: string[]): Promise<void> {
  for (let tentativa = 1; tentativa <= TENTATIVAS_DE_LOGIN; tentativa++) {
    await entrar();
    if ((await tela.esperarCaminhoOuTexto(destinos, AVISO_DO_LIMITE_DE_LOGIN)) === 'caminho') return;
    await tela.aguardar(ESPERA_DO_LIMITE_DE_LOGIN_MS);
  }
  throw new Error('O limite de logins por minuto do backend não liberou a entrada');
}

export async function entrarNoPainel(tela: Tela, email: string, senha: string): Promise<void> {
  await entrarRespeitandoOLimite(tela, () => entrarComoEmpresa(tela, email, senha), ['/painel']);
}

export async function entrarNoAppDoEntregador(tela: Tela, cpf: string, senha: string): Promise<void> {
  await entrarRespeitandoOLimite(tela, () => entrarComoEntregador(tela, cpf, senha), [
    '/entregador',
    '/login/entregador/trocar-senha',
  ]);
}
