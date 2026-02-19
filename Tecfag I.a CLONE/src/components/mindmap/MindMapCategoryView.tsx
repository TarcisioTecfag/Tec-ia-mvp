
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Brain, FolderOpen, Server, CheckCircle, Star, Users, ArrowLeft, Loader2, Plus,
    MoreHorizontal, Trash2, Pencil, Share2, ShieldCheck, Sparkles, FileText, X
} from "lucide-react";
import { mindmapsApi, MindMap, documentsApi, Document, accessGroupsApi, AvailableUser } from "@/lib/api";
import { getAllMindMapMeta, setMindMapMeta, removeMindMapMeta, MindMapMeta } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const pageConfig: Record<string, { icon: React.ElementType; title: string; description: string }> = {
    "meus-mapas": {
        icon: FolderOpen,
        title: "Meus Mapas Mentais",
        description: "Acesse e gerencie seus mapas mentais criados",
    },
    "mapas-sistema": {
        icon: Server,
        title: "Mapas Mentais do Sistema",
        description: "Explore mapas gerados automaticamente pela IA",
    },
    "mapas-aprovados": {
        icon: CheckCircle,
        title: "Mapas Mentais Aprovados",
        description: "Visualize mapas revisados e aprovados",
    },
    "modelos-prontos": {
        icon: Star,
        title: "Modelos Prontos",
        description: "Gere mapas mentais com IA a partir de documentos",
    },
    "compartilhados": {
        icon: Users,
        title: "Compartilhados Comigo",
        description: "Mapas compartilhados por outros usuários",
    },
};

interface MindMapCategoryViewProps {
    slug: string;
    onBack: () => void;
    onSelectMap: (mapId: string) => void;
    isAdmin: boolean;
}

const MindMapCategoryView = ({ slug, onBack, onSelectMap, isAdmin }: MindMapCategoryViewProps) => {
    const config = pageConfig[slug];
    const { toast } = useToast();
    const { user } = useAuth();
    const [maps, setMaps] = useState<MindMap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialogs state
    const [renameDialog, setRenameDialog] = useState<{ open: boolean; mapId: string; currentName: string }>({ open: false, mapId: '', currentName: '' });
    const [renameInput, setRenameInput] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; mapId: string; mapName: string }>({ open: false, mapId: '', mapName: '' });
    const [shareDialog, setShareDialog] = useState<{ open: boolean; mapId: string }>({ open: false, mapId: '' });
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // AI Generation state (for modelos-prontos)
    const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState('');
    const [genTopic, setGenTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (slug === 'modelos-prontos') {
            setIsLoading(false);
            // Load docs for AI generation
            documentsApi.getAll().then(docs => setAvailableDocs(docs)).catch(console.error);
            return;
        }

        const fetchMaps = async () => {
            setIsLoading(true);
            try {
                const allMaps = await mindmapsApi.getAll();
                const allMeta = getAllMindMapMeta();
                const currentUserId = user?.id || '';

                let filtered: MindMap[] = [];

                switch (slug) {
                    case 'meus-mapas':
                        // Maps owned by current user OR maps without metadata (legacy)
                        filtered = allMaps.filter(m => {
                            const meta = allMeta[m.id];
                            if (!meta) return true; // Legacy maps belong to "meus-mapas"
                            return meta.ownerId === currentUserId && meta.category === 'meus-mapas';
                        });
                        break;
                    case 'mapas-sistema':
                        filtered = allMaps.filter(m => allMeta[m.id]?.category === 'mapas-sistema');
                        break;
                    case 'mapas-aprovados':
                        filtered = allMaps.filter(m => allMeta[m.id]?.isApproved === true);
                        break;
                    case 'compartilhados':
                        filtered = allMaps.filter(m => {
                            const meta = allMeta[m.id];
                            return meta?.sharedWith?.includes(currentUserId);
                        });
                        break;
                    default:
                        filtered = [];
                }

                setMaps(filtered.reverse());
            } catch (err) {
                console.error("Failed to load mind maps", err);
                setError("Não foi possível carregar os mapas mentais.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaps();
    }, [slug, user?.id]);

    // --- Actions ---

    const handleRename = async () => {
        if (!renameInput.trim()) return;
        try {
            await mindmapsApi.update(renameDialog.mapId, { name: renameInput.trim() });
            setMaps(prev => prev.map(m => m.id === renameDialog.mapId ? { ...m, name: renameInput.trim() } : m));
            toast({ title: "Renomeado", description: `Mapa renomeado para "${renameInput.trim()}"`, className: "bg-green-500 text-white" });
            setRenameDialog({ open: false, mapId: '', currentName: '' });
        } catch (err) {
            toast({ title: "Erro", description: "Não foi possível renomear.", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        try {
            await mindmapsApi.delete(deleteDialog.mapId);
            removeMindMapMeta(deleteDialog.mapId);
            setMaps(prev => prev.filter(m => m.id !== deleteDialog.mapId));
            toast({ title: "Excluído", description: "Mapa mental removido.", variant: "destructive" });
            setDeleteDialog({ open: false, mapId: '', mapName: '' });
        } catch (err) {
            toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
        }
    };

    const openShareDialog = async (mapId: string) => {
        setShareDialog({ open: true, mapId });
        setIsLoadingUsers(true);
        try {
            const res = await accessGroupsApi.getAvailableUsers();
            // Filter out current user
            setAvailableUsers(res.users.filter(u => u.id !== user?.id));
        } catch {
            toast({ title: "Erro", description: "Não foi possível carregar usuários.", variant: "destructive" });
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleShare = () => {
        if (!selectedUserId) return;
        const meta = getAllMindMapMeta()[shareDialog.mapId] || { category: 'meus-mapas' as const, isApproved: false, sharedWith: [], ownerId: user?.id || '', ownerName: user?.name || '' };
        const newSharedWith = [...new Set([...meta.sharedWith, selectedUserId])];
        setMindMapMeta(shareDialog.mapId, { ...meta, sharedWith: newSharedWith });

        const sharedUser = availableUsers.find(u => u.id === selectedUserId);
        toast({ title: "Compartilhado!", description: `Mapa compartilhado com ${sharedUser?.name || 'usuário'}.`, className: "bg-green-500 text-white" });
        setShareDialog({ open: false, mapId: '' });
        setSelectedUserId('');
    };

    const handleApprove = (mapId: string) => {
        setMindMapMeta(mapId, { isApproved: true });
        toast({ title: "Aprovado! ✅", description: "Mapa adicionado aos 'Mapas Mentais Aprovados'.", className: "bg-green-500 text-white" });
        // Update local state to reflect approval icon change
        setMaps(prev => [...prev]);
    };

    // --- AI Generation (modelos-prontos) ---
    const handleGenerate = async () => {
        if (!selectedDocId || !genTopic) return;
        setIsGenerating(true);
        try {
            const result = await mindmapsApi.generate(selectedDocId, genTopic);
            // Tag as system map
            setMindMapMeta(result.id, {
                category: 'mapas-sistema',
                isApproved: false,
                sharedWith: [],
                ownerId: user?.id || '',
                ownerName: user?.name || ''
            });
            toast({
                title: "Mapa Gerado com Sucesso! 🧠",
                description: "Redirecionando para o editor...",
                className: "bg-green-500 text-white"
            });
            setTimeout(() => onSelectMap(result.id), 500);
        } catch (err) {
            console.error(err);
            toast({ title: "Erro na Geração", description: "Não foi possível gerar o mapa. Tente novamente.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    if (!config) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <p className="text-muted-foreground">Categoria não encontrada</p>
                <Button variant="ghost" onClick={onBack} className="ml-4">Voltar</Button>
            </div>
        );
    }

    const Icon = config.icon;
    const allMeta = getAllMindMapMeta();

    return (
        <div className="h-full bg-background px-4 py-8 overflow-auto">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <motion.div
                    className="mb-10"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <button
                        onClick={onBack}
                        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao Menu Principal
                    </button>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
                                <Icon className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
                                <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                            </div>
                        </div>

                        {slug === 'meus-mapas' && (
                            <Button onClick={() => onSelectMap('new')} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Novo Mapa
                            </Button>
                        )}
                    </div>
                </motion.div>

                {/* === MODELOS PRONTOS (AI Generation Form) === */}
                {slug === 'modelos-prontos' ? (
                    <motion.div
                        className="rounded-2xl border border-border bg-card p-8 max-w-2xl mx-auto"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Gerar Mapa Mental com IA</h2>
                                <p className="text-sm text-muted-foreground">Selecione um documento e descreva o que deseja no mapa.</p>
                            </div>
                        </div>

                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label>Selecione o Manual (PDF)</Label>
                                <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha um documento..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableDocs.length === 0 ? (
                                            <SelectItem value="none" disabled>Nenhum documento indexado</SelectItem>
                                        ) : (
                                            availableDocs.map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-3 h-3 text-muted-foreground" />
                                                        <span className="truncate max-w-[200px]">{doc.fileName}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Tópico ou Descrição</Label>
                                <Input
                                    placeholder="Ex: Faça um mapa mental de seladoras listando seus parâmetros técnicos..."
                                    value={genTopic}
                                    onChange={(e) => setGenTopic(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Dica: Seja específico para obter um mapa mais detalhado.
                                </p>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={!selectedDocId || !genTopic || isGenerating}
                                className="bg-purple-600 hover:bg-purple-700 text-white gap-2 w-full"
                                size="lg"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Lendo e Criando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Gerar Mapa Mental
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    /* === MAP GRID (for all other categories) === */
                    <>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Carregando mapas...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <p className="text-destructive mb-4">{error}</p>
                                <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
                            </div>
                        ) : maps.length === 0 ? (
                            <motion.div
                                className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                            >
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 mb-6">
                                    <Brain className="h-10 w-10 text-primary/40" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground mb-2">Nenhum mapa mental encontrado</h2>
                                <p className="text-sm text-muted-foreground max-w-md text-center mb-6">
                                    Esta seção está pronta para receber seus mapas mentais.
                                </p>
                                {slug === 'meus-mapas' && (
                                    <Button onClick={() => onSelectMap('new')}>Criar Primeiro Mapa</Button>
                                )}
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {maps.map((map) => {
                                    const meta = allMeta[map.id];
                                    return (
                                        <motion.div
                                            key={map.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.02 }}
                                            className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors shadow-sm relative group"
                                            onClick={() => onSelectMap(map.id)}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Brain className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {/* Approval badge */}
                                                    {meta?.isApproved && (
                                                        <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center" title="Aprovado">
                                                            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                                                        </div>
                                                    )}

                                                    {/* Admin approve button (only if not yet approved) */}
                                                    {isAdmin && !meta?.isApproved && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                                            onClick={(e) => { e.stopPropagation(); handleApprove(map.id); }}
                                                            title="Aprovar mapa"
                                                        >
                                                            <ShieldCheck className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* 3-dot menu */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenuItem onClick={() => {
                                                                setRenameInput(map.name);
                                                                setRenameDialog({ open: true, mapId: map.id, currentName: map.name });
                                                            }}>
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Renomear
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openShareDialog(map.id)}>
                                                                <Share2 className="h-4 w-4 mr-2" />
                                                                Compartilhar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => setDeleteDialog({ open: true, mapId: map.id, mapName: map.name })}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            <h3 className="font-semibold text-foreground truncate">{map.name}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {map.updatedAt ? new Date(map.updatedAt).toLocaleDateString() : 'Data desconhecida'} • {map.nodes.length} nós
                                            </p>
                                            {meta?.ownerName && slug !== 'meus-mapas' && (
                                                <p className="text-[10px] text-muted-foreground/60 mt-1">por {meta.ownerName}</p>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* === DIALOGS === */}

            {/* Rename Dialog */}
            <Dialog open={renameDialog.open} onOpenChange={(open) => !open && setRenameDialog({ open: false, mapId: '', currentName: '' })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Renomear Mapa Mental</DialogTitle>
                        <DialogDescription>Digite o novo nome para o mapa.</DialogDescription>
                    </DialogHeader>
                    <Input
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        placeholder="Novo nome..."
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialog({ open: false, mapId: '', currentName: '' })}>Cancelar</Button>
                        <Button onClick={handleRename} disabled={!renameInput.trim()}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, mapId: '', mapName: '' })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Excluir Mapa Mental</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir "{deleteDialog.mapName}"? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, mapId: '', mapName: '' })}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={shareDialog.open} onOpenChange={(open) => { if (!open) { setShareDialog({ open: false, mapId: '' }); setSelectedUserId(''); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-primary" />
                            Compartilhar Mapa Mental
                        </DialogTitle>
                        <DialogDescription>Selecione um usuário para compartilhar este mapa.</DialogDescription>
                    </DialogHeader>
                    {isLoadingUsers ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um usuário..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers.length === 0 ? (
                                    <SelectItem value="none" disabled>Nenhum usuário disponível</SelectItem>
                                ) : (
                                    availableUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-3 h-3 text-muted-foreground" />
                                                <span>{u.name}</span>
                                                <span className="text-muted-foreground text-xs">({u.email})</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShareDialog({ open: false, mapId: '' }); setSelectedUserId(''); }}>Cancelar</Button>
                        <Button onClick={handleShare} disabled={!selectedUserId} className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Compartilhar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MindMapCategoryView;
