import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useHeartbeat } from '@/hooks/useHeartbeat';

interface AccessGroup {
    id: string;
    name: string;
    canViewChat: boolean;
    canViewMindMap: boolean;
    canViewCatalog: boolean;
    canViewUsers: boolean;
    canViewMonitoring: boolean;
    canViewDocuments: boolean;
    canViewSettings: boolean;
    canViewNotifications: boolean;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    mustChangePassword?: boolean;
    accessGroup?: AccessGroup | null;
    // Permission Overrides
    canViewChat?: boolean | null;
    canViewMindMap?: boolean | null;
    canViewCatalog?: boolean | null;
    canViewUsers?: boolean | null;
    canViewMonitoring?: boolean | null;
    canViewDocuments?: boolean | null;
    canViewSettings?: boolean | null;
    canViewNotifications?: boolean | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAdmin: boolean;
    showWelcomeAnimation: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    hideWelcomeAnimation: () => void;
    refreshUser: () => Promise<void>;
    // Permission checks based on access group
    canView: (module: 'chat' | 'mindmap' | 'catalog' | 'users' | 'monitoring' | 'documents' | 'settings') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);

    // Start heartbeat for online status tracking
    useHeartbeat(!!user);

    // Check for existing token on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
            setToken(savedToken);
            fetchCurrentUser(savedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchCurrentUser = async (authToken: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                // Token invalid, clear it
                localStorage.removeItem('auth_token');
                setToken(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            localStorage.removeItem('auth_token');
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao fazer login');
        }

        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowWelcomeAnimation(true);
    }, []);

    const register = useCallback(async (email: string, password: string, name: string) => {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar conta');
        }

        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowWelcomeAnimation(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setShowWelcomeAnimation(false);
    }, []);

    const hideWelcomeAnimation = useCallback(() => {
        setShowWelcomeAnimation(false);
    }, []);

    const refreshUser = useCallback(async () => {
        if (token) {
            await fetchCurrentUser(token);
        }
    }, [token]);

    // Check if user can view a specific module based on role and access group
    const canView = useCallback((module: 'chat' | 'mindmap' | 'catalog' | 'users' | 'monitoring' | 'documents' | 'settings'): boolean => {
        if (!user) return false;

        // Map module to permission key
        const permissionMap: Record<string, keyof AccessGroup> = {
            'chat': 'canViewChat',
            'mindmap': 'canViewMindMap',
            'catalog': 'canViewCatalog',
            'users': 'canViewUsers',
            'monitoring': 'canViewMonitoring',
            'documents': 'canViewDocuments',
            'settings': 'canViewSettings',
            'notifications': 'canViewNotifications'
        };

        const permissionKey = permissionMap[module];
        if (!permissionKey) return false;

        // 1. User Override (Highest Priority)
        // Checks specific true/false setting on user profile
        const userOverride = (user as any)[permissionKey];
        if (userOverride !== null && userOverride !== undefined) {
            return Boolean(userOverride);
        }

        // 2. Access Group (Medium Priority)
        // If user is in a group, use the group's setting.
        // This means even Admins in a group will respect the group's limits (unless overridden by #1).
        if (user.accessGroup && user.accessGroup[permissionKey] !== undefined) {
            return Boolean(user.accessGroup[permissionKey]);
        }

        // 3. Admin Fallback (Lowest Priority)
        // If no overrides and no group settings, Admins see everything.
        if (user.role === 'ADMIN') {
            return true;
        }

        // 4. Default for Standard Users (No group, no override)
        // Basic modules only
        if (!user.accessGroup) {
            return ['chat', 'mindmap', 'catalog'].includes(module);
        }

        return false;

        return false;
    }, [user]);

    const value = {
        user,
        token,
        isLoading,
        isAdmin: user?.role === 'ADMIN',
        showWelcomeAnimation,
        login,
        register,
        logout,
        hideWelcomeAnimation,
        refreshUser,
        canView,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
