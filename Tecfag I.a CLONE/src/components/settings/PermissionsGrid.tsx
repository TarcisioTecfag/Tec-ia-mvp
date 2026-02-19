/**
 * PermissionsGrid - Componente reutilizável para grid de permissões
 * 
 * Usado tanto para grupos de acesso quanto para override de usuários.
 * - Para grupos: checkboxes simples (true/false)
 * - Para usuários: dropdown Padrão/Permitir/Bloquear (null/true/false)
 */

import { cn } from "@/lib/utils";
import {
    MessageSquare,
    Network,
    Package,
    Users,
    Activity,
    FileStack,
    Settings,
    Bell,
    Plus,
    Edit2,
    Trash2,
    Archive,
    Database,
    Shield,
    Eye,
    DollarSign,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Definição completa de todas as permissões do sistema
export const PERMISSION_MODULES = [
    {
        id: "chat",
        label: "Chat I.A",
        icon: MessageSquare,
        permissions: [
            { key: "canViewChat", label: "Visualizar", type: "view" },
            { key: "canArchiveChat", label: "Arquivar", type: "action" },
            { key: "canDeleteChatHistory", label: "Limpar Histórico", type: "action" },
        ],
    },
    {
        id: "mindmap",
        label: "Mapa Mental",
        icon: Network,
        permissions: [
            { key: "canViewMindMap", label: "Visualizar", type: "view" },
            { key: "canCreateMindMap", label: "Criar", type: "action" },
            { key: "canEditMindMap", label: "Editar", type: "action" },
            { key: "canDeleteMindMap", label: "Excluir", type: "action" },
        ],
    },
    {
        id: "catalog",
        label: "Catálogo",
        icon: Package,
        permissions: [
            { key: "canViewCatalog", label: "Visualizar", type: "view" },
            { key: "canCreateCatalog", label: "Criar", type: "action" },
            { key: "canEditCatalog", label: "Editar", type: "action" },
            { key: "canDeleteCatalog", label: "Excluir", type: "action" },
        ],
    },
    {
        id: "users",
        label: "Usuários",
        icon: Users,
        permissions: [
            { key: "canViewUsers", label: "Visualizar", type: "view" },
            { key: "canCreateUsers", label: "Criar", type: "action" },
            { key: "canEditUsers", label: "Editar", type: "action" },
            { key: "canDeleteUsers", label: "Excluir", type: "action" },
        ],
    },
    {
        id: "monitoring",
        label: "Monitoramento",
        icon: Activity,
        permissions: [
            { key: "canViewMonitoring", label: "Visualizar", type: "view" },
            { key: "canViewTokenCosts", label: "Ver Custos", type: "view" },
        ],
    },
    {
        id: "documents",
        label: "Documentos I.A",
        icon: FileStack,
        permissions: [
            { key: "canViewDocuments", label: "Visualizar", type: "view" },
            { key: "canUploadDocuments", label: "Upload", type: "action" },
            { key: "canEditDocuments", label: "Editar", type: "action" },
            { key: "canDeleteDocuments", label: "Excluir", type: "action" },
        ],
    },
    {
        id: "settings",
        label: "Configurações",
        icon: Settings,
        permissions: [
            { key: "canViewSettings", label: "Visualizar", type: "view" },
            { key: "canManageAccessGroups", label: "Grupos de Acesso", type: "admin" },
            { key: "canManageBackups", label: "Backups", type: "admin" },
        ],
    },
    {
        id: "notifications",
        label: "Notificações",
        icon: Bell,
        permissions: [
            { key: "canViewNotifications", label: "Visualizar", type: "view" },
            { key: "canDeleteNotifications", label: "Excluir", type: "action" },
        ],
    },
];

// Lista de todas as chaves de permissão
export const ALL_PERMISSION_KEYS = PERMISSION_MODULES.flatMap(m =>
    m.permissions.map(p => p.key)
);

// Tipo para valores de permissão em grupos (boolean)
export type GroupPermissions = {
    [key: string]: boolean;
};

// Tipo para valores de permissão em usuários (boolean | null)
export type UserPermissions = {
    [key: string]: boolean | null;
};

interface PermissionsGridProps {
    mode: "group" | "user";
    permissions: GroupPermissions | UserPermissions;
    onChange: (key: string, value: boolean | null) => void;
    className?: string;
}

export const PermissionsGrid = ({ mode, permissions, onChange, className }: PermissionsGridProps) => {
    const renderGroupCheckbox = (key: string, value: boolean) => (
        <Checkbox
            checked={value}
            onCheckedChange={(checked) => onChange(key, !!checked)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
    );

    const renderUserSelect = (key: string, value: boolean | null) => (
        <Select
            value={value === null ? "null" : value ? "true" : "false"}
            onValueChange={(val) => {
                const newValue = val === "null" ? null : val === "true";
                onChange(key, newValue);
            }}
        >
            <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="null" className="text-muted-foreground">Padrão</SelectItem>
                <SelectItem value="true" className="text-green-500">Permitir</SelectItem>
                <SelectItem value="false" className="text-red-500">Bloquear</SelectItem>
            </SelectContent>
        </Select>
    );

    const getPermissionIcon = (type: string) => {
        switch (type) {
            case "view": return Eye;
            case "action": return Edit2;
            case "admin": return Shield;
            default: return Eye;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "view": return "text-blue-400";
            case "action": return "text-amber-400";
            case "admin": return "text-red-400";
            default: return "text-muted-foreground";
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {PERMISSION_MODULES.map((module) => {
                const ModuleIcon = module.icon;
                return (
                    <div key={module.id} className="border rounded-lg overflow-hidden">
                        {/* Module Header */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
                            <ModuleIcon className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{module.label}</span>
                        </div>

                        {/* Permissions Grid */}
                        <div className="p-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {module.permissions.map((perm) => {
                                    const value = permissions[perm.key];
                                    const TypeIcon = getPermissionIcon(perm.type);

                                    return (
                                        <div
                                            key={perm.key}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-md transition-colors",
                                                mode === "group" && value && "bg-primary/10",
                                                mode === "user" && value === true && "bg-green-500/10",
                                                mode === "user" && value === false && "bg-red-500/10"
                                            )}
                                        >
                                            {mode === "group" ? (
                                                renderGroupCheckbox(perm.key, value as boolean)
                                            ) : (
                                                renderUserSelect(perm.key, value as boolean | null)
                                            )}
                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                <TypeIcon className={cn("w-3 h-3 flex-shrink-0", getTypeColor(perm.type))} />
                                                <span className="text-xs truncate">{perm.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground border-t">
                <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-blue-400" />
                    <span>Visualização</span>
                </div>
                <div className="flex items-center gap-1">
                    <Edit2 className="w-3 h-3 text-amber-400" />
                    <span>Ação</span>
                </div>
                <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-red-400" />
                    <span>Administração</span>
                </div>
            </div>
        </div>
    );
};

export default PermissionsGrid;
