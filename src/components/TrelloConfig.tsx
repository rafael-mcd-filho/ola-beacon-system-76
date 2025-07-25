import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ExternalLink } from "lucide-react";

interface TrelloConfigProps {
  onConfigChange: (isConfigured: boolean) => void;
}

const TrelloConfig = ({ onConfigChange }: TrelloConfigProps) => {
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');
  const [listId, setListId] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedApiKey = localStorage.getItem('trello_api_key') || '';
    const savedToken = localStorage.getItem('trello_token') || '';
    const savedListId = localStorage.getItem('trello_list_id') || '';
    setApiKey(savedApiKey);
    setToken(savedToken);
    setListId(savedListId);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim() || !token.trim() || !listId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('trello_api_key', apiKey.trim());
    localStorage.setItem('trello_token', token.trim());
    localStorage.setItem('trello_list_id', listId.trim());
    
    onConfigChange(true);
    
    toast({
      title: "Configuração salva",
      description: "Suas chaves da API foram salvas com sucesso",
    });
  };

  const handleClear = () => {
    localStorage.removeItem('trello_api_key');
    localStorage.removeItem('trello_token');
    localStorage.removeItem('trello_list_id');
    setApiKey('');
    setToken('');
    setListId('');
    onConfigChange(false);
    
    toast({
      title: "Configuração removida",
      description: "Suas chaves da API foram removidas",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Como obter suas chaves do Trello</CardTitle>
          <CardDescription className="text-blue-600">
            Siga os passos abaixo para configurar a integração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-800">1. API Key</h4>
            <p className="text-sm text-blue-600">
              Acesse o link abaixo para obter sua API Key do Trello
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://trello.com/app-key', '_blank')}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Obter API Key
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-800">2. Token</h4>
            <p className="text-sm text-blue-600">
              Na mesma página, clique em "Token" para gerar seu token de acesso
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-blue-800">3. ID da Lista</h4>
            <p className="text-sm text-blue-600">
              Encontre o ID da lista na URL do seu quadro Trello ou use a API para listar as listas disponíveis
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua API Key aqui"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">Token</Label>
          <div className="relative">
            <Input
              id="token"
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole seu Token aqui"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="listId">ID da Lista</Label>
          <Input
            id="listId"
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            placeholder="Ex: 5abbe4b7ddc1b351ef961414"
          />
          <p className="text-sm text-muted-foreground">
            O ID da lista onde os cards das demandas serão criados
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Salvar Configuração
          </Button>
          <Button onClick={handleClear} variant="outline">
            Limpar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrelloConfig;