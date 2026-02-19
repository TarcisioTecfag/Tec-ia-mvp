import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Settings,
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle,
    Loader2,
    RefreshCw,
    Clock,
    BellOff,
    MessageSquare,
    FileText,
    Users,
    Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { notificationsApi, NotificationType, NotificationSettings } from "@/lib/api";

interface NotificationsPanelProps {
    onBack: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
};

const typeIcons: Record<string, React.ReactNode> = {
    system: <Server className="w-4 h-4" />,
    user: <Users className="w-4 h-4" />,
    document: <FileText className="w-4 h-4" />,
    chat: <MessageSquare className="w-4 h-4" />,
};

type FilterType = "all" | "system" | "user" | "document" | "chat";

const NotificationsPanel = ({ onBack }: NotificationsPanelProps) => {
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<NotificationType[]>([]);
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Settings dialog state
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState<Partial<NotificationSettings>>({});
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeFilter === "all") {
            setFilteredNotifications(notifications);
        } else {
            setFilteredNotifications(notifications.filter(n => n.type === activeFilter));
        }
    }, [notifications, activeFilter]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [notificationsRes, settingsRes, unreadRes] = await Promise.all([
                notificationsApi.getAll(50, 0),
                notificationsApi.getSettings(),
                notificationsApi.getUnreadCount()
            ]);
            setNotifications(notificationsRes.notifications);
            setSettings(settingsRes.settings);
            setSettingsForm(settingsRes.settings);
            setUnreadCount(unreadRes.count);
        } catch (error) {
            console.error("Error fetching notification data:", error);
            toast({
                title: "Erro",
                description: "Erro ao carregar dados de notificações",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro ao marcar notificação como lida",
                variant: "destructive",
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
            );
            setUnreadCount(0);
            toast({
                title: "Sucesso",
                description: "Todas as notificações foram marcadas como lidas",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro ao marcar notificações como lidas",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationsApi.delete(id);
            const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro ao deletar notificação",
                variant: "destructive",
            });
        }
    };

    // Clear All functionality removed as requested
    /* const handleClearAll = async () => { ... } */

    const handleSaveSettings = async () => {
        try {
            setIsSavingSettings(true);
            const result = await notificationsApi.updateSettings(settingsForm);
            setSettings(result.settings);
            setIsSettingsDialogOpen(false);
            toast({
                title: "Sucesso",
                description: "Configurações salvas com sucesso",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro ao salvar configurações",
                variant: "destructive",
            });
        } finally {
            setIsSavingSettings(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Agora";
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
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
                            <Bell className="w-6 h-6 text-primary" />
                            Notificações
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Gerencie suas notificações e preferências
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Configurações
                </Button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Unread Count */}
                <div className={cn(
                    "glass-card p-4 border-l-4",
                    unreadCount > 0 ? "border-l-primary" : "border-l-green-500"
                )}>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 ? (
                            <Bell className="w-8 h-8 text-primary" />
                        ) : (
                            <CheckCheck className="w-8 h-8 text-green-500" />
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Não Lidas</p>
                            <p className="text-xl font-bold">{unreadCount}</p>
                        </div>
                    </div>
                </div>

                {/* Total Notifications */}
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <Bell className="w-8 h-8 text-blue-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-xl font-bold">{notifications.length}</p>
                        </div>
                    </div>
                </div>

                {/* Quiet Hours Status */}
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        {settings?.quietHoursEnabled ? (
                            <BellOff className="w-8 h-8 text-amber-500" />
                        ) : (
                            <Clock className="w-8 h-8 text-muted-foreground" />
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Horário de Silêncio</p>
                            <p className="text-sm font-medium">
                                {settings?.quietHoursEnabled
                                    ? `${settings.quietHoursStart} - ${settings.quietHoursEnd}`
                                    : "Desabilitado"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                        variant={activeFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveFilter("all")}
                        className="rounded-full"
                    >
                        Todas
                    </Button>
                    <Button
                        variant={activeFilter === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveFilter("system")}
                        className="rounded-full gap-2"
                    >
                        <Server className="w-3 h-3" />
                        Sistema
                    </Button>
                    <Button
                        variant={activeFilter === "user" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveFilter("user")}
                        className="rounded-full gap-2"
                    >
                        <Users className="w-3 h-3" />
                        Usuários
                    </Button>
                    <Button
                        variant={activeFilter === "document" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveFilter("document")}
                        className="rounded-full gap-2"
                    >
                        <FileText className="w-3 h-3" />
                        Documentos
                    </Button>
                    <Button
                        variant={activeFilter === "chat" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveFilter("chat")}
                        className="rounded-full gap-2"
                    >
                        <MessageSquare className="w-3 h-3" />
                        Chat
                    </Button>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className="gap-2"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Marcar Todas como Lidas
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={fetchData}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Suas Notificações
                </h3>

                {filteredNotifications.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium mb-2">Nenhuma notificação encontrada</p>
                        <p className="text-sm text-muted-foreground">
                            {activeFilter === "all"
                                ? "Você receberá notificações sobre atividades importantes do sistema aqui"
                                : "Não há notificações para este filtro"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredNotifications.map((notification, index) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "glass-card p-4 flex items-start gap-4 animate-fade-in transition-all",
                                    !notification.isRead && "border-l-4 border-l-primary bg-primary/5"
                                )}
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                {/* Category Icon */}
                                <div className="flex-shrink-0 mt-0.5">
                                    {categoryIcons[notification.category] || categoryIcons.info}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            {typeIcons[notification.type]}
                                            {notification.type === 'system' && 'Sistema'}
                                            {notification.type === 'user' && 'Usuários'}
                                            {notification.type === 'document' && 'Documentos'}
                                            {notification.type === 'chat' && 'Chat'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                        {!notification.isRead && (
                                            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                                                Nova
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-medium">{notification.title}</p>
                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {!notification.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            title="Marcar como lida"
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Settings Dialog */}
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto scrollbar-thin">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Configurações de Notificações
                        </DialogTitle>
                        <DialogDescription>
                            Personalize quais notificações deseja receber
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Notification Types */}
                        <div className="space-y-4">
                            <h4 className="font-medium">Tipos de Notificação</h4>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Server className="w-4 h-4 text-muted-foreground" />
                                        <span>Alertas de Sistema</span>
                                    </div>
                                    <Switch
                                        checked={settingsForm.systemAlerts ?? true}
                                        onCheckedChange={(checked) =>
                                            setSettingsForm(prev => ({ ...prev, systemAlerts: checked }))
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>Notificações de Usuários</span>
                                    </div>
                                    <Switch
                                        checked={settingsForm.userAlerts ?? true}
                                        onCheckedChange={(checked) =>
                                            setSettingsForm(prev => ({ ...prev, userAlerts: checked }))
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <span>Alertas de Documentos</span>
                                    </div>
                                    <Switch
                                        checked={settingsForm.documentAlerts ?? true}
                                        onCheckedChange={(checked) =>
                                            setSettingsForm(prev => ({ ...prev, documentAlerts: checked }))
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                        <span>Notificações do Chat</span>
                                    </div>
                                    <Switch
                                        checked={settingsForm.chatAlerts ?? true}
                                        onCheckedChange={(checked) =>
                                            setSettingsForm(prev => ({ ...prev, chatAlerts: checked }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Frequency */}
                        <div className="space-y-2">
                            <h4 className="font-medium">Frequência</h4>
                            <Select
                                value={settingsForm.frequency ?? 'realtime'}
                                onValueChange={(value) =>
                                    setSettingsForm(prev => ({ ...prev, frequency: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a frequência" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="realtime">Tempo Real</SelectItem>
                                    <SelectItem value="daily">Resumo Diário</SelectItem>
                                    <SelectItem value="weekly">Resumo Semanal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quiet Hours */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Horário de Silêncio</h4>
                                <Switch
                                    checked={settingsForm.quietHoursEnabled ?? false}
                                    onCheckedChange={(checked) =>
                                        setSettingsForm(prev => ({ ...prev, quietHoursEnabled: checked }))
                                    }
                                />
                            </div>

                            {settingsForm.quietHoursEnabled && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-muted-foreground">Início</label>
                                        <Input
                                            type="time"
                                            value={settingsForm.quietHoursStart ?? '22:00'}
                                            onChange={(e) =>
                                                setSettingsForm(prev => ({ ...prev, quietHoursStart: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-muted-foreground">Fim</label>
                                        <Input
                                            type="time"
                                            value={settingsForm.quietHoursEnd ?? '08:00'}
                                            onChange={(e) =>
                                                setSettingsForm(prev => ({ ...prev, quietHoursEnd: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Durante o horário de silêncio, apenas notificações críticas serão exibidas
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                            {isSavingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NotificationsPanel;
