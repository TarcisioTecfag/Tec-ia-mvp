import { useState, useEffect } from "react";
import {
    Settings,
    Users,
    FormInput,
    Bell,
    Shield,
    Palette,
    Database,
    Plug,
    Mail,
    FileDown,
    ChevronRight
} from "lucide-react";

import { cn } from "@/lib/utils";
import AccessGroupsPanel from "./AccessGroupsPanel";
import ExportsPanel from "./ExportsPanel";
import BackupPanel from "./BackupPanel";
import NotificationsPanel from "./NotificationsPanel";

interface SettingCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

const settingsCards: SettingCard[] = [
    {
        id: "access",
        title: "Acessos",
        description: "Gerencie permissões de usuários, grupos e níveis de acesso ao sistema.",
        icon: <Users className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    },
    {
        id: "custom-fields",
        title: "Campos Personalizados",
        description: "Estamos trabalhando nisso!",
        icon: <FormInput className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    },
    {
        id: "notifications",
        title: "Notificações",
        description: "Configure alertas, lembretes e preferências de notificação do...",
        icon: <Bell className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    },
    {
        id: "security",
        title: "Segurança",
        description: "Estamos trabalhando nisso!",
        icon: <Shield className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    },
    {
        id: "appearance",
        title: "Aparência",
        description: "Estamos trabalhando nisso!",
        icon: <Palette className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    },
    {
        id: "backup",
        title: "Backup e Dados",
        description: "Configure rotinas de backup automático e exportação de dados.",
        icon: <Database className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    },
    {
        id: "integrations",
        title: "Integrações",
        description: "Estamos trabalhando nisso!",
        icon: <Plug className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    },
    {
        id: "email",
        title: "E-mail e SMTP",
        description: "Estamos trabalhando nisso!",
        icon: <Mail className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    },
    {
        id: "exports",
        title: "Exportação e Relatórios",
        description: "Exporte conversas, gere relatórios de uso e baixe dados do sistema.",
        icon: <FileDown className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20"
    }
];

type SettingsSection = "main" | "access" | "exports" | "backup" | "notifications";

const SettingsTab = () => {
    const [activeSection, setActiveSection] = useState<SettingsSection>("main");

    // Listen for tab change events (e.g. from Notification Bell)
    useEffect(() => {
        const handleTabChange = (e: CustomEvent<string>) => {
            if (e.detail === 'notifications') {
                setActiveSection('notifications');
            }
        };

        window.addEventListener('change-settings-tab', handleTabChange as EventListener);
        return () => {
            window.removeEventListener('change-settings-tab', handleTabChange as EventListener);
        };
    }, []);

    const handleCardClick = (cardId: string) => {
        if (cardId === "access") {
            setActiveSection("access");
        } else if (cardId === "exports") {
            setActiveSection("exports");
        } else if (cardId === "backup") {
            setActiveSection("backup");
        } else if (cardId === "notifications") {
            setActiveSection("notifications");
        } else {
            // TODO: Implementar outras seções de configuração
            console.log(`Navegando para configuração: ${cardId}`);
        }
    };

    // Render AccessGroupsPanel when in access section
    if (activeSection === "access") {
        return (
            <div className="h-full overflow-auto bg-background scrollbar-thin">
                <div className="container mx-auto px-4 py-6">
                    <AccessGroupsPanel onBack={() => setActiveSection("main")} />
                </div>
            </div>
        );
    }

    // Render ExportsPanel when in exports section
    if (activeSection === "exports") {
        return (
            <div className="h-full overflow-auto bg-background scrollbar-thin">
                <div className="container mx-auto px-4 py-6">
                    <ExportsPanel onBack={() => setActiveSection("main")} />
                </div>
            </div>
        );
    }

    // Render BackupPanel when in backup section
    if (activeSection === "backup") {
        return (
            <div className="h-full overflow-auto bg-background scrollbar-thin">
                <div className="container mx-auto px-4 py-6">
                    <BackupPanel onBack={() => setActiveSection("main")} />
                </div>
            </div>
        );
    }

    // Render NotificationsPanel when in notifications section
    if (activeSection === "notifications") {
        return (
            <div className="h-full overflow-auto bg-background scrollbar-thin">
                <div className="container mx-auto px-4 py-6">
                    <NotificationsPanel onBack={() => setActiveSection("main")} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto bg-background scrollbar-thin">
            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Settings className="w-8 h-8 text-primary" />
                        Configurações
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie as configurações do sistema, rotinas e preferências gerais
                    </p>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {settingsCards.map((card, index) => (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className={cn(
                                "group relative p-4 rounded-xl border transition-all duration-300",
                                "bg-card/50 backdrop-blur-sm hover:bg-card/80",
                                "border-border/50 hover:border-primary/30",
                                "text-left animate-fade-in"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon Container */}
                                <div className={cn(
                                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                                    "border transition-colors duration-300",
                                    card.bgColor,
                                    card.color
                                )}>
                                    {card.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                        "font-semibold mb-1 transition-colors",
                                        card.color
                                    )}>
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {card.description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className={cn(
                                    "w-5 h-5 text-muted-foreground/50 flex-shrink-0",
                                    "transition-all duration-300",
                                    "group-hover:text-primary group-hover:translate-x-1"
                                )} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;

