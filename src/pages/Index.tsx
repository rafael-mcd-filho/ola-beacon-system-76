import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DemandForm from "@/components/DemandForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Sistema de Demandas PlugueMarketing</h1>
          <p className="text-xl text-muted-foreground">
            Gerencie e envie solicitações de clientes de forma eficiente
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova Solicitação de Demanda</CardTitle>
            <CardDescription>
              Preencha os dados da demanda para processar a solicitação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DemandForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
