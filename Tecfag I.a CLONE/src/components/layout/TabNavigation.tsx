import { MessageSquare, Network, Package, Users, Activity, FileStack, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabType = "chat" | "mindmap" | "catalog" | "users" | "monitoring" | "documents" | "settings";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin?: boolean;
  canView?: (module: 'chat' | 'mindmap' | 'catalog' | 'users' | 'monitoring' | 'documents' | 'settings') => boolean;
}

const tabs = [
  { id: "chat" as const, label: "Chat IA", icon: MessageSquare, module: "chat" as const },
  { id: "mindmap" as const, label: "Mapa Mental", icon: Network, module: "mindmap" as const },
  { id: "catalog" as const, label: "Catálogo", icon: Package, module: "catalog" as const },
  { id: "users" as const, label: "Usuários", icon: Users, module: "users" as const },
  { id: "monitoring" as const, label: "Monitoramento", icon: Activity, module: "monitoring" as const },
  { id: "documents" as const, label: "Documentos I.A", icon: FileStack, module: "documents" as const },
  { id: "settings" as const, label: "Configurações", icon: Settings, module: "settings" as const },
];

const TabNavigation = ({ activeTab, onTabChange, isAdmin = false, canView }: TabNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl md:static md:border-t-0 md:border-b md:bg-transparent md:backdrop-blur-none">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around md:justify-start md:gap-2 py-2 md:py-4">
          {tabs.map((tab) => {
            // Use canView function if provided, otherwise fall back to isAdmin check
            const hasPermission = canView
              ? canView(tab.module)
              : (tab.module === 'chat' || tab.module === 'mindmap' || tab.module === 'catalog' || isAdmin);

            if (!hasPermission) {
              return null;
            }

            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant="nav"
                data-active={isActive}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-col md:flex-row gap-1 md:gap-2 h-auto py-2 px-4 md:px-6 rounded-xl transition-all duration-300",
                  isActive && "glow-effect"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive && "text-primary"
                )} />
                <span className="text-xs md:text-sm font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default TabNavigation;
