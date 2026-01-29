import { useState, useEffect } from "react";
import {
    Users,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    ArrowLeft,
    Shield,
    MessageSquare,
    Network,
    Package,
    Activity,
    FileStack,
    Settings,
    UserPlus,
    Check,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { accessGroupsApi, AccessGroup, AccessGroupDetail, AvailableUser } from "@/lib/api";

interface AccessGroupFormData {
    name: string;
    description: string;
    canViewChat: boolean;
    canViewMindMap: boolean;
    canViewCatalog: boolean;
    canViewUsers: boolean;
    canViewMonitoring: boolean;
    canViewDocuments: boolean;
    canViewSettings: boolean;
    canViewNotifications: boolean;
}

const defaultFormData: AccessGroupFormData = {
    name: "",
    description: "",
    canViewChat: true,
    canViewMindMap: true,
    canViewCatalog: true,
    canViewUsers: false,
    canViewMonitoring: false,
    canViewDocuments: false,
    canViewSettings: false,
    canViewNotifications: false,
};

const modulePermissions = [
    { key: "canViewChat", label: "Chat I.A", icon: MessageSquare, description: "Acesso ao chat com inteligência artificial" },
    { key: "canViewMindMap", label: "Mapa Mental", icon: Network, description: "Visualização de mapas mentais" },
    { key: "canViewCatalog", label: "Catálogo", icon: Package, description: "Acesso ao catálogo de produtos" },
    { key: "canViewUsers", label: "Usuários", icon: Users, description: "Gerenciamento de usuários (admin)" },
    { key: "canViewMonitoring", label: "Monitoramento", icon: Activity, description: "Monitoramento do sistema (admin)" },
    { key: "canViewDocuments", label: "Documentos I.A", icon: FileStack, description: "Gerenciamento de documentos (admin)" },
    { key: "canViewSettings", label: "Configurações", icon: Settings, description: "Configurações do sistema (admin)" },
    { key: "canViewNotifications", label: "Notificações", icon: Bell, description: "Visualizar notificações e alertas" },
];

interface AccessGroupsPanelProps {
    onBack: () => void;
}

const AccessGroupsPanel = ({ onBack }: AccessGroupsPanelProps) => {
    const [groups, setGroups] = useState<AccessGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<AccessGroup | null>(null);
    const [formData, setFormData] = useState<AccessGroupFormData>(defaultFormData);
    const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

    // User management state
    const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<AccessGroupDetail | null>(null);
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setIsLoading(true);
            const data = await accessGroupsApi.getAll();
            setGroups(data.groups);
        } catch (error) {
            console.error("Error fetching access groups:", error);
            toast({
                title: "Erro",
                description: "Erro ao carregar grupos de acesso",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!formData.name.trim()) {
            toast({
                title: "Erro",
                description: "O nome do grupo é obrigatório",
                variant: "destructive",
            });
            return;
        }

        try {
            const data = await accessGroupsApi.create({
                name: formData.name,
                description: formData.description || undefined,
                canViewChat: formData.canViewChat,
                canViewMindMap: formData.canViewMindMap,
                canViewCatalog: formData.canViewCatalog,
                canViewUsers: formData.canViewUsers,
                canViewMonitoring: formData.canViewMonitoring,
                canViewDocuments: formData.canViewDocuments,
                canViewSettings: formData.canViewSettings,
            });
            setGroups([data.group, ...groups]);
            setIsDialogOpen(false);
            resetForm();
            toast({
                title: "Sucesso",
                description: "Grupo de acesso criado com sucesso",
            });
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao criar grupo de acesso",
                variant: "destructive",
            });
        }
    };

    const handleUpdateGroup = async () => {
        if (!editingGroup || !formData.name.trim()) {
            toast({
                title: "Erro",
                description: "O nome do grupo é obrigatório",
                variant: "destructive",
            });
            return;
        }

        try {
            const data = await accessGroupsApi.update(editingGroup.id, {
                name: formData.name,
                description: formData.description || null,
                canViewChat: formData.canViewChat,
                canViewMindMap: formData.canViewMindMap,
                canViewCatalog: formData.canViewCatalog,
                canViewUsers: formData.canViewUsers,
                canViewMonitoring: formData.canViewMonitoring,
                canViewDocuments: formData.canViewDocuments,
                canViewSettings: formData.canViewSettings,
            });
            setGroups(groups.map((g) => (g.id === editingGroup.id ? data.group : g)));
            setIsDialogOpen(false);
            setEditingGroup(null);
            resetForm();
            toast({
                title: "Sucesso",
                description: "Grupo de acesso atualizado com sucesso",
            });
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao atualizar grupo de acesso",
                variant: "destructive",
            });
        }
    };

    const confirmDeleteGroup = async () => {
        if (!deleteGroupId) return;

        try {
            await accessGroupsApi.delete(deleteGroupId);
            setGroups(groups.filter((g) => g.id !== deleteGroupId));
            setDeleteGroupId(null);
            toast({
                title: "Sucesso",
                description: "Grupo de acesso excluído com sucesso",
            });
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao excluir grupo de acesso",
                variant: "destructive",
            });
        }
    };

    const openUsersDialog = async (group: AccessGroup) => {
        try {
            setIsLoadingUsers(true);
            setIsUsersDialogOpen(true);

            const [groupData, usersData] = await Promise.all([
                accessGroupsApi.getById(group.id),
                accessGroupsApi.getAvailableUsers(),
            ]);

            setSelectedGroup(groupData.group);
            setAvailableUsers(usersData.users);
            setSelectedUserIds(groupData.group.users.map(u => u.id));
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao carregar usuários",
                variant: "destructive",
            });
            setIsUsersDialogOpen(false);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleSaveUsers = async () => {
        if (!selectedGroup) return;

        try {
            const data = await accessGroupsApi.updateUsers(selectedGroup.id, selectedUserIds);
            setGroups(groups.map((g) =>
                g.id === selectedGroup.id
                    ? { ...g, userCount: data.group.users.length }
                    : g
            ));
            setIsUsersDialogOpen(false);
            setSelectedGroup(null);
            toast({
                title: "Sucesso",
                description: "Usuários atualizados com sucesso",
            });
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao atualizar usuários",
                variant: "destructive",
            });
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const openCreateDialog = () => {
        setEditingGroup(null);
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditDialog = (group: AccessGroup) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description || "",
            canViewChat: group.canViewChat,
            canViewMindMap: group.canViewMindMap,
            canViewCatalog: group.canViewCatalog,
            canViewUsers: group.canViewUsers,
            canViewMonitoring: group.canViewMonitoring,
            canViewDocuments: group.canViewDocuments,
            canViewSettings: group.canViewSettings,
            canViewNotifications: group.canViewNotifications,
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData(defaultFormData);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setEditingGroup(null);
        resetForm();
    };

    const getActivePermissionsCount = (group: AccessGroup) => {
        return [
            group.canViewChat,
            group.canViewMindMap,
            group.canViewCatalog,
            group.canViewUsers,
            group.canViewMonitoring,
            group.canViewDocuments,
            group.canViewSettings,
            group.canViewNotifications,
        ].filter(Boolean).length;
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with back button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="w-6 h-6 text-primary" />
                            Grupos de Acesso
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {groups.length} grupo{groups.length !== 1 ? "s" : ""} cadastrado{groups.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <Button onClick={openCreateDialog} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Grupo
                </Button>
            </div>

            {/* Groups List */}
            {groups.length === 0 ? (
                <div className="glass-card p-8 text-center">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium mb-2">Nenhum grupo de acesso</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        Clique em "Novo Grupo" para criar seu primeiro grupo de acesso
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group, index) => (
                        <div
                            key={group.id}
                            className="glass-card p-4 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                                        <h3 className="text-lg font-semibold truncate">{group.name}</h3>
                                    </div>
                                    {group.description && (
                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                            {group.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/30">
                                            {getActivePermissionsCount(group)} módulo{getActivePermissionsCount(group) !== 1 ? "s" : ""}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30">
                                            {group.userCount} usuário{group.userCount !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openUsersDialog(group)}
                                        title="Gerenciar usuários"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEditDialog(group)}
                                        title="Editar grupo"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteGroupId(group.id)}
                                        title="Excluir grupo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto scrollbar-thin">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGroup ? "Editar Grupo de Acesso" : "Novo Grupo de Acesso"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingGroup
                                ? "Atualize as informações e permissões do grupo"
                                : "Configure o nome e as permissões do novo grupo"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome do Grupo</label>
                            <Input
                                placeholder="Ex: Vendedor, Técnico, Gerente..."
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descrição (opcional)</label>
                            <Textarea
                                placeholder="Descreva a função deste grupo..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Permissões de Visualização</label>
                            <div className="space-y-2 border rounded-lg p-3">
                                {modulePermissions.map((module) => {
                                    const Icon = module.icon;
                                    const isChecked = formData[module.key as keyof AccessGroupFormData] as boolean;
                                    return (
                                        <label
                                            key={module.key}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                                isChecked ? "bg-primary/10" : "hover:bg-muted/50"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        [module.key]: e.target.checked,
                                                    })
                                                }
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Icon className={cn("w-4 h-4", isChecked ? "text-primary" : "text-muted-foreground")} />
                                            <div className="flex-1">
                                                <span className={cn("text-sm font-medium", isChecked && "text-primary")}>
                                                    {module.label}
                                                </span>
                                                <p className="text-xs text-muted-foreground">{module.description}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}>
                            <Save className="w-4 h-4 mr-2" />
                            {editingGroup ? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Users Management Dialog */}
            <Dialog open={isUsersDialogOpen} onOpenChange={() => setIsUsersDialogOpen(false)}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto scrollbar-thin">
                    <DialogHeader>
                        <DialogTitle>
                            Usuários do Grupo: {selectedGroup?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Selecione os usuários que farão parte deste grupo de acesso
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
                                {availableUsers.filter(u => u.role !== 'ADMIN').length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                        Nenhum usuário disponível
                                    </p>
                                ) : (
                                    availableUsers
                                        .filter(u => u.role !== 'ADMIN') // Admins don't need groups
                                        .map((user) => {
                                            const isSelected = selectedUserIds.includes(user.id);
                                            const belongsToOtherGroup = user.accessGroupId && user.accessGroupId !== selectedGroup?.id;

                                            return (
                                                <label
                                                    key={user.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                                                        isSelected
                                                            ? "bg-primary/10 border-primary/30"
                                                            : "hover:bg-muted/50 border-transparent"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                        isSelected
                                                            ? "bg-primary border-primary"
                                                            : "border-muted-foreground"
                                                    )}>
                                                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleUserSelection(user.id)}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="text-sm font-medium">{user.name}</span>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        {belongsToOtherGroup && (
                                                            <p className="text-xs text-amber-500">
                                                                Atualmente em: {user.accessGroup?.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUsersDialogOpen(false)}>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveUsers} disabled={isLoadingUsers}>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar ({selectedUserIds.length} selecionado{selectedUserIds.length !== 1 ? "s" : ""})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteGroupId} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Os usuários associados a este grupo perderão o vínculo e manterão apenas as permissões padrão.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AccessGroupsPanel;
