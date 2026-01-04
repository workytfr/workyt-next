"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
    _id: string;
    type: 'forum_answer' | 'fiche_comment' | 'answer_liked' | 'comment_liked';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    sender: {
        username: string;
    };
}

interface NotificationData {
    notifications: Notification[];
    totalCount: number;
    unreadCount: number;
}

export default function NotificationBell() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<NotificationData | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Récupération des notifications
    const fetchNotifications = useCallback(async () => {
        if (!session?.accessToken) return;

        try {
            const response = await fetch('/api/notifications?limit=10', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
        }
    }, [session?.accessToken]);

    // Marquer une notification comme lue
    const markAsRead = async (notificationId: string) => {
        if (!session?.accessToken) return;

        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (response.ok) {
                // Mettre à jour l'état local
                setNotifications(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        notifications: prev.notifications.map(notif =>
                            notif._id === notificationId
                                ? { ...notif, isRead: true }
                                : notif
                        ),
                        unreadCount: Math.max(0, prev.unreadCount - 1)
                    };
                });
            }
        } catch (error) {
            console.error('Erreur lors du marquage de la notification:', error);
        }
    };

    // Marquer toutes les notifications comme lues
    const markAllAsRead = async () => {
        if (!session?.accessToken || loading) return;

        setLoading(true);
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (response.ok) {
                setNotifications(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        notifications: prev.notifications.map(notif => ({
                            ...notif,
                            isRead: true
                        })),
                        unreadCount: 0
                    };
                });
            }
        } catch (error) {
            console.error('Erreur lors du marquage de toutes les notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Supprimer une notification
    const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Empêcher le clic de déclencher le marquage comme lu
        
        if (!session?.accessToken) return;

        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (response.ok) {
                // Mettre à jour l'état local
                setNotifications(prev => {
                    if (!prev) return prev;
                    const filteredNotifications = prev.notifications.filter(
                        notif => notif._id !== notificationId
                    );
                    const deletedNotif = prev.notifications.find(
                        notif => notif._id === notificationId
                    );
                    return {
                        ...prev,
                        notifications: filteredNotifications,
                        totalCount: prev.totalCount - 1,
                        unreadCount: deletedNotif && !deletedNotif.isRead 
                            ? Math.max(0, prev.unreadCount - 1) 
                            : prev.unreadCount
                    };
                });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la notification:', error);
        }
    };

    // Récupération initiale des notifications
    useEffect(() => {
        if (session?.accessToken) {
            fetchNotifications();
        }
    }, [session?.accessToken, fetchNotifications]);

    // Polling toutes les 30 secondes
    useEffect(() => {
        if (!session?.accessToken) return;

        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [session?.accessToken, fetchNotifications]);

    // Formatage du type de notification
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'forum_answer':
                return '💬';
            case 'fiche_comment':
                return '📝';
            case 'answer_liked':
                return '👍';
            case 'comment_liked':
                return '❤️';
            default:
                return '🔔';
        }
    };

    if (!session) return null;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                    {(notifications?.unreadCount ?? 0) > 0 ? (
                        <BellRing className="h-5 w-5" />
                    ) : (
                        <Bell className="h-5 w-5" />
                    )}
                    {(notifications?.unreadCount ?? 0) > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {(notifications?.unreadCount ?? 0) > 9 ? '9+' : notifications?.unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2">
                    <h3 className="font-semibold">Notifications</h3>
                    {(notifications?.unreadCount ?? 0) > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            disabled={loading}
                            className="text-xs"
                        >
                            {loading ? '...' : 'Tout marquer comme lu'}
                        </Button>
                    )}
                </div>
                
                <DropdownMenuSeparator />
                
                <div className="max-h-96 overflow-y-auto">
                    {notifications?.notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            Aucune notification
                        </div>
                    ) : (
                        notifications?.notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification._id}
                                className={`p-3 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                onClick={() => markAsRead(notification._id)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                <div className="flex items-start space-x-3 w-full">
                                    <span className="text-lg">
                                        {getNotificationIcon(notification.type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                                locale: fr
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                                        )}
                                        <button
                                            onClick={(e) => deleteNotification(notification._id, e)}
                                            className="p-1 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-600"
                                            title="Supprimer la notification"
                                            aria-label="Supprimer la notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
