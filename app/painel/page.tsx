import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';

export default function PaginaDashboard() {
  return (
    <>
      <TituloPagina titulo="Dashboard" subtitulo="Visão geral das entregas do estabelecimento" />
      <Card titulo="Em construção" descricao="Os indicadores do dashboard entram em uma próxima sprint." />
    </>
  );
}
