export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper to get auth headers
export const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// Generic fetch wrapper with error handling
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro de conexão' }));
        throw new Error(error.error || 'Erro na requisição');
    }

    return response.json();
}

// ============ MACHINES API ============

export interface Machine {
    id: string;
    name: string;
    category: string;
    capacity: string;
    model: string;
    price: string;
    maintenanceStatus: 'ok' | 'attention' | 'critical';
    lastMaintenance: string;
    specifications: string[];
}

export interface MachinesFilter {
    search?: string;
    category?: string;
    status?: string;
}

export const machinesApi = {
    getAll: (filters?: MachinesFilter) => {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.status) params.append('status', filters.status);
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiFetch<Machine[]>(`/api/machines${query}`);
    },

    getById: (id: string) => apiFetch<Machine>(`/api/machines/${id}`),

    getCategories: () => apiFetch<string[]>('/api/machines/meta/categories'),

    create: (machine: Omit<Machine, 'id'>) =>
        apiFetch<Machine>('/api/machines', {
            method: 'POST',
            body: JSON.stringify(machine),
        }),

    update: (id: string, machine: Partial<Machine>) =>
        apiFetch<Machine>(`/api/machines/${id}`, {
            method: 'PUT',
            body: JSON.stringify(machine),
        }),

    delete: (id: string) =>
        apiFetch<{ message: string }>(`/api/machines/${id}`, {
            method: 'DELETE',
        }),
};

// ============ MINDMAPS API ============

export interface MindMapNode {
    id: string;
    label: string;
    type: 'machine' | 'process' | 'parameter';
    x: number;
    y: number;
    connections: string[];
}

export interface MindMap {
    id: string;
    name: string;
    nodes: MindMapNode[];
    createdAt?: string;
    updatedAt?: string;
}

export const mindmapsApi = {
    getAll: () => apiFetch<MindMap[]>('/api/mindmaps'),

    getById: (id: string) => apiFetch<MindMap>(`/api/mindmaps/${id}`),

    create: (mindmap: { name: string; nodes: MindMapNode[] }) =>
        apiFetch<MindMap>('/api/mindmaps', {
            method: 'POST',
            body: JSON.stringify(mindmap),
        }),

    generate: (documentId: string, topic: string) =>
        apiFetch<{ id: string; name: string; nodes: MindMapNode[] }>('/api/mindmaps/generate', {
            method: 'POST',
            body: JSON.stringify({ documentId, topic }),
        }),

    generateFromChat: (context: string, topic: string) =>
        apiFetch<{ id: string; name: string; nodes: MindMapNode[] }>('/api/mindmaps/generate-from-chat', {
            method: 'POST',
            body: JSON.stringify({ context, topic }),
        }),

    update: (id: string, mindmap: Partial<{ name: string; nodes: MindMapNode[] }>) =>
        apiFetch<MindMap>(`/api/mindmaps/${id}`, {
            method: 'PUT',
            body: JSON.stringify(mindmap),
        }),

    delete: (id: string) =>
        apiFetch<{ message: string }>(`/api/mindmaps/${id}`, {
            method: 'DELETE',
        }),
};

// ============ MINDMAP METADATA (LOCAL) ============
// Stores category, approval, and sharing info in localStorage
// until the backend supports these fields natively.

const MINDMAP_META_KEY = 'mindmap-metadata-v1';

export type MindMapCategory = 'meus-mapas' | 'mapas-sistema' | 'mapas-aprovados' | 'modelos-prontos' | 'compartilhados';

export interface MindMapMeta {
    category: MindMapCategory;
    isApproved: boolean;
    sharedWith: string[]; // user IDs
    ownerId: string;
    ownerName: string;
}

// Get all metadata records
export const getAllMindMapMeta = (): Record<string, MindMapMeta> => {
    try {
        const raw = localStorage.getItem(MINDMAP_META_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
};

// Get metadata for a single map
export const getMindMapMeta = (mapId: string): MindMapMeta | null => {
    return getAllMindMapMeta()[mapId] || null;
};

// Set/update metadata for a single map
export const setMindMapMeta = (mapId: string, meta: Partial<MindMapMeta>) => {
    const all = getAllMindMapMeta();
    all[mapId] = { ...(all[mapId] || { category: 'meus-mapas', isApproved: false, sharedWith: [], ownerId: '', ownerName: '' }), ...meta };
    localStorage.setItem(MINDMAP_META_KEY, JSON.stringify(all));
};

// Remove metadata for a map (on delete)
export const removeMindMapMeta = (mapId: string) => {
    const all = getAllMindMapMeta();
    delete all[mapId];
    localStorage.setItem(MINDMAP_META_KEY, JSON.stringify(all));
};

// ============ CHAT API ============

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

export interface ChatResponse {
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
}

export interface ChatHistoryResponse {
    messages: ChatMessage[];
    total: number;
    limit: number;
    offset: number;
}

export interface ArchivedChatSummary {
    id: string;
    title: string;
    messagesCount: number;
    createdAt: string;
    archivedAt: string;
    folderId: string | null;
    isPinned: boolean;
}

export interface ArchivedChatDetail extends ArchivedChatSummary {
    messages: ChatMessage[];
}

export interface ArchivedChatsResponse {
    archives: ArchivedChatSummary[];
}

export interface ChatFolder {
    id: string;
    name: string;
    isDefault: boolean;
    order: number;
    chatCount: number;
    createdAt: string;
}

export interface FoldersResponse {
    folders: ChatFolder[];
}

export const chatApi = {
    sendMessage: (content: string) =>
        apiFetch<ChatResponse>('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),

    getHistory: (limit = 50, offset = 0) =>
        apiFetch<ChatHistoryResponse>(`/api/chat/history?limit=${limit}&offset=${offset}`),

    clearHistory: () =>
        apiFetch<{ message: string }>('/api/chat/history', {
            method: 'DELETE',
        }),

    archiveChat: (title?: string) =>
        apiFetch<ArchivedChatSummary>('/api/chat/archive', {
            method: 'POST',
            body: JSON.stringify({ title }),
        }),

    getArchivedChats: () =>
        apiFetch<ArchivedChatsResponse>('/api/chat/archives'),

    getArchivedChat: (id: string) =>
        apiFetch<ArchivedChatDetail>(`/api/chat/archives/${id}`),

    deleteArchivedChat: (id: string) =>
        apiFetch<{ message: string }>(`/api/chat/archives/${id}`, {
            method: 'DELETE',
        }),

    restoreArchivedChat: (id: string) =>
        apiFetch<{ message: string }>(`/api/chat/archives/${id}/restore`, {
            method: 'POST',
        }),

    // Folder management
    createFolder: (name: string) =>
        apiFetch<ChatFolder>('/api/chat/folders', {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),

    getFolders: () =>
        apiFetch<FoldersResponse>('/api/chat/folders'),

    renameFolder: (id: string, name: string) =>
        apiFetch<ChatFolder>(`/api/chat/folders/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name }),
        }),

    deleteFolder: (id: string) =>
        apiFetch<{ message: string }>(`/api/chat/folders/${id}`, {
            method: 'DELETE',
        }),

    // Chat operations
    renameChat: (id: string, title: string) =>
        apiFetch<ArchivedChatSummary>(`/api/chat/archives/${id}/rename`, {
            method: 'PUT',
            body: JSON.stringify({ title }),
        }),

    moveChat: (id: string, folderId: string | null) =>
        apiFetch<{ id: string; folderId: string | null; isPinned: boolean }>(`/api/chat/archives/${id}/move`, {
            method: 'PUT',
            body: JSON.stringify({ folderId }),
        }),

    pinChat: (id: string, isPinned: boolean) =>
        apiFetch<{ id: string; isPinned: boolean; folderId: string | null }>(`/api/chat/archives/${id}/pin`, {
            method: 'PUT',
            body: JSON.stringify({ isPinned }),
        }),

    // RAG AI endpoints
    sendMessageRAG: (content: string, catalogId?: string, mode?: string, isTableMode?: boolean, signal?: AbortSignal, isAttachmentMode?: boolean) =>
        apiFetch<ChatResponse & { sources?: Array<{ fileName: string; chunkIndex: number; similarity: number }> }>('/api/chat/rag', {
            method: 'POST',
            body: JSON.stringify({ content, catalogId, mode, isTableMode, isAttachmentMode }),
            signal,
        }),

    getSuggestions: (catalogId?: string) =>
        apiFetch<{ suggestions: string[] }>(`/api/chat/suggestions${catalogId ? `?catalogId=${catalogId}` : ''}`),

    // Streaming RAG endpoint
    sendMessageRAGStream: async (
        content: string,
        catalogId: string | undefined,
        mode: string | undefined,
        isTableMode: boolean | undefined,
        onChunk: (text: string) => void,
        onUserMessageId: (id: string) => void,
        onDone: (assistantMessageId: string, sources: Array<{ fileName: string; chunkIndex: number; similarity: number }>) => void,
        onError: (error: string) => void,
        signal?: AbortSignal,
        isAttachmentMode?: boolean
    ) => {
        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch(`${API_URL}/api/chat/rag/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ content, catalogId, mode, isTableMode, isAttachmentMode }),
                signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro de conexão' }));
                throw new Error(errorData.error || 'Erro na requisição');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Stream not supported');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));


                            if (data.type === 'chunk') {

                                onChunk(data.content);
                            } else if (data.type === 'user_message') {
                                onUserMessageId(data.id);
                            } else if (data.type === 'done') {

                                onDone(data.assistantMessageId, data.sources || []);
                            } else if (data.type === 'error') {
                                onError(data.content);
                            }
                        } catch (e) {
                            // Skip malformed JSON
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error; // Re-throw abort errors for proper handling
            }
            onError(error.message || 'Erro ao processar streaming');
        }
    },
};

// ============ AUTH API ============

export const authApi = {
    heartbeat: () =>
        apiFetch<{ success: boolean }>('/api/auth/heartbeat', {
            method: 'PUT',
        }),

    updateProfile: (data: { name?: string; jobTitle?: string; department?: string; technicalLevel?: string; communicationStyle?: string }) =>
        apiFetch<{ user: any }>('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

// ============ MONITORING API ============

export interface UserStatus {
    id: string;
    name: string;
    email: string;
    role: string;
    isOnline: boolean;
    lastActive: string;
    createdAt: string;
}

export interface UserArchivedChatsGroup {
    userId: string;
    userName: string;
    userEmail: string;
    archives: ArchivedChatSummary[];
}

export interface QuestionStatistics {
    totalQuestions: number;
    mostAskedQuestions: { question: string; count: number }[];
    questionsByUser: { userId: string; userName: string; count: number }[];
}

export interface TokenUsageByUser {
    userId: string;
    userName: string;
    userEmail: string;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCost: number;
}

export interface TokenCostSettings {
    id: string;
    inputCostPer1M: number;
    outputCostPer1M: number;
    currency: string;
}

export interface CostsData {
    usageByUser: TokenUsageByUser[];
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCost: number;
    currency: string;
}

export const monitoringApi = {
    getUsersStatus: () =>
        apiFetch<{ users: UserStatus[] }>('/api/monitoring/users'),

    getArchivedChatsByUser: () =>
        apiFetch<{ groups: UserArchivedChatsGroup[] }>('/api/monitoring/archived-chats'),

    getStatistics: () =>
        apiFetch<QuestionStatistics>('/api/monitoring/statistics'),

    getTokenUsage: () =>
        apiFetch<CostsData>('/api/monitoring/token-usage'),

    getTokenCostSettings: () =>
        apiFetch<TokenCostSettings>('/api/monitoring/token-cost-settings'),

    updateTokenCostSettings: (data: { inputCostPer1M: number; outputCostPer1M: number; currency?: string }) =>
        apiFetch<TokenCostSettings>('/api/monitoring/token-cost-settings', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// ============ DOCUMENTS API ============

export interface Document {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    indexed: boolean;
    processingProgress: number;
    processingError?: string | null;
    chunkCount?: number | null;
    totalTokens?: number | null;
    uploadedAt: string;
    indexedAt?: string | null;
    folderId?: string | null;
    catalogItem?: {
        code: string;
        name: string;
        category: string;
    } | null;
}

export interface DocumentFolder {
    id: string;
    name: string;
    order: number;
    parentId: string | null;
    documentCount: number;
    childrenCount: number;
    createdAt: string;
}

export interface DocumentFoldersResponse {
    folders: DocumentFolder[];
}

export const documentsApi = {
    getAll: () => apiFetch<Document[]>('/api/documents/all'),

    delete: (id: string) =>
        apiFetch<{ success: boolean; message: string }>(`/api/documents/${id}`, {
            method: 'DELETE',
        }),

    reindex: (id: string) =>
        apiFetch<{ success: boolean; message: string }>(`/api/documents/${id}/reindex`, {
            method: 'POST',
        }),

    getStatus: (id: string) =>
        apiFetch<{
            id: string;
            indexed: boolean;
            processingProgress: number;
            processingError?: string | null;
            chunkCount?: number | null;
            totalTokens?: number | null;
        }>(`/api/documents/${id}/status`),

    // Folder management
    createFolder: (name: string, parentId?: string) =>
        apiFetch<DocumentFolder>('/api/documents/folders', {
            method: 'POST',
            body: JSON.stringify({ name, parentId }),
        }),

    getFolders: () =>
        apiFetch<DocumentFoldersResponse>('/api/documents/folders'),

    renameFolder: (id: string, name: string) =>
        apiFetch<DocumentFolder>(`/api/documents/folders/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name }),
        }),

    deleteFolder: (id: string) =>
        apiFetch<{ success: boolean; message: string }>(`/api/documents/folders/${id}`, {
            method: 'DELETE',
        }),

    moveDocument: (documentId: string, folderId: string | null) =>
        apiFetch<{ id: string; folderId: string | null }>(`/api/documents/${documentId}/move`, {
            method: 'PUT',
            body: JSON.stringify({ folderId }),
        }),
};

// ============ ACCESS GROUPS API ============

export interface AccessGroup {
    id: string;
    name: string;
    description?: string | null;
    // Permissões de visualização
    canViewChat: boolean;
    canViewMindMap: boolean;
    canViewCatalog: boolean;
    canViewUsers: boolean;
    canViewMonitoring: boolean;
    canViewDocuments: boolean;
    canViewSettings: boolean;
    canViewNotifications: boolean;
    // Permissões de ação - Mapa Mental
    canCreateMindMap: boolean;
    canEditMindMap: boolean;
    canDeleteMindMap: boolean;
    // Permissões de ação - Catálogo
    canCreateCatalog: boolean;
    canEditCatalog: boolean;
    canDeleteCatalog: boolean;
    // Permissões de ação - Usuários
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    // Permissões de ação - Documentos
    canUploadDocuments: boolean;
    canEditDocuments: boolean;
    canDeleteDocuments: boolean;
    // Permissões de ação - Chat
    canArchiveChat: boolean;
    canDeleteChatHistory: boolean;
    // Permissões de ação - Notificações
    canDeleteNotifications: boolean;
    // Permissões de administração
    canManageAccessGroups: boolean;
    canManageBackups: boolean;
    canViewTokenCosts: boolean;
    // Metadados
    userCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface AccessGroupDetail extends AccessGroup {
    users: {
        id: string;
        name: string;
        email: string;
        role: string;
    }[];
}

export interface AvailableUser {
    id: string;
    name: string;
    email: string;
    role: string;
    accessGroupId: string | null;
    accessGroup: {
        id: string;
        name: string;
    } | null;
}

// Tipo para dados de criação/atualização de grupo (todos os campos de permissão são opcionais)
export type AccessGroupCreateData = {
    name: string;
    description?: string;
    [key: string]: boolean | string | undefined;
};

export type AccessGroupUpdateData = {
    name?: string;
    description?: string | null;
    [key: string]: boolean | string | null | undefined;
};

export const accessGroupsApi = {
    getAll: () =>
        apiFetch<{ groups: AccessGroup[] }>('/api/access-groups'),

    getById: (id: string) =>
        apiFetch<{ group: AccessGroupDetail }>(`/api/access-groups/${id}`),

    create: (data: AccessGroupCreateData) =>
        apiFetch<{ group: AccessGroup }>('/api/access-groups', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: AccessGroupUpdateData) =>
        apiFetch<{ group: AccessGroup }>(`/api/access-groups/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiFetch<{ message: string }>(`/api/access-groups/${id}`, {
            method: 'DELETE',
        }),

    updateUsers: (id: string, userIds: string[]) =>
        apiFetch<{ group: AccessGroupDetail }>(`/api/access-groups/${id}/users`, {
            method: 'PUT',
            body: JSON.stringify({ userIds }),
        }),

    getAvailableUsers: () =>
        apiFetch<{ users: AvailableUser[] }>('/api/access-groups/meta/available-users'),
};

// ============ FEEDBACK API ============

export interface FeedbackData {
    messageId?: string;
    messageContent: string;
    queryContent: string;
    rating: 'positive' | 'negative';
    category?: string;
    comment?: string;
    model?: string;
    catalogId?: string;
}

export interface FeedbackStats {
    total: number;
    totalPositive: number;
    totalNegative: number;
    satisfactionRate: string;
    categoryBreakdown: {
        category: string;
        count: number;
    }[];
}

export interface Feedback {
    id: string;
    rating: string;
    category: string | null;
    comment: string | null;
    queryContent: string;
    messageContent: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
}

export const feedbackApi = {
    submit: (data: FeedbackData) =>
        apiFetch<{ success: boolean; feedback: Feedback }>('/api/feedback', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getStats: () =>
        apiFetch<FeedbackStats>('/api/feedback/stats'),

    getRecent: (limit?: number, rating?: 'positive' | 'negative') => {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (rating) params.append('rating', rating);
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiFetch<{ feedbacks: Feedback[] }>(`/api/feedback/recent${query}`);
    },
};

// ============ BACKUP API ============

export interface BackupInfo {
    name: string;
    date: string;
    sizeMB: string;
}

export interface BackupStatus {
    totalBackups: number;
    totalSizeMB: string;
    lastBackup: BackupInfo | null;
    oldestBackup: BackupInfo | null;
    isIntegrity: boolean;
    integrityDetails: string;
    settings: {
        maxBackups: number;
        intervalHours: number;
        nextScheduledBackup: string | null;
    };
}

export interface BackupSettings {
    maxBackups: number;
    intervalHours: number;
    nextScheduledBackup: string | null;
}

const API_URL_BASE = API_URL;

export const backupApi = {
    list: () =>
        apiFetch<{ backups: BackupInfo[] }>('/api/backup/list'),

    create: (reason?: string) =>
        apiFetch<{ message: string; backup: BackupInfo }>('/api/backup/create', {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }),

    restore: (name: string) =>
        apiFetch<{ message: string; requiresRestart: boolean }>(`/api/backup/restore/${encodeURIComponent(name)}`, {
            method: 'POST',
        }),

    delete: (name: string) =>
        apiFetch<{ message: string }>(`/api/backup/${encodeURIComponent(name)}`, {
            method: 'DELETE',
        }),

    getStatus: () =>
        apiFetch<BackupStatus>('/api/backup/status'),

    checkIntegrity: () =>
        apiFetch<{ isOk: boolean; details: string }>('/api/backup/integrity'),

    getSettings: () =>
        apiFetch<BackupSettings>('/api/backup/settings'),

    updateSettings: (settings: Partial<{ maxBackups: number; intervalHours: number }>) =>
        apiFetch<{ message: string; settings: BackupSettings }>('/api/backup/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        }),

    getDownloadUrl: (name: string) =>
        `${API_URL_BASE}/api/backup/download/${encodeURIComponent(name)}`,
};

// ============ NOTIFICATIONS API ============

export interface NotificationType {
    id: string;
    type: string;
    category: string;
    title: string;
    message: string;
    metadata: string | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationSettings {
    id: string;
    systemAlerts: boolean;
    userAlerts: boolean;
    documentAlerts: boolean;
    chatAlerts: boolean;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    frequency: string;
    quietHoursEnabled: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
}

export const notificationsApi = {
    getAll: (limit = 50, offset = 0, unreadOnly = false) => {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        if (unreadOnly) params.append('unreadOnly', 'true');
        return apiFetch<{ notifications: NotificationType[]; total: number; limit: number; offset: number }>(
            `/api/notifications?${params.toString()}`
        );
    },

    getUnreadCount: () =>
        apiFetch<{ count: number }>('/api/notifications/unread-count'),

    getSettings: () =>
        apiFetch<{ settings: NotificationSettings }>('/api/notifications/settings'),

    updateSettings: (settings: Partial<NotificationSettings>) =>
        apiFetch<{ settings: NotificationSettings }>('/api/notifications/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        }),

    markAsRead: (id: string) =>
        apiFetch<{ notification: NotificationType }>(`/api/notifications/${id}/read`, {
            method: 'PUT',
        }),

    markAllAsRead: () =>
        apiFetch<{ message: string; count: number }>('/api/notifications/read-all', {
            method: 'PUT',
        }),

    delete: (id: string) =>
        apiFetch<{ message: string }>(`/api/notifications/${id}`, {
            method: 'DELETE',
        }),

    clearAll: () =>
        apiFetch<{ message: string; count: number }>('/api/notifications/clear', {
            method: 'DELETE',
        }),

    createTest: (data?: { type?: string; category?: string; title?: string; message?: string }) =>
        apiFetch<{ notification: NotificationType }>('/api/notifications/test', {
            method: 'POST',
            body: JSON.stringify(data || {}),
        }),
};
