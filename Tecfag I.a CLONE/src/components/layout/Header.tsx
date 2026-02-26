import { useState, useEffect } from "react";
import { Cpu, Shield, User, LogOut, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isAdmin: boolean;
  user?: {
    name: string;
    email: string;
    role: string;
    accessGroup?: {
      canViewNotifications?: boolean;
    } | null;
  } | null;
  onLogout?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Header = ({ isAdmin, user, onLogout, isCollapsed, onToggleCollapse }: HeaderProps) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(localStorage.getItem('isSystemMuted') === 'true');
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('isSystemMuted', String(newMutedState));
  };

  return (
    <>
      {/* Main Header */}
      <header
        className="fixed left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
        style={{
          top: isCollapsed ? "-4rem" : "0",
          transition: "top 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Cpu className="w-8 h-8 text-primary animate-pulse-glow" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">
                Tec <span className="text-gradient">I.A</span>
              </h1>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                TECFAG GROUP - MÁQUINAS INDUSTRIAIS
              </span>
            </div>
          </div>

          {/* Centered toggle icon (subtle) */}
          <button
            onClick={onToggleCollapse}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-[60] flex items-center justify-center w-6 h-3 rounded-b-md bg-border/30 hover:bg-border/60 transition-all duration-300 cursor-pointer group"
            title="Minimizar barra"
          >
            <ChevronUp className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </button>

          <div className="flex items-center gap-2">
            {user && (isAdmin || user.accessGroup?.canViewNotifications) && (
              <NotificationBell />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isAdmin ? (
                    <Shield className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Perfil</span>
                  <div className="hidden md:flex items-center gap-2 ml-1 pl-2 border-l border-border">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">{user?.name || "Usuário"}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  Tipo: {isAdmin ? "Administrador" : "Usuário"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleMute} className="cursor-pointer">
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 mr-2 text-muted-foreground" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2 text-muted-foreground" />
                  )}
                  {isMuted ? "Ativar som do sistema" : "Silenciar sistema"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Floating restore button (visible only when collapsed) */}
      <button
        onClick={onToggleCollapse}
        className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center justify-center w-8 h-4 rounded-b-lg cursor-pointer group"
        style={{
          top: isCollapsed ? "0" : "-2rem",
          opacity: isCollapsed ? 1 : 0,
          transition: "top 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
          background: "hsl(var(--border) / 0.25)",
          backdropFilter: "blur(8px)",
          pointerEvents: isCollapsed ? "auto" : "none",
        }}
        title="Expandir barra"
      >
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      </button>
    </>
  );
};

export default Header;
