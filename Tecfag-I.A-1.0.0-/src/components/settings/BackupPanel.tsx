import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Database,
    Download,
    Trash2,
    RotateCcw,
    Plus,
    Settings,
    CheckCircle,
    AlertCircle,
    Loader2,
    HardDrive,
    Clock,
    Calendar,
    RefreshCw,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { backupApi, BackupInfo } from "@/lib/api";

interface BackupPanelProps {
    onBack: () => void;
}

const BackupPanel = ({ onBack }: BackupPanelProps) => {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);

    // Status state
    const [status, setStatus] = useState<{
        totalBackups: number;
        totalSizeMB: string;
        lastBackup: BackupInfo | null;
        isIntegrity: boolean;
        integrityDetails: string;
        settings: {
            maxBackups: number;
            intervalHours: number;
            nextScheduledBackup: string | null;
        };
    } | null>(null);

    // Settings dialog state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        maxBackups: 10,
        intervalHours: 6.
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Confirmation dialogs
    const [deleteBackupName, setDeleteBackupName] = useState<string | null>(null);
    const [restoreBackupName, setRestoreBackupName] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [backupsRes, statusRes] = await Promise.all([
                backupApi.list(),
                backupApi.getStatus()
            ]);
            setBackups(backupsRes.backups);
            setStatus(statusRes);
            setSettingsForm({
                maxBackups: statusRes.settings.maxBackups,
                intervalHours: statusRes.settings.intervalHours
            });
        } catch (error) {
            console.error("Error fetching backup data:", error);
            toast({
                title: "Erro",
                description: "Erro ao carregar dados de backup",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setIsCreating(true);
            const result = await backupApi.create("manual");
            toast({
                title: "Sucesso",
                description: "Backup criado com sucesso",
            });
            await fetchData();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao criar backup",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleCheckIntegrity = async () => {
        try {
            setIsCheckingIntegrity(true);
            const result = await backupApi.checkIntegrity();

            if (result.isOk) {
                toast({
                    title: "✓ Banco Íntegro",
                    description: result.details,
                });
            } else {
                toast({
                    title: "⚠ Problema Detectado",
                    description: result.details,
                    variant: "destructive",
                });
            }

            await fetchData();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao verificar integridade",
                variant: "destructive",
            });
        } finally {
            setIsCheckingIntegrity(false);
        }
    };

    const handleDownload = (backupName: string) => {
        const url = backupApi.getDownloadUrl(backupName);
        window.open(url, '_blank');
    };

    const confirmDelete = async () => {
        if (!deleteBackupName) return;

        try {
            setIsDeleting(true);
            await backupApi.delete(deleteBackupName);
            toast({
                title: "Sucesso",
                description: "Backup deletado com sucesso",
            });
            setDeleteBackupName(null);
            await fetchData();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao deletar backup",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmRestore = async () => {
        if (!restoreBackupName) return;

        try {
            setIsRestoring(true);
            await backupApi.restore(restoreBackupName);
            toast({
                title: "Backup Restaurado",
                description: "Reinicie o servidor para aplicar as alterações",
            });
            setRestoreBackupName(null);
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao restaurar backup",
                variant: "destructive",
            });
        } finally {
            setIsRestoring(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setIsSavingSettings(true);
            await backupApi.updateSettings(settingsForm);
            toast({
                title: "Sucesso",
                description: "Configurações salvas com sucesso",
            });
            setIsSettingsOpen(false);
            await fetchData();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao salvar configurações",
                variant: "destructive",
            });
        } finally {
            setIsSavingSettings(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                            <Database className="w-6 h-6 text-primary" />
                            Backup e Dados
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Gerencie backups do banco de dados
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Configurações
                </Button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Integrity Status */}
                <div className={cn(
                    "glass-card p-4 border-l-4",
                    status?.isIntegrity ? "border-l-green-500" : "border-l-red-500"
                )}>
                    <div className="flex items-center gap-3">
                        {status?.isIntegrity ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        ) : (
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Integridade</p>
                            <p className={cn("font-semibold", status?.isIntegrity ? "text-green-500" : "text-red-500")}>
                                {status?.isIntegrity ? "Banco Íntegro" : "Problema Detectado"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Backups */}
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <HardDrive className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Backups</p>
                            <p className="text-xl font-bold">{status?.totalBackups || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Total Size */}
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Espaço Usado</p>
                            <p className="text-xl font-bold">{status?.totalSizeMB || "0"} MB</p>
                        </div>
                    </div>
                </div>

                {/* Next Backup */}
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-amber-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Próximo Backup</p>
                            <p className="text-sm font-medium">
                                {status?.settings.nextScheduledBackup
                                    ? formatDate(status.settings.nextScheduledBackup)
                                    : "Não agendado"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Button
                    onClick={handleCreateBackup}
                    disabled={isCreating}
                    className="gap-2"
                >
                    {isCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                    Criar Backup
                </Button>
                <Button
                    variant="outline"
                    onClick={handleCheckIntegrity}
                    disabled={isCheckingIntegrity}
                    className="gap-2"
                >
                    {isCheckingIntegrity ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Shield className="w-4 h-4" />
                    )}
                    Verificar Integridade
                </Button>
                <Button
                    variant="outline"
                    onClick={fetchData}
                    className="gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </Button>
            </div>

            {/* Backups List */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Backups Disponíveis
                </h3>

                {backups.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium mb-2">Nenhum backup encontrado</p>
                        <p className="text-sm text-muted-foreground">
                            Clique em "Criar Backup" para criar seu primeiro backup
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {backups.map((backup, index) => (
                            <div
                                key={backup.name}
                                className="glass-card p-4 flex items-center justify-between gap-4 animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <Database className="w-5 h-5 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{backup.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(backup.date)} • {backup.sizeMB} MB
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDownload(backup.name)}
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setRestoreBackupName(backup.name)}
                                        title="Restaurar"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteBackupName(backup.name)}
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Configurações de Backup
                        </DialogTitle>
                        <DialogDescription>
                            Configure as opções de backup automático
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Máximo de Backups</label>
                            <Input
                                type="number"
                                min={1}
                                max={50}
                                value={settingsForm.maxBackups}
                                onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    maxBackups: parseInt(e.target.value) || 10
                                })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Backups mais antigos serão removidos automaticamente
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Intervalo de Backup (horas)</label>
                            <Input
                                type="number"
                                min={1}
                                max={168}
                                value={settingsForm.intervalHours}
                                onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    intervalHours: parseInt(e.target.value) || 6
                                })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Frequência do backup automático (1-168 horas)
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                            {isSavingSettings ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteBackupName} onOpenChange={(open) => !open && setDeleteBackupName(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Backup?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O backup "{deleteBackupName}" será permanentemente removido.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Restore Confirmation */}
            <AlertDialog open={!!restoreBackupName} onOpenChange={(open) => !open && setRestoreBackupName(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurar Backup?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O banco de dados atual será substituído pelo backup "{restoreBackupName}".
                            Um backup do estado atual será criado antes da restauração.
                            <br /><br />
                            <strong className="text-amber-500">⚠️ Você precisará reiniciar o servidor após a restauração!</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRestoring}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRestore}
                            disabled={isRestoring}
                        >
                            {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Restaurar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default BackupPanel;
