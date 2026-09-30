import Avatar from '@/app/components/ui/Avatar';
import Botao from '@/app/components/ui/Botao';
import CampoTexto from '@/app/components/ui/CampoTexto';
import Card from '@/app/components/ui/Card';
import Etiqueta from '@/app/components/ui/Etiqueta';
import Logo from '@/app/components/ui/Logo';
import TituloPagina from '@/app/components/ui/TituloPagina';

const cores = [
  'fundo', 'superficie', 'superficie-suave', 'borda',
  'primaria', 'primaria-escura', 'primaria-media', 'primaria-clara', 'lilas', 'destaque',
  'texto', 'texto-corpo', 'texto-apoio', 'texto-suave',
  'sucesso', 'sucesso-texto', 'sucesso-fundo', 'alerta', 'erro',
];

export default function PaginaComponentes() {
  return (
    <main className="mx-auto w-full max-w-[1000px] px-4 py-10 flex flex-col gap-6">
      <TituloPagina
        titulo="Componentes base"
        subtitulo="Vitrine do design system do VemVindo"
        acao={<Botao>Ação principal</Botao>}
      />

      <Card titulo="Cores">
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cores.map((cor) => (
            <li key={cor} className="flex items-center gap-2 text-xs">
              <span
                className="size-8 rounded-lg border border-borda"
                style={{ background: `var(--color-${cor})` }}
              />
              {cor}
            </li>
          ))}
        </ul>
      </Card>

      <Card titulo="Tipografia">
        <p className="font-titulo font-bold text-[26px]">Sora · títulos</p>
        <p className="text-[13px]">Inter · textos corridos, rótulos e campos</p>
      </Card>

      <Card titulo="Botões">
        <div className="flex flex-wrap gap-3">
          <Botao>Primário</Botao>
          <Botao variante="secundario">Secundário</Botao>
          <Botao variante="claro">Claro</Botao>
          <Botao disabled>Desabilitado</Botao>
        </div>
      </Card>

      <Card titulo="Campos" descricao="Com descrição e com erro">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto rotulo="Valor base por entrega" descricao="Valor fixo pago a cada entrega concluída" placeholder="R$ 8,00" />
          <CampoTexto rotulo="Adicional por quilômetro" erro="Informe um valor positivo" defaultValue="-1" />
        </div>
      </Card>

      <Card titulo="Avatares, etiquetas e logo">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar iniciais="MV" variante="escuro" />
          <Avatar iniciais="MV" variante="claro" />
          <Avatar iniciais="CM" variante="marca" tamanho={38} />
          <Etiqueta tom="sucesso">✓ Concluída</Etiqueta>
          <Etiqueta tom="alerta">Pendente</Etiqueta>
          <Etiqueta tom="erro">Cancelada</Etiqueta>
          <Etiqueta>Em rota</Etiqueta>
          <Logo />
        </div>
      </Card>
    </main>
  );
}
