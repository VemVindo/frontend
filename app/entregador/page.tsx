import Card from '@/app/components/ui/Card';

export default function PaginaEntregador() {
  return (
    <Card titulo="Entregas realizadas" descricao="Histórico de hoje">
      <p className="text-xs text-texto-apoio">Nenhuma entrega por enquanto.</p>
    </Card>
  );
}
