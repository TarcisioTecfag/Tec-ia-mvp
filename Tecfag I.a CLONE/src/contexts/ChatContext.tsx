import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { chatApi } from "@/lib/api";
import { useChatSound } from "@/hooks/useSound";
import { toast } from "sonner";
import { ChatMode } from "@/components/chat/ChatModeSelector";
import { ChatFunction } from "@/components/chat/ChatFunctionSelector";

// Storage keys
const CHAT_MODE_KEY = "tecfag_chat_mode";
const CHAT_FUNCTION_KEY = "tecfag_chat_function";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
    sources?: string[];
    usedMode?: ChatMode;
    usedFunction?: ChatFunction;
    isTableMode?: boolean;
    isAttachmentMode?: boolean;
}

interface ChatContextType {
    messages: Message[];
    input: string;
    isLoading: boolean;
    chatMode: ChatMode;
    functionMode: ChatFunction;
    isChatVisible: boolean;
    historyLoaded: boolean;

    setInput: (value: string) => void;
    setChatMode: (mode: ChatMode) => void;
    setFunctionMode: (mode: ChatFunction) => void;
    setIsChatVisible: (visible: boolean) => void;
    setHistoryLoaded: (loaded: boolean) => void;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;

    sendMessage: (customContent?: string) => Promise<void>;
    cancelMessage: () => void;
    clearMessages: () => void; // Effectively "New Chat" logic
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const { playSend, playReceive, startThinking, stopThinking } = useChatSound();

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    // Persistent State
    const [chatMode, setChatMode] = useState<ChatMode>(() => {
        const saved = localStorage.getItem(CHAT_MODE_KEY);
        return (saved as ChatMode) || "professional";
    });

    const [functionMode, setFunctionMode] = useState<ChatFunction>(() => {
        const saved = localStorage.getItem(CHAT_FUNCTION_KEY);
        return (saved as ChatFunction) || "normal";
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem(CHAT_MODE_KEY, chatMode);
    }, [chatMode]);

    useEffect(() => {
        localStorage.setItem(CHAT_FUNCTION_KEY, functionMode);
    }, [functionMode]);

    // Initial History Load - Logic moved slightly to ensure it happens once
    // Note: Original component re-loaded history on mount. Since this is global, 
    // we might want it to load once.
    // We'll leave the initial history loading to the consuming component (ChatTab) 
    // or do it here. Doing it here ensures it's ready.
    // However, Original ChatTab had `shouldLoadHistory`.
    // Let's implement a `loadHistory` function exposed to context if needed, 
    // OR just load it once on mount of Provider.

    // For now, let's keep message state management basic. 
    // If `messages` is empty, we might initialize with welcome message.
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: getWelcomeMessage(chatMode),
                timestamp: formatTime(new Date())
            }]);
        } else if (messages.length === 1 && messages[0].id === "welcome") {
            // Update welcome message if mode changes
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: getWelcomeMessage(chatMode),
                timestamp: formatTime(new Date())
            }]);
        }
    }, [chatMode]);


    const cancelMessage = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    // Use a ref to track visibility synchronously accessing the latest value in async callbacks
    const isChatVisibleRef = useRef(isChatVisible);

    useEffect(() => {
        isChatVisibleRef.current = isChatVisible;
    }, [isChatVisible]);

    const sendMessage = useCallback(async (customContent?: string) => {
        const contentToSend = customContent || input.trim();
        if (!contentToSend || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: contentToSend,
            timestamp: formatTime(new Date()),
        };

        setMessages((prev) => [...prev, userMessage]);
        if (!customContent) setInput("");
        setIsLoading(true);
        playSend();
        startThinking();

        abortControllerRef.current = new AbortController();

        try {
            let finalInput = contentToSend;
            if (functionMode === 'list') {
                finalInput += "\n\nPor favor, forneça a resposta em formato de lista estruturada.";
            }

            const response = await chatApi.sendMessageRAG(
                finalInput,
                undefined,
                chatMode,
                functionMode === 'table',
                abortControllerRef.current.signal,
                functionMode === 'attachment'
            );

            stopThinking();
            // Always play receive sound
            playReceive();

            // Notification only if NOT visible
            if (!isChatVisibleRef.current) {
                // Play a distinct notification sound if available, otherwise playReceive is enough
                // but we might want to ensure the user hears it even if they are elsewhere.
                // playReceive() uses useSound which typically plays audio.

                toast.success("A I.A terminou de pensar!", {
                    description: "Sua resposta está pronta no chat.",
                    action: {
                        label: "Ver",
                        onClick: () => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'chat' }))
                    }
                });
            }

            // Update user message with real ID
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === userMessage.id
                        ? { ...m, id: response.userMessage.id }
                        : m
                )
            );

            const sources = response.sources?.map((s: any) => s.fileName) || [];
            const aiMessage: Message = {
                id: response.assistantMessage.id,
                role: "assistant",
                content: response.assistantMessage.content,
                timestamp: formatTime(new Date()),
                sources: sources.length > 0 ? sources : undefined,
                usedMode: chatMode,
                isTableMode: functionMode === 'table',
                isAttachmentMode: functionMode === 'attachment',
                usedFunction: functionMode,
            };

            setMessages((prev) => [...prev, aiMessage]);

        } catch (error: any) {
            stopThinking();

            if (error?.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
                console.log("Request cancelled by user");
                setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "⏹️ Resposta cancelada pelo usuário.",
                    timestamp: formatTime(new Date()),
                }]);
            } else {
                console.error("Chat error:", error);
                setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
                    timestamp: formatTime(new Date()),
                }]);
            }
        } finally {
            setIsLoading(false);
            stopThinking();
            abortControllerRef.current = null;
        }
    }, [input, isLoading, chatMode, functionMode, playSend, playReceive, startThinking, stopThinking]);

    const clearMessages = useCallback(() => {
        // Don't load history for new chat
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content: getWelcomeMessage(chatMode),
                timestamp: formatTime(new Date()),
            },
        ]);
    }, [chatMode]);

    return (
        <ChatContext.Provider
            value={{
                messages,
                input,
                isLoading,
                chatMode,
                functionMode,
                isChatVisible,
                historyLoaded,
                setInput,
                setChatMode,
                setFunctionMode,
                setIsChatVisible,
                setHistoryLoaded,
                setMessages,
                sendMessage,
                cancelMessage,
                clearMessages,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};
