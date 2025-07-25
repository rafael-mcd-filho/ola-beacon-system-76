import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Upload, X, CheckCircle } from "lucide-react";

const DemandForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [progressSteps, setProgressSteps] = useState({
    creatingCard: false,
    cardCreated: false,
    uploadingFiles: false,
    filesUploaded: false,
    completed: false
  });
  const [currentStep, setCurrentStep] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [fileProgress, setFileProgress] = useState({ current: 0, total: 0 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    priority: '',
    deadline: '',
    category: '',
    listId: ''
  });
  
  const { toast } = useToast();

  const MAX_FILES = 4;
  const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB em bytes

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar quantidade de arquivos
    if (selectedFiles.length + files.length > MAX_FILES) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${MAX_FILES} arquivos permitidos`,
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho dos arquivos
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada arquivo deve ter no máximo 40MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (cardId: string) => {
    const apiKey = 'ab13cc490e581b3393b5cf5d06451fc6';
    const token = 'ATTAba84ff7d44118de19a49da94730848a6af371269f1995c04b16686e64bcb283bC359B657';

    setProgressSteps(prev => ({ ...prev, uploadingFiles: true }));
    setCurrentStep('Anexando arquivos...');
    setFileProgress({ current: 0, total: selectedFiles.length });

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentStep(`Enviando arquivo ${i + 1} de ${selectedFiles.length}: ${file.name}`);
      setFileProgress({ current: i, total: selectedFiles.length });
      
      // Atualizar progresso geral
      const progressBase = 50; // 50% já foi concluído (criação do card)
      const fileProgressPercent = ((i / selectedFiles.length) * 50); // 50% restante para arquivos
      setOverallProgress(progressBase + fileProgressPercent);

      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('token', token);
      formData.append('file', file);
      formData.append('name', file.name);

      try {
        const response = await fetch(
          `https://api.trello.com/1/cards/${cardId}/attachments`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao anexar arquivo ${file.name}`);
        }
      } catch (error) {
        console.error('Erro ao anexar arquivo:', error);
        toast({
          title: "Erro no anexo",
          description: `Falha ao anexar ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    setProgressSteps(prev => ({ ...prev, uploadingFiles: false, filesUploaded: true }));
    setFileProgress({ current: selectedFiles.length, total: selectedFiles.length });
    setOverallProgress(100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectTitle || !formData.description || !formData.listId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOverallProgress(0);
    setCurrentStep('Criando solicitação...');
    setProgressSteps({
      creatingCard: true,
      cardCreated: false,
      uploadingFiles: false,
      filesUploaded: false,
      completed: false
    });

    try {
      const apiKey = 'ab13cc490e581b3393b5cf5d06451fc6';
      const token = 'ATTAba84ff7d44118de19a49da94730848a6af371269f1995c04b16686e64bcb283bC359B657';

      setOverallProgress(20);

      // Converter data para ISO-8601 se informada
      let dueDate = null;
      if (formData.deadline) {
        const dateObj = new Date(formData.deadline);
        dueDate = dateObj.toISOString();
      }

      // Mapear prioridade para idLabels
      const priorityLabels: Record<string, string> = {
        'baixa': '6793c847690212048aee64c2',
        'normal': '6793c847690212048aee64c6',
        'urgente': '6793c847690212048aee64cc',
        'alta': '6793c847690212048aee64ca'
      };

      const selectedLabelId = formData.priority ? priorityLabels[formData.priority] : null;

      const cardData = {
        name: `${formData.projectTitle}${formData.category ? ` [${formData.category}]` : ''}`,
        desc: formData.description,
        pos: 'bottom',
        idList: formData.listId,
        ...(selectedLabelId && { idLabels: [selectedLabelId] }),
        ...(dueDate && { due: dueDate })
      };

      setOverallProgress(40);
      
      const response = await fetch(
        `https://api.trello.com/1/cards?key=${apiKey}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cardData),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao criar card no Trello');
      }

      const result = await response.json();
      const cardId = result.id;

      setProgressSteps(prev => ({ ...prev, creatingCard: false, cardCreated: true }));
      setCurrentStep('Solicitação criada com sucesso!');
      
      // Se não há arquivos, já pode finalizar
      if (selectedFiles.length === 0) {
        setOverallProgress(100);
        setProgressSteps(prev => ({ ...prev, completed: true }));
        setCurrentStep('Concluído!');
      } else {
        setOverallProgress(50);
        // Anexar arquivos se houver
        await uploadAttachments(cardId);
        setProgressSteps(prev => ({ ...prev, completed: true }));
        setCurrentStep('Concluído!');
      }

      // Exibir modal de sucesso
      setShowSuccessModal(true);

      // Aguardar um pouco antes de limpar o progresso
      setTimeout(() => {
        // Limpar formulário
        setFormData({
          projectTitle: '',
          description: '',
          priority: '',
          deadline: '',
          category: '',
          listId: ''
        });
        setSelectedFiles([]);
        setProgressSteps({
          creatingCard: false,
          cardCreated: false,
          uploadingFiles: false,
          filesUploaded: false,
          completed: false
        });
        setCurrentStep('');
        setOverallProgress(0);
        setFileProgress({ current: 0, total: 0 });
      }, 2000);

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar solicitação",
        variant: "destructive",
      });
      
      // Reset do progresso em caso de erro
      setProgressSteps({
        creatingCard: false,
        cardCreated: false,
        uploadingFiles: false,
        filesUploaded: false,
        completed: false
      });
      setCurrentStep('');
      setOverallProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="projectTitle">Título da Solicitação *</Label>
        <Input
          id="projectTitle"
          value={formData.projectTitle}
          onChange={(e) => handleInputChange('projectTitle', e.target.value)}
          placeholder="Título da solicitação"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição da Demanda *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Descreva detalhadamente a demanda do cliente..."
          rows={5}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Design">Design</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">Prazo</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => handleInputChange('deadline', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="listId">ID do Cliente *</Label>
        <Input
          id="listId"
          value={formData.listId}
          onChange={(e) => handleInputChange('listId', e.target.value)}
          placeholder="Ex: 5abbe4b7ddc1b351ef961414"
          required
        />
        <p className="text-sm text-muted-foreground">
          O ID único do cliente para processar a demanda
        </p>
      </div>

      {/* Seção de Upload de Arquivos */}
      <div className="space-y-4">
        <Label>Anexar Arquivos (Opcional)</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <Label htmlFor="fileInput" className="cursor-pointer">
              <span className="text-primary font-medium hover:underline">
                Clique para selecionar arquivos
              </span>
            </Label>
            <Input
              id="fileInput"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="*/*"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Máximo {MAX_FILES} arquivos, 40MB cada
            </p>
          </div>
        </div>

        {/* Lista de arquivos selecionados */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Arquivos Selecionados ({selectedFiles.length}/{MAX_FILES})</Label>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Barra de Progresso */}
      {isLoading && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{currentStep}</span>
              <span className="text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>
          
          {/* Progresso detalhado dos arquivos */}
          {progressSteps.uploadingFiles && fileProgress.total > 0 && (
            <div className="text-sm text-muted-foreground">
              Enviando arquivo {fileProgress.current + 1} de {fileProgress.total}
            </div>
          )}
          
          {/* Indicadores de status */}
          <div className="flex items-center space-x-4 text-sm">
            <div className={`flex items-center space-x-2 ${progressSteps.cardCreated ? 'text-green-600' : progressSteps.creatingCard ? 'text-blue-600' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${progressSteps.cardCreated ? 'bg-green-600' : progressSteps.creatingCard ? 'bg-blue-600 animate-pulse' : 'bg-muted-foreground'}`} />
              <span>Criação da solicitação</span>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className={`flex items-center space-x-2 ${progressSteps.filesUploaded ? 'text-green-600' : progressSteps.uploadingFiles ? 'text-blue-600' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${progressSteps.filesUploaded ? 'bg-green-600' : progressSteps.uploadingFiles ? 'bg-blue-600 animate-pulse' : 'bg-muted-foreground'}`} />
                <span>Upload de arquivos</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando Solicitação...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Enviar Solicitação
          </>
        )}
      </Button>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl animate-fade-in">
          <div className="relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
            
            {/* Content */}
            <div className="relative flex flex-col items-center text-center space-y-6 p-8">
              {/* Icon with animated background */}
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <DialogTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
                  Solicitação Enviada com Sucesso!
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
                  Sua demanda foi registrada em nosso sistema e será processada pela nossa equipe.
                </DialogDescription>
                <div className="inline-flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">Em breve você terá um retorno</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowSuccessModal(false)}
                className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default DemandForm;