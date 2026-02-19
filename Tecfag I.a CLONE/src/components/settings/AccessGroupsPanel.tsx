/**
 * AccessGroupsPanel - Painel de gerenciamento de grupos de acesso
 * 
 * REDESENHADO: Modal horizontal com abas para:
 * - Informações básicas do grupo
 * - Permissões completas (usando PermissionsGrid)
 * - Gerenciamento de usuários inline
 */

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
    UserPlus,
    Check,
    Info,
    Key,
    Search,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { accessGroupsApi, AccessGroup, AccessGroupDetail, AvailableUser } from "@/lib/api";
import { PermissionsGrid, PERMISSION_MODULES, ALL_PERMISSION_KEYS, GroupPermissions } from "./PermissionsGrid";

// Form data para criar/editar grupos
interface AccessGroupFormData {
    name: string;
    description: string;
    permissions: GroupPermissions;
}

// Valores padrão para as permissões
const getDefaultPermissions = (): GroupPermissions => {
    const permissions: GroupPermissions = {};

    // Permissões de visualização básica - habilitadas por padrão
    permissions.canViewChat = true;
    permissions.canViewMindMap = true;
    permissions.canViewCatalog = true;
    permissions.canViewNotifications = true;

    // Permissões básicas de ação - habilitadas
    permissions.canCreateMindMap = true;
    permissions.canEditMindMap = true;
    permissions.canArchiveChat = true;
    permissions.canDeleteChatHistory = true;
    permissions.canDeleteNotifications = true;

    // Permissões administrativas - desabilitadas por padrão
    permissions.canViewUsers = false;
    permissions.canViewMonitoring = false;
    permissions.canViewDocuments = false;
    permissions.canViewSettings = false;
    permissions.canDeleteMindMap = false;
    permissions.canCreateCatalog = false;
    permissions.canEditCatalog = false;
    permissions.canDeleteCatalog = false;
    permissions.canCreateUsers = false;
    permissions.canEditUsers = false;
    permissions.canDeleteUsers = false;
    permissions.canUploadDocuments = false;
    permissions.canEditDocuments = false;
    permissions.canDeleteDocuments = false;
    permissions.canManageAccessGroups = false;
    permissions.canManageBackups = false;
    permissions.canViewTokenCosts = false;

    return permissions;
};

const defaultFormData: AccessGroupFormData = {
    name: "",
    description: "",
    permissions: getDefaultPermissions(),
};

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
    const [activeTab, setActiveTab] = useState("info");

    // User management state
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");

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

    const fetchAvailableUsers = async () => {
        try {
            setIsLoadingUsers(true);
            const usersData = await accessGroupsApi.getAvailableUsers();
            setAvailableUsers(usersData.users);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoadingUsers(false);
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
                ...formData.permissions,
            });

            // Se houver usuários selecionados, atualiza
            if (selectedUserIds.length > 0) {
                await accessGroupsApi.updateUsers(data.group.id, selectedUserIds);
            }

            await fetchGroups();
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
            await accessGroupsApi.update(editingGroup.id, {
                name: formData.name,
                description: formData.description || null,
                ...formData.permissions,
            });

            // Atualiza usuários
            await accessGroupsApi.updateUsers(editingGroup.id, selectedUserIds);

            await fetchGroups();
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

    const openCreateDialog = async () => {
        setEditingGroup(null);
        resetForm();
        setActiveTab("info");
        setIsDialogOpen(true);
        await fetchAvailableUsers();
    };

    const openEditDialog = async (group: AccessGroup) => {
        setEditingGroup(group);

        // Carrega permissões do grupo
        const permissions: GroupPermissions = {};
        ALL_PERMISSION_KEYS.forEach(key => {
            permissions[key] = (group as any)[key] ?? false;
        });

        setFormData({
            name: group.name,
            description: group.description || "",
            permissions,
        });

        setActiveTab("info");
        setIsDialogOpen(true);

        // Carrega usuários e dados do grupo
        try {
            setIsLoadingUsers(true);
            const [groupData, usersData] = await Promise.all([
                accessGroupsApi.getById(group.id),
                accessGroupsApi.getAvailableUsers(),
            ]);
            setAvailableUsers(usersData.users);
            setSelectedUserIds(groupData.group.users.map(u => u.id));
        } catch (error) {
            console.error("Error loading group data:", error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const resetForm = () => {
        setFormData(defaultFormData);
        setSelectedUserIds([]);
        setUserSearchQuery("");
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setEditingGroup(null);
        resetForm();
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handlePermissionChange = (key: string, value: boolean | null) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: value as boolean,
            },
        }));
    };

    const getActivePermissionsCount = (group: AccessGroup) => {
        return ALL_PERMISSION_KEYS.filter(key => (group as any)[key] === true).length;
    };

    const filteredUsers = availableUsers.filter(u =>
    (u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
    );

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
                                            {getActivePermissionsCount(group)} permissões
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

            {/* Create/Edit Dialog - NOVO LAYOUT HORIZONTAL COM ABAS */}
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            {editingGroup ? "Editar Grupo de Acesso" : "Novo Grupo de Acesso"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingGroup
                                ? "Atualize as informações, permissões e usuários do grupo"
                                : "Configure as informações e permissões do novo grupo"}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="info" className="gap-2">
                                <Info className="w-4 h-4" />
                                Informações
                            </TabsTrigger>
                            <TabsTrigger value="permissions" className="gap-2">
                                <Key className="w-4 h-4" />
                                Permissões
                            </TabsTrigger>
                            <TabsTrigger value="users" className="gap-2">
                                <Users className="w-4 h-4" />
                                Usuários ({selectedUserIds.length})
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto scrollbar-thin mt-4">
                            {/* Tab: Informações Básicas */}
                            <TabsContent value="info" className="m-0 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome do Grupo *</label>
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
                                        rows={3}
                                    />
                                </div>

                                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 Dica</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Após preencher as informações básicas, vá para a aba <strong>Permissões</strong> para
                                        configurar o que os usuários deste grupo poderão fazer, e depois para <strong>Usuários</strong>
                                        para adicionar membros ao grupo.
                                    </p>
                                </div>
                            </TabsContent>

                            {/* Tab: Permissões */}
                            <TabsContent value="permissions" className="m-0">
                                <PermissionsGrid
                                    mode="group"
                                    permissions={formData.permissions}
                                    onChange={handlePermissionChange}
                                />
                            </TabsContent>

                            {/* Tab: Usuários */}
                            <TabsContent value="users" className="m-0 space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar usuários..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Users List */}
                                {isLoadingUsers ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {userSearchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                                        {filteredUsers.map((user) => {
                                            const isSelected = selectedUserIds.includes(user.id);
                                            const belongsToOtherGroup = user.accessGroupId && user.accessGroupId !== editingGroup?.id;

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
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
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
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium truncate block">{user.name}</span>
                                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                        {belongsToOtherGroup && (
                                                            <p className="text-xs text-amber-500">
                                                                Em: {user.accessGroup?.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Selected count */}
                                <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                                    {selectedUserIds.length} usuário{selectedUserIds.length !== 1 ? "s" : ""} selecionado{selectedUserIds.length !== 1 ? "s" : ""}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={handleDialogClose}>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}>
                            <Save className="w-4 h-4 mr-2" />
                            {editingGroup ? "Salvar" : "Criar Grupo"}
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
