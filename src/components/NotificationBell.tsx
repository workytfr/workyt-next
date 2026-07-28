"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellRing, Trash2, LayoutGrid } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    getNotificationStyle,
    getNotificationLink,
    NOTIFICATION_CATEGORIES,
    type NotificationCategory
} from '@/lib/notificationTypes';

interface Notification {
    _id: string;
    /** Voir l'enum de src/models/Notification.ts — le style est résolu par getNotificationStyle */
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedEntity?: {
        type?: string;
        id?: string;
    };
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
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationData | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<NotificationCategory | null>(null);
    const bellRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

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

    /**
     * Clic sur une notification : on la marque lue ET on va sur l'élément
     * concerné quand il a une page. Le marquage ne bloque pas la navigation.
     */
    const openNotification = (notification: Notification) => {
        if (!notification.isRead) markAsRead(notification._id);

        const href = getNotificationLink(notification.relatedEntity);
        if (href) {
            setIsOpen(false);
            router.push(href);
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
        e.stopPropagation();

        if (!session?.accessToken) return;

        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (response.ok) {
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

    // Polling toutes les 30 secondes — suspendu quand l'onglet est en
    // arrière-plan. La cloche est montée sur toutes les pages : sans ça, un
    // onglet oublié interroge le serveur 2 fois par minute indéfiniment.
    useEffect(() => {
        if (!session?.accessToken) return;

        let interval: ReturnType<typeof setInterval> | null = null;
        const start = () => {
            if (interval) return;
            interval = setInterval(fetchNotifications, 30000);
        };
        const stop = () => {
            if (!interval) return;
            clearInterval(interval);
            interval = null;
        };
        const onVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                fetchNotifications(); // rattrape ce qui est arrivé pendant l'absence
                start();
            }
        };

        if (!document.hidden) start();
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [session?.accessToken, fetchNotifications]);

    // Répartition par catégorie sur les notifications chargées.
    // Une bulle n'apparaît que si elle a du contenu — pas de filtre vide.
    const items = notifications?.notifications ?? [];
    const counts = items.reduce<Record<string, { total: number; unread: number }>>((acc, n) => {
        const cat = getNotificationStyle(n.type).category;
        acc[cat] = acc[cat] || { total: 0, unread: 0 };
        acc[cat].total++;
        if (!n.isRead) acc[cat].unread++;
        return acc;
    }, {});

    const visibleCategories = NOTIFICATION_CATEGORIES.filter(c => counts[c.id]?.total);

    // La catégorie active a pu se vider (suppression, filtre) : on retombe sur « Tout »
    const effectiveCategory =
        activeCategory && counts[activeCategory]?.total ? activeCategory : null;

    const visibleItems = effectiveCategory
        ? items.filter(n => getNotificationStyle(n.type).category === effectiveCategory)
        : items;

    if (!session) return null;

    return (
        <div ref={bellRef}>
            <Button
                ref={btnRef}
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => {
                    if (!isOpen && btnRef.current) {
                        const rect = btnRef.current.getBoundingClientRect();
                        setPanelPos({
                            top: rect.bottom + 8,
                            right: window.innerWidth - rect.right,
                        });
                    }
                    setIsOpen(!isOpen);
                }}
            >
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

            {isOpen && (
                <div
                    className="fixed w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-[200]"
                    style={{ top: panelPos.top, right: panelPos.right }}
                >
                    <div className="flex items-center justify-between p-3 border-b border-gray-100">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {(notifications?.unreadCount ?? 0) > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                disabled={loading}
                                className="text-xs h-auto py-1"
                            >
                                {loading ? '...' : 'Tout marquer comme lu'}
                            </Button>
                        )}
                    </div>

                    {/* Bulles de catégories — masquées s'il n'y a qu'un seul groupe */}
                    {visibleCategories.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-gray-100 scrollbar-none">
                            <button
                                onClick={() => setActiveCategory(null)}
                                title={`Tout — ${items.length} notification${items.length > 1 ? 's' : ''}`}
                                aria-label="Toutes les notifications"
                                aria-pressed={!effectiveCategory}
                                className={`relative shrink-0 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                    !effectiveCategory
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>

                            {visibleCategories.map((cat) => {
                                const CatIcon = cat.icon;
                                const c = counts[cat.id];
                                const isActive = effectiveCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(isActive ? null : cat.id)}
                                        title={`${cat.label} — ${c.total} notification${c.total > 1 ? 's' : ''}`}
                                        aria-label={cat.label}
                                        aria-pressed={isActive}
                                        className={`relative shrink-0 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                            isActive
                                                ? cat.activeClassName
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <CatIcon className="h-4 w-4" />
                                        {c.unread > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                                                {c.unread > 9 ? '9+' : c.unread}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="max-h-96 overflow-y-auto">
                        {visibleItems.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                Aucune notification
                            </div>
                        ) : (
                            visibleItems.map((notification) => {
                                const style = getNotificationStyle(notification.type);
                                const Icon = style.icon;
                                const href = getNotificationLink(notification.relatedEntity);
                                return (
                                <div
                                    key={notification._id}
                                    role={href ? 'link' : undefined}
                                    tabIndex={href ? 0 : undefined}
                                    className={`p-3 transition-colors ${href ? 'cursor-pointer' : 'cursor-default'} hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                    onClick={() => openNotification(notification)}
                                    onKeyDown={(e) => {
                                        if (href && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            openNotification(notification);
                                        }
                                    }}
                                >
                                    <div className="flex items-start space-x-3 w-full">
                                        {/* Pastille colorée : le type se lit d'un coup d'œil */}
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.className}`}
                                            aria-hidden="true"
                                        >
                                            <Icon className="h-[18px] w-[18px]" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                                {style.label}
                                            </p>
                                            <p className="text-sm font-medium truncate">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
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
                                </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
