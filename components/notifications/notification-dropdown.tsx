"use client"

import { useState } from "react"
import { Bell, Upload, Users, AlertCircle, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface Notification {
    id: string
    type: 'asset' | 'team' | 'system'
    title: string
    description: string
    time: string
    read: boolean
    avatar?: string
}

// Notifications - will be populated with real data
const mockNotifications: Notification[] = []

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'asset':
            return <Upload className="h-4 w-4" />
        case 'team':
            return <Users className="h-4 w-4" />
        case 'system':
            return <AlertCircle className="h-4 w-4" />
        default:
            return <Bell className="h-4 w-4" />
    }
}

const getNotificationColor = (type: string) => {
    switch (type) {
        case 'asset':
            return 'bg-blue-100 text-blue-600'
        case 'team':
            return 'bg-emerald-100 text-emerald-600'
        case 'system':
            return 'bg-amber-100 text-amber-600'
        default:
            return 'bg-slate-100 text-slate-600'
    }
}

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState(mockNotifications)

    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-slate-400">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group relative",
                                                    !notification.read && "bg-violet-50/50"
                                                )}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                        getNotificationColor(notification.type)
                                                    )}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={cn(
                                                                "text-sm",
                                                                notification.read ? "text-slate-600" : "text-slate-900 font-medium"
                                                            )}>
                                                                {notification.title}
                                                            </p>
                                                            {!notification.read && (
                                                                <div className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                            {notification.description}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-wide">
                                                            {notification.time}
                                                        </p>
                                                    </div>

                                                    {/* Remove button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            removeNotification(notification.id)
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                                                    >
                                                        <X className="h-3.5 w-3.5 text-slate-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                                    <button className="w-full text-center text-sm text-violet-600 hover:text-violet-700 font-medium">
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
