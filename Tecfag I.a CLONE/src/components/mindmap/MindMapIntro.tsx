import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, FolderOpen, Server, CheckCircle, Star, Users, Sparkles } from "lucide-react";

interface MenuOption {
    icon: React.ElementType;
    title: string;
    description: string;
    slug: string;
}

const menuOptions: MenuOption[] = [
    {
        icon: FolderOpen,
        title: "Meus Mapas Mentais",
        description: "Acesse e gerencie seus mapas mentais criados",
        slug: "meus-mapas",
    },
    {
        icon: Server,
        title: "Mapas Mentais do Sistema",
        description: "Explore mapas gerados automaticamente pela IA",
        slug: "mapas-sistema",
    },
    {
        icon: CheckCircle,
        title: "Mapas Mentais Aprovados",
        description: "Visualize mapas revisados e aprovados",
        slug: "mapas-aprovados",
    },
    {
        icon: Star,
        title: "Modelos Prontos",
        description: "Comece a partir de templates pré-configurados",
        slug: "modelos-prontos",
    },
    {
        icon: Users,
        title: "Compartilhados Comigo",
        description: "Mapas compartilhados por outros usuários",
        slug: "compartilhados",
    },
];

interface MindMapIntroProps {
    onNavigate: (slug: string) => void;
}

const MindMapIntro = ({ onNavigate }: MindMapIntroProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const particles = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 4 + 3,
            delay: Math.random() * 5,
            opacity: Math.random() * 0.5 + 0.1,
        })), []
    );

    return (
        <div className="flex min-h-full items-center justify-center bg-background overflow-hidden px-4 relative">
            {/* Animated particles */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full bg-primary"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [p.opacity, p.opacity * 2, p.opacity],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)",
                backgroundSize: "40px 40px",
            }} />

            <div className={`relative flex ${isMobile ? 'flex-col' : 'flex-row'} items-center w-full max-w-6xl justify-center z-10`}>
                {/* Central "Tecfag" Button */}
                <motion.div
                    className="relative z-10 flex-shrink-0"
                    animate={{
                        x: isExpanded && !isMobile ? -80 : 0,
                        y: isExpanded && isMobile ? -40 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                    {/* Radial glow behind button */}
                    <div
                        className="absolute inset-0 rounded-full blur-3xl opacity-30"
                        style={{
                            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
                            transform: "scale(1.8)",
                        }}
                    />
                    <motion.button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="group relative flex h-32 w-32 md:h-40 md:w-40 flex-col items-center justify-center rounded-full border-2 border-primary bg-card glow-red cursor-pointer select-none"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        animate={isExpanded ? { scale: 0.85 } : { scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {!isExpanded && (
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-primary"
                                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                        )}
                        <Brain className="mb-2 h-8 w-8 md:h-10 md:w-10 text-primary" />
                        <span className="text-xs md:text-sm font-bold tracking-wider text-foreground uppercase">
                            {isExpanded ? "Voltar" : "TECFAG"}
                        </span>
                        <span className="mt-1 text-[10px] text-muted-foreground">
                            Mapa Mental
                        </span>
                    </motion.button>
                </motion.div>

                {/* Connection lines + Menu Options */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            className={`${isMobile ? 'mt-6 flex flex-col gap-3 items-center w-full' : 'absolute left-1/2 ml-20 flex flex-col gap-3'}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {menuOptions.map((option, index) => {
                                const totalItems = menuOptions.length;
                                const yOffset = (index - (totalItems - 1) / 2) * 76;

                                return (
                                    <motion.div
                                        key={option.title}
                                        className="relative flex items-center"
                                        initial={{ opacity: 0, x: isMobile ? 0 : -30, y: isMobile ? -20 : 0 }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            y: isMobile ? 0 : yOffset - index * 76 + (totalItems - 1) * 38
                                        }}
                                        exit={{ opacity: 0, x: isMobile ? 0 : -30 }}
                                        transition={{
                                            delay: index * 0.08,
                                            type: "spring",
                                            stiffness: 250,
                                            damping: 22,
                                        }}
                                    >
                                        {/* Curved connection line - desktop only */}
                                        {!isMobile && (() => {
                                            const curveWidth = 120;
                                            const svgHeight = 20;
                                            // Each card ~60px tall + 12px gap = 72px spacing
                                            const cardSpacing = 72;
                                            const centerIndex = (totalItems - 1) / 2;
                                            // How far this card's center is from the list center
                                            const cardOffsetFromCenter = (index - centerIndex) * cardSpacing;
                                            // Line start Y: compensate for card position so all lines converge at button center
                                            const startY = svgHeight / 2 - cardOffsetFromCenter;
                                            const endY = svgHeight / 2;
                                            return (
                                                <svg
                                                    className="absolute -left-[120px] top-1/2"
                                                    width={curveWidth}
                                                    height={svgHeight}
                                                    viewBox={`0 0 ${curveWidth} ${svgHeight}`}
                                                    style={{ transform: `translateY(-${svgHeight / 2}px)` }}
                                                    overflow="visible"
                                                >
                                                    <motion.path
                                                        d={`M 0 ${startY} C ${curveWidth * 0.4} ${startY}, ${curveWidth * 0.6} ${endY}, ${curveWidth} ${endY}`}
                                                        stroke="hsl(var(--primary))"
                                                        strokeWidth="2"
                                                        fill="none"
                                                        strokeDasharray="6 4"
                                                        initial={{ pathLength: 0 }}
                                                        animate={{ pathLength: 1 }}
                                                        transition={{ delay: index * 0.08 + 0.1, duration: 0.4 }}
                                                    />
                                                    <motion.circle
                                                        cx="0"
                                                        cy={startY}
                                                        r="5"
                                                        fill="hsl(var(--primary))"
                                                        stroke="hsl(var(--background))"
                                                        strokeWidth="2"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: index * 0.08 + 0.05 }}
                                                    />
                                                    <motion.circle
                                                        cx={curveWidth}
                                                        cy={endY}
                                                        r="4"
                                                        fill="hsl(var(--primary))"
                                                        stroke="hsl(var(--background))"
                                                        strokeWidth="2"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: index * 0.08 + 0.3 }}
                                                    />
                                                </svg>
                                            );
                                        })()}

                                        {/* Option Card */}
                                        <button
                                            onClick={() => onNavigate(option.slug)}
                                            className={`flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 md:px-5 md:py-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary cursor-pointer ${isMobile ? 'w-full max-w-[320px]' : 'min-w-[320px]'}`}
                                        >
                                            <div className="flex h-9 w-9 md:h-10 md:w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                                                <option.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-xs md:text-sm font-semibold text-foreground truncate">
                                                    {option.title}
                                                </h3>
                                                <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 truncate">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Subtitle when not expanded */}
                <AnimatePresence>
                    {!isExpanded && (
                        <motion.div
                            className="absolute top-full mt-8 text-center w-full"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm">Clique para explorar o módulo</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MindMapIntro;
