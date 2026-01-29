import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/lib/api';

export const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const fetchUnreadCount = async () => {
        try {
            const { count } = await notificationsApi.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Poll every 60 seconds
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleClick = () => {
        // Dispatch event to switch to settings tab in Index.tsx
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'settings' }));

        // Pequeno delay para garantir que a aba mudou antes de selecionar a sub-aba
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('change-settings-tab', { detail: 'notifications' }));
        }, 100);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative mr-2 text-muted-foreground hover:text-foreground"
            onClick={handleClick}
            title="Notificações"
        >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background animate-pulse" />
            )}
        </Button>
    );
};
