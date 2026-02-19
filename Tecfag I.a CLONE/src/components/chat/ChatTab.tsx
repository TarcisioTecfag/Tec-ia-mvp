import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Archive, History, ArrowLeft, BookOpen, Settings, Maximize2, Minimize2, Square, Network, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { chatApi, ArchivedChatSummary, mindmapsApi, setMindMapMeta } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChat, Message } from "@/contexts/ChatContext";
import ArchivedChatsList from "./ArchivedChatsList";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatModeSelector, type ChatMode } from "./ChatModeSelector";
import { ChatFunctionSelector, type ChatFunction } from "./ChatFunctionSelector";
import { ChatSuggestions } from "./ChatSuggestions";
import { AIPreferencesModal } from "./AIPreferencesModal";
import { MessageFeedback } from "./MessageFeedback";
import { ChatImage } from "./ChatImage";
import { ChatMediaGallery } from "./ChatMediaGallery";

// Helper function to extract image groups from markdown content (deduplicated by src)
const extractImagesFromContent = (content: string): { src: string; alt?: string }[] => {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: { src: string; alt?: string }[] = [];
  const seenSrcs = new Set<string>();
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const src = match[2];
    // Deduplicate by normalizing the src (remove URL encoding differences)
    const normalizedSrc = decodeURIComponent(src).toLowerCase();
    if (!seenSrcs.has(normalizedSrc)) {
      seenSrcs.add(normalizedSrc);
      images.push({ alt: match[1] || undefined, src: match[2] });
    }
  }
  return images;
};

// Helper function to extract PDFs from markdown content
// Format: [pdf:filename](url)
const extractPDFsFromContent = (content: string): { fileName: string; url: string }[] => {
  const pdfRegex = /\[pdf:([^\]]+)\]\(([^)]+)\)/g;
  const pdfs: { fileName: string; url: string }[] = [];
  const seenUrls = new Set<string>();
  let match;
  while ((match = pdfRegex.exec(content)) !== null) {
    const url = match[2];
    const normalizedUrl = decodeURIComponent(url).toLowerCase();
    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      pdfs.push({ fileName: match[1], url: match[2] });
    }
  }
  return pdfs;
};

// Helper function to extract YouTube videos from markdown content
// Format: [youtube:videoId](url)
const extractYouTubeFromContent = (content: string): { videoId: string; url: string }[] => {
  const youtubeRegex = /\[youtube:([^\]]+)\]\(([^)]+)\)/g;
  const videos: { videoId: string; url: string }[] = [];
  const seenIds = new Set<string>();
  let match;
  while ((match = youtubeRegex.exec(content)) !== null) {
    const videoId = match[1];
    if (!seenIds.has(videoId)) {
      seenIds.add(videoId);
      videos.push({ videoId: match[1], url: match[2] });
    }
  }
  return videos;
};

// Helper function to remove images, PDFs, YouTube and orphan headers from markdown content
const removeMediaFromContent = (content: string): string => {
  return content
    // Remove markdown images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')
    // Remove PDF links
    .replace(/\[pdf:([^\]]+)\]\(([^)]+)\)/g, '')
    // Remove YouTube links
    .replace(/\[youtube:([^\]]+)\]\(([^)]+)\)/g, '')
    // Remove orphan "Imagens Relacionadas" headers (with various formats)
    .replace(/^#{1,6}\s*Imagens?\s*Relacionadas?:?\s*$/gim, '')
    .replace(/^\*{1,2}Imagens?\s*Relacionadas?:\*{1,2}\s*$/gim, '')
    .replace(/^Imagens?\s*Relacionadas?:\s*$/gim, '')
    // Remove orphan "PDFs Relacionados" headers
    .replace(/^#{1,6}\s*PDFs?\s*Relacionados?:?\s*$/gim, '')
    .replace(/^\*{1,2}PDFs?\s*Relacionados?:\*{1,2}\s*$/gim, '')
    .replace(/^PDFs?\s*Relacionados?:\s*$/gim, '')
    // Remove orphan "Vídeos Relacionados" headers
    .replace(/^#{1,6}\s*V[ií]deos?\s*Relacionados?:?\s*$/gim, '')
    .replace(/^\*{1,2}V[ií]deos?\s*Relacionados?:\*{1,2}\s*$/gim, '')
    .replace(/^V[ií]deos?\s*Relacionados?:\s*$/gim, '')
    // Remove horizontal rules/separators (---, ___, ***)
    .replace(/^[\-_\*]{3,}\s*$/gm, '')
    // Clean up multiple consecutive blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Remove trailing whitespace/newlines
    .replace(/\s+$/, '')
    .trim();
};

// DEPRECATED: Keep for backwards compatibility
const removeImagesFromContent = removeMediaFromContent;

type ViewMode = "active" | "archived-list" | "archived-detail";

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const getModeConfig = (mode: ChatMode) => {
  switch (mode) {
    case "direct":
      return { label: "Modelo Direto", color: "text-yellow-400", bgColor: "bg-yellow-500", borderColor: "border-yellow-500/20" };
    case "casual":
      return { label: "LM", color: "text-green-400", bgColor: "bg-green-500", borderColor: "border-green-500/20" };
    case "educational":
      return { label: "Modelo Educativo", color: "text-cyan-400", bgColor: "bg-cyan-500", borderColor: "border-cyan-500/20" };
    case "professional":
      return { label: "Modelo Profissional", color: "text-red-400", bgColor: "bg-red-500", borderColor: "border-red-500/20" };
    default:
      return { label: "Modelo Padrão", color: "text-primary", bgColor: "bg-primary", borderColor: "border-primary/20" };
  }
};

const getWelcomeMessage = (mode: ChatMode): string => {
  switch (mode) {
    case "direct":
      return "Olá. Sou a Tec I.A. Pronta para resolver seus problemas com eficiência. O que precisamos fazer?";
    case "casual":
      return "Olá! Sou o LM. Posso analisar seus documentos e gerar insights profundos. O que vamos explorar?";
    case "educational":
      return "Olá! Sou a Tec I.A. Estou aqui para explorarmos novos conhecimentos hoje. O que você gostaria de aprender?";
    case "professional":
      return "Olá. Sou a Tec I.A. Estou à disposição para oferecer suporte técnico e estratégico. Em que posso ser útil?";
    default:
      return "Olá! Sou a Tec I.A, sua assistente de inteligência artificial. Como posso ajudá-lo hoje?";
  }
};

const ChatTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);

  // Use Global Chat Context
  const {
    messages,
    input,
    setInput,
    isLoading,
    chatMode,
    setChatMode,
    functionMode,
    setFunctionMode,
    sendMessage,
    cancelMessage,
    setIsChatVisible,
    historyLoaded,
    setHistoryLoaded,
    setMessages,
    clearMessages
  } = useChat();

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [currentArchivedChatTitle, setCurrentArchivedChatTitle] = useState("");
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [recentArchives, setRecentArchives] = useState<ArchivedChatSummary[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(!historyLoaded);
  const [thinkingText, setThinkingText] = useState("Pensando...");

  // Thinking animation effect
  useEffect(() => {
    if (!isLoading) {
      setThinkingText("Analisando pergunta...");
      return;
    }

    const texts = ["Analisando pergunta...", "Consultando documentos...", "Gerando resposta..."];
    let i = 0;
    // Initial set
    setThinkingText(texts[0]);

    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setThinkingText(texts[i]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update visibility on mount/unmount
  useEffect(() => {
    setIsChatVisible(true);
    return () => setIsChatVisible(false);
  }, [setIsChatVisible]);

  // Listen for catalog machine inquiry via sessionStorage
  useEffect(() => {
    const pendingQuestion = sessionStorage.getItem('catalog_pending_question');
    if (pendingQuestion) {
      sessionStorage.removeItem('catalog_pending_question');
      // Apply mode preferences
      const pendingChatMode = sessionStorage.getItem('catalog_pending_chatmode');
      const pendingFunctionMode = sessionStorage.getItem('catalog_pending_functionmode');
      if (pendingChatMode) {
        setChatMode(pendingChatMode as ChatMode);
        sessionStorage.removeItem('catalog_pending_chatmode');
      }
      if (pendingFunctionMode) {
        setFunctionMode(pendingFunctionMode as ChatFunction);
        sessionStorage.removeItem('catalog_pending_functionmode');
      }
      // Clear current chat and send the machine question
      clearMessages();
      setViewMode("active");
      // Delay to allow state to settle after clearMessages + mode changes
      setTimeout(() => {
        sendMessage(pendingQuestion);
      }, 500);
    }
  }, []); // Run only on mount

  // Fetch recent archived chats for hover preview
  const fetchRecentArchives = async () => {
    if (recentArchives.length > 0) return; // Already loaded
    setIsLoadingRecent(true);
    try {
      const response = await chatApi.getArchivedChats();
      setRecentArchives(response.archives.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent archives:", error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount if not loaded
  useEffect(() => {
    const loadHistory = async () => {
      if (historyLoaded) {
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const response = await chatApi.getHistory(50, 0);
        if (response.messages.length > 0) {
          const historyMessages: Message[] = response.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: formatTime(new Date()), // Note: API might not return timestamp or we use current time as in original
          }));
          setMessages(historyMessages);
        } else {
          // Only show welcome message if there is no history
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: getWelcomeMessage(chatMode),
              timestamp: formatTime(new Date()),
            },
          ]);
        }
        setHistoryLoaded(true);
      } catch (error) {
        console.error("Error loading chat history:", error);
        // Fallback to welcome message on error
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: getWelcomeMessage(chatMode),
            timestamp: formatTime(new Date()),
          },
        ]);
        setHistoryLoaded(true); // Mark as loaded even on error to prevent retry loop
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [historyLoaded, setMessages, setHistoryLoaded, chatMode]);

  const handleSendWrapper = async (customContent?: string) => {
    await sendMessage(customContent);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Auto-mode detection
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes("tabela") && functionMode !== "table" && functionMode !== "list") {
      setFunctionMode("table");
    } else if (lowerValue.includes("lista") && functionMode !== "list" && functionMode !== "table") {
      setFunctionMode("list");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Check for keywords in suggestion too
    const lowerSuggestion = suggestion.toLowerCase();
    if (lowerSuggestion.includes("tabela")) setFunctionMode("table");
    if (lowerSuggestion.includes("lista")) setFunctionMode("list");

    handleSendWrapper(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendWrapper();
    }
  };

  const handleArchive = async () => {
    // Check if there are messages to archive (excluding welcome message)
    const messagesToArchive = messages.filter(m => m.id !== "welcome");
    if (messagesToArchive.length === 0) {
      return;
    }

    setIsArchiving(true);
    try {
      await chatApi.archiveChat();
      // Reset to welcome message
      clearMessages();
      // Switch to archived list view with animation delay
      setTimeout(() => {
        setViewMode("archived-list");
      }, 100);
    } catch (error) {
      console.error("Error archiving chat:", error);
      alert("Erro ao arquivar chat. Tente novamente.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleViewArchives = async () => {
    // Auto-save current chat before viewing archives
    const messagesToArchive = messages.filter(m => m.id !== "welcome");
    if (messagesToArchive.length > 0) {
      try {
        await chatApi.archiveChat();
        // Reset to welcome message after archiving
        clearMessages();
        // Reset recent archives to force reload
        setRecentArchives([]);
      } catch (err) {
        console.error("Auto-archive error:", err);
      }
    }
    setViewMode("archived-list");
  };

  const handleNewChat = () => {
    clearMessages();
    setViewMode("active");
  };

  const handleSelectArchive = async (archiveId: string) => {
    try {
      const archive = await chatApi.getArchivedChat(archiveId);
      const archivedMessages: Message[] = archive.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: formatTime(new Date(msg.createdAt)),
      }));
      setMessages(archivedMessages);
      setCurrentArchivedChatTitle(archive.title);
      setViewMode("archived-detail");
    } catch (error) {
      console.error("Error loading archived chat:", error);
    }
  };

  const handleBackToArchives = () => {
    setViewMode("archived-list");
  };

  const handleGenerateMindmapFromChat = async () => {
    // 1. Get Context (exclude system/welcome if needed, currently dumping all)
    // Filter out welcome message
    const relevantMessages = messages.filter(m => m.id !== "welcome");

    if (relevantMessages.length < 2) {
      toast({ title: "Chat muito curto", description: "Converse mais com a IA antes de gerar um mapa.", variant: "destructive" });
      return;
    }

    const context = relevantMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'IA'}: ${m.content}`).join('\n\n');

    // 2. Determine Topic (Naive: Last user message or "Chat Analysis")
    const lastUserMsg = [...relevantMessages].reverse().find(m => m.role === 'user');
    const topic = lastUserMsg ? lastUserMsg.content.slice(0, 50) : "Análise de Chat";

    setIsGeneratingMap(true);
    try {
      const result = await mindmapsApi.generateFromChat(context, topic);

      // Tag as system map (public, visible to all)
      setMindMapMeta(result.id, {
        category: 'mapas-sistema',
        isApproved: false,
        sharedWith: [],
        ownerId: user?.id || '',
        ownerName: user?.name || ''
      });

      toast({
        title: "Mapa Mental Gerado! 🧠",
        description: "Salvo em 'Mapas Mentais do Sistema'. Redirecionando...",
        className: "bg-green-500 text-white"
      });

      // Dispatch event to switch tab to MindMap
      setTimeout(() => {
        const event = new CustomEvent('switch-tab', { detail: 'mindmap' });
        window.dispatchEvent(event);
      }, 1500);

    } catch (error) {
      console.error("Mindmap gen error", error);
      toast({ title: "Erro na Geração", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setIsGeneratingMap(false);
    }
  };

  // Theme configuration based on mode
  const getThemeConfig = (mode: ChatMode) => {
    switch (mode) {
      case "direct":
        return {
          primary: "text-yellow-400",
          bgFull: "bg-yellow-500/5",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          userBubble: "bg-yellow-600/90 text-white",
          iconBg: "bg-yellow-500/20",
          glow: "shadow-[0_0_50px_-10px_rgba(234,179,8,0.15)]",
          bgColor: "bg-yellow-500",
        };
      case "casual":
        return {
          primary: "text-green-400",
          bgFull: "bg-green-500/5",
          bg: "bg-green-500/10",
          border: "border-green-500/20",
          userBubble: "bg-green-600/90 text-white",
          iconBg: "bg-green-500/20",
          glow: "shadow-[0_0_50px_-10px_rgba(34,197,94,0.15)]",
          bgColor: "bg-green-500",
        };
      case "educational":
        return {
          primary: "text-cyan-400",
          bgFull: "bg-cyan-500/5",
          bg: "bg-cyan-500/10",
          border: "border-cyan-500/20",
          userBubble: "bg-cyan-600/90 text-white",
          iconBg: "bg-cyan-500/20",
          glow: "shadow-[0_0_50px_-10px_rgba(6,182,212,0.15)]",
          bgColor: "bg-cyan-500",
        };
      case "professional":
        return {
          primary: "text-red-400",
          bgFull: "bg-red-500/5",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          userBubble: "bg-red-600/90 text-white",
          iconBg: "bg-red-500/20",
          glow: "shadow-[0_0_50px_-10px_rgba(239,68,68,0.15)]",
          bgColor: "bg-red-500",
        };
      default:
        return {
          primary: "text-primary",
          bgFull: "bg-primary/5",
          bg: "bg-primary/5",
          border: "border-white/5",
          userBubble: "bg-primary text-primary-foreground",
          iconBg: "bg-primary/20",
          glow: "shadow-none",
          bgColor: "bg-primary",
        };
    }
  };

  const theme = getThemeConfig(chatMode);

  // Render archived list view with animation
  if (viewMode === "archived-list") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="archived-list"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full bg-[#0d0d0d]"
        >
          <ArchivedChatsList
            onNewChat={handleNewChat}
            onSelectArchive={handleSelectArchive}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Render active chat or archived detail view with animation
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "flex items-center justify-center h-full bg-[#0d0d0d]",
          isFullscreen ? "p-0 fixed inset-0 z-50" : "p-4"
        )}
      >
        <motion.div
          layout
          className={cn(
            "flex flex-col h-full w-full overflow-hidden shadow-2xl transition-all duration-700",
            "bg-[#1a1a1a]",
            theme.border,
            theme.glow,
            isFullscreen ? "rounded-none max-w-none" : "rounded-xl max-w-[95%]"
          )}
          style={{ borderWidth: "1px" }}
        >
          {/* Chat Header */}
          <div className={cn("flex items-center justify-between px-4 py-3 border-b transition-colors duration-700", theme.border, theme.bg)}>
            <div className="flex items-center gap-3">
              {viewMode === "archived-detail" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToArchives}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                  title="Voltar para arquivados"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="relative">
                <button
                  onClick={() => viewMode === "active" && setIsPreferencesOpen(true)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 hover:scale-105 active:scale-95 cursor-pointer group/bot",
                    theme.iconBg
                  )}
                  title="Configurar Preferências da IA"
                >
                  <Bot className={cn("w-5 h-5 transition-colors duration-700 group-hover/bot:text-white", theme.primary)} />
                  {viewMode === "active" && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-[#1a1a1a] flex items-center justify-center">
                      <Settings className="w-1.5 h-1.5 text-black" />
                    </span>
                  )}
                </button>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {viewMode === "archived-detail" ? currentArchivedChatTitle : "Tec I.A"}
                </span>
                <span className={cn("text-xs transition-colors duration-700 flex items-center gap-1.5", theme.primary)}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Sempre online
                </span>
              </div>
            </div>
            {viewMode === "active" && (
              <div className="flex items-center gap-2">
                <HoverCard onOpenChange={(open) => open && fetchRecentArchives()}>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleViewArchives}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                      title="Ver chats arquivados"
                    >
                      <History className="w-5 h-5" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 bg-[#1a1a1a] border-white/10 text-white p-3 z-50">
                    <h4 className="text-xs font-semibold mb-2 text-white/90 uppercase tracking-wider">
                      Chats Recentes
                    </h4>
                    {isLoadingRecent ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                      </div>
                    ) : recentArchives.length === 0 ? (
                      <p className="text-xs text-white/50">Nenhum chat arquivado</p>
                    ) : (
                      <ul className="space-y-1">
                        {recentArchives.map((archive) => (
                          <li key={archive.id}>
                            <button
                              onClick={() => handleSelectArchive(archive.id)}
                              className="w-full text-left text-xs text-white/70 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded transition-colors truncate"
                            >
                              {archive.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </HoverCardContent>
                </HoverCard>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleArchive}
                  disabled={isArchiving || messages.filter(m => m.id !== "welcome").length === 0}
                  className="text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50"
                  title="Arquivar chat"
                >
                  {isArchiving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Archive className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGenerateMindmapFromChat}
                  disabled={isGeneratingMap || messages.length < 2}
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  title="Gerar Mapa Mental desta conversa"
                >
                  {isGeneratingMap ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="relative">
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                      </span>
                      <Network className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className={cn("flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-4 transition-colors duration-700", theme.bgFull)}>
            {isLoadingHistory && viewMode === "active" && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2.5 animate-fade-in",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-700",
                    theme.iconBg
                  )}
                >
                  {message.role === "user" ? (
                    <User className={cn("w-4 h-4 transition-colors duration-700", theme.primary)} />
                  ) : (
                    <Bot className={cn("w-4 h-4 transition-colors duration-700", theme.primary)} />
                  )}
                </div>

                {/* Message Bubble - Improved with basic Markdown rendering */}
                <div className="flex flex-col gap-1 max-w-[80%] md:max-w-[70%]">
                  <div
                    className={cn(
                      "rounded-xl px-3.5 py-2.5 shadow-sm transition-colors duration-700",
                      message.role === "user"
                        ? cn("rounded-tr-sm", theme.userBubble)
                        : "bg-[#2a2a2a] text-white/90 rounded-tl-sm border relative group"
                    )}
                    style={{ borderColor: message.role !== "user" ? theme.border : undefined }}
                  >
                    {message.role === "assistant" && (message.sources || message.usedMode) && (
                      <div className="absolute -top-3 -right-2 z-10 flex gap-1">
                        {/* Modo Badge */}
                        {message.usedMode && (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button className={cn(
                                "bg-[#0d0d0d] hover:bg-black/80 border text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors shadow-sm",
                                getModeConfig(message.usedMode).borderColor,
                                getModeConfig(message.usedMode).color
                              )}>
                                <Settings className="w-3 h-3" />
                                <span>Modo</span>
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-48 bg-[#1a1a1a] border-white/10 text-white p-3 z-50">
                              <h4 className="text-xs font-semibold mb-2 text-white/90 uppercase tracking-wider">Configuração Usada</h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/50">Modo:</span>
                                  <span className={cn("text-xs font-medium", getModeConfig(message.usedMode).color)}>
                                    {getModeConfig(message.usedMode).label.replace('Modelo ', '')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/50">Formato:</span>
                                  <span className="text-xs font-medium text-white/80">
                                    {message.usedFunction === 'table' ? '📊 Tabela' :
                                      message.usedFunction === 'list' ? '📋 Lista' : '📝 Normal'}
                                  </span>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        {/* Fontes Badge */}
                        {message.sources && (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button className="bg-[#0d0d0d] hover:bg-black/80 border border-white/10 text-[10px] text-white/60 hover:text-white px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors shadow-sm">
                                <BookOpen className="w-3 h-3" />
                                <span>Fontes</span>
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64 bg-[#1a1a1a] border-white/10 text-white p-3 z-50">
                              <h4 className="text-xs font-semibold mb-2 text-white/90 uppercase tracking-wider">Fontes Consultadas</h4>
                              <ul className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                                {message.sources.map((source, i) => (
                                  <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                                    <span className={cn("mt-0.5 transition-colors duration-700", theme.primary)}>•</span>
                                    <span className="break-words leading-tight">{source}</span>
                                  </li>
                                ))}
                              </ul>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                      </div>
                    )}
                    <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/10">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => <div className="overflow-x-auto my-4 rounded-lg border border-white/10"><table className="w-full text-sm text-left" {...props} /></div>,
                          thead: ({ node, ...props }) => <thead className="bg-white/5 text-white/90 uppercase text-xs" {...props} />,
                          tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/10" {...props} />,
                          tr: ({ node, ...props }) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
                          th: ({ node, ...props }) => <th className="px-4 py-3 font-medium border-b border-white/10" {...props} />,
                          td: ({ node, ...props }) => <td className="px-4 py-3 text-white/70" {...props} />,
                          p: ({ node, ...props }) => <div className="mb-2 last:mb-0" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 marker:text-white/40" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 marker:text-white/40" {...props} />,
                          li: ({ node, ...props }) => <li className="text-white/80" {...props} />,
                          strong: ({ node, ...props }) => (
                            <strong
                              className={cn(
                                "font-extrabold px-1 rounded-sm mx-0.5 transition-colors duration-700",
                                theme.primary,
                                theme.bgFull
                              )}
                              {...props}
                            />
                          ),
                          a: ({ node, ...props }) => (
                            <a
                              className={cn(
                                "font-medium underline underline-offset-4 decoration-2 transition-colors duration-700 hover:opacity-80",
                                theme.primary
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {removeImagesFromContent(message.content)}
                      </ReactMarkdown>

                      {/* Unified Media Gallery - Netflix Style */}
                      {(extractImagesFromContent(message.content).length > 0 ||
                        extractPDFsFromContent(message.content).length > 0 ||
                        extractYouTubeFromContent(message.content).length > 0) && (
                          <ChatMediaGallery
                            images={extractImagesFromContent(message.content)}
                            pdfs={extractPDFsFromContent(message.content)}
                            youtubeVideos={extractYouTubeFromContent(message.content)}
                          />
                        )}
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-white/30 block text-right">
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                  {message.role === 'assistant' && chatMode !== 'direct' && index > 0 && messages[index - 1]?.role === 'user' && (
                    <MessageFeedback
                      messageId={message.id}
                      messageContent={message.content}
                      queryContent={messages[index - 1]?.content || ""}
                      model={chatMode}
                    />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in pl-1">
                {/* Bot Avatar with Pulse */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-700 relative",
                  theme.iconBg
                )}>
                  <Bot className={cn("w-4 h-4 z-10", theme.primary)} />
                  <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", theme.bgColor)} />
                </div>

                {/* Loading State Container */}
                <div className="flex flex-col gap-2 min-w-[220px] max-w-[300px]">
                  {/* Text and Status */}
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-semibold animate-pulse", theme.primary)}>
                      {thinkingText}
                    </span>
                  </div>

                  {/* Modern Progress Bar */}
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                    {/* Animated Gradient Bar */}
                    <motion.div
                      className={cn("h-full absolute left-0 top-0 rounded-full", theme.bgColor)}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: 4.5,
                        ease: "easeInOut",
                        times: [0, 0.2, 0.5, 0.8, 1]
                      }}
                    >
                      {/* Shimmer Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-shimmer" />
                    </motion.div>
                  </div>

                  {/* Subtext info */}
                  <div className="flex justify-between items-center text-[10px] text-white/30 px-0.5">
                    <span>Processando</span>
                    <span>{getModeConfig(chatMode).label}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={cn("mt-auto border-t p-4 transition-colors duration-700", theme.border, theme.bg)}>
            {/* Suggestions removed from here and moved to footer */}

            <div className="flex flex-col gap-2">
              <div className="relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading}
                  className="bg-black/30 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/20 pr-24 h-12 rounded-xl"
                />

                {/* Right Actions */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <ChatImage
                    onImagesSelected={(files) => {
                      // Image handling
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={() => isLoading ? cancelMessage() : handleSendWrapper()}
                    disabled={(!input.trim() && !isLoading)}
                    className={cn(
                      "h-8 w-8 transition-all duration-300",
                      isLoading
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : cn("text-black", theme.primary === "text-primary" ? "bg-white hover:bg-white/90" : getModeConfig(chatMode).bgColor + " text-white hover:brightness-110")
                    )}
                  >
                    {isLoading ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <ChatModeSelector currentMode={chatMode} onModeChange={setChatMode} />
                  <ChatFunctionSelector currentFunction={functionMode} onFunctionChange={setFunctionMode} />

                  {/* Balloon Suggestions moved here */}
                  <div className="relative">
                    <ChatSuggestions onSelect={handleSuggestionClick} mode={chatMode} />
                  </div>
                </div>
                <p className="text-[10px] text-white/30 text-right flex-1 ml-4 self-center">
                  Tecfag I.A pode cometer erros. Considere verificar informações importantes.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Preferences Modal */}
      <AIPreferencesModal
        open={isPreferencesOpen}
        onOpenChange={setIsPreferencesOpen}
      />
    </AnimatePresence>
  );
};

export default ChatTab;
