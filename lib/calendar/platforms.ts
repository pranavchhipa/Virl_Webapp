// Platform configuration types and utilities

export const PLATFORMS = {
    INSTAGRAM: 'instagram',
    FACEBOOK: 'facebook',
    YOUTUBE: 'youtube',
    TWITTER: 'twitter',
    LINKEDIN: 'linkedin',
} as const

export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS]

export interface PlatformMetadata {
    name: string
    icon: string
    color: string
    gradient: string
    defaultTimes: string[]
    aspectRatios: { label: string; value: string }[]
    captionLimit: number
    hashtagLimit?: number
    bestPractices: string[]
}

export const PLATFORM_METADATA: Record<Platform, PlatformMetadata> = {
    instagram: {
        name: 'Instagram',
        icon: '📸',
        color: '#E1306C',
        gradient: 'from-purple-600 via-pink-600 to-orange-600',
        defaultTimes: ['10:00', '14:00', '19:00'],
        aspectRatios: [
            { label: 'Square', value: '1:1' },
            { label: 'Portrait', value: '4:5' },
            { label: 'Landscape', value: '1.91:1' },
        ],
        captionLimit: 2200,
        hashtagLimit: 30,
        bestPractices: [
            'Post 1-2 times per day',
            'Use 10-15 relevant hashtags',
            'Engage with comments within first hour',
            'Post Stories daily for visibility',
        ],
    },
    facebook: {
        name: 'Facebook',
        icon: '👥',
        color: '#1877F2',
        gradient: 'from-blue-600 to-blue-500',
        defaultTimes: ['13:00', '15:00', '09:00'],
        aspectRatios: [{ label: 'Landscape', value: '1.91:1' }, { label: 'Square', value: '1:1' }],
        captionLimit: 63206,
        bestPractices: [
            'Post 1-2 times per day',
            'Videos perform best',
            'Keep captions concise',
            'Engage with your community',
        ],
    },
    youtube: {
        name: 'YouTube',
        icon: '📹',
        color: '#FF0000',
        gradient: 'from-red-600 to-red-500',
        defaultTimes: ['14:00', '16:00', '20:00'],
        aspectRatios: [
            { label: 'Landscape', value: '16:9' },
            { label: 'Shorts', value: '9:16' },
        ],
        captionLimit: 5000,
        bestPractices: [
            'Upload 2-4 times per week',
            'Custom thumbnail is crucial',
            'First 15 seconds determine retention',
            'Optimize title and description for SEO',
        ],
    },
    twitter: {
        name: 'Twitter',
        icon: '🐦',
        color: '#1DA1F2',
        gradient: 'from-blue-500 to-blue-400',
        defaultTimes: ['09:00', '12:00', '17:00'],
        aspectRatios: [{ label: 'Landscape', value: '16:9' }],
        captionLimit: 280,
        bestPractices: [
            'Post 3-5 times per day',
            'Use 1-2 hashtags max',
            'Engage in conversations',
            'Tweet during business hours',
        ],
    },
    linkedin: {
        name: 'LinkedIn',
        icon: '💼',
        color: '#0077B5',
        gradient: 'from-blue-700 to-blue-600',
        defaultTimes: ['08:00', '12:00', '17:00'],
        aspectRatios: [
            { label: 'Square', value: '1:1' },
            { label: 'Landscape', value: '1.91:1' },
        ],
        captionLimit: 3000,
        hashtagLimit: 5,
        bestPractices: [
            'Post 1-2 times per day',
            'Professional tone is key',
            'Engage with your network',
            'Post on weekdays (avoid weekends)',
        ],
    },
}

export interface CalendarAsset {
    id: string
    file_name: string
    file_path: string
    file_type: string
    thumbnail_url?: string
    scheduled_date: string
    scheduled_time?: string
    platform?: Platform
    status: 'pending' | 'in-review' | 'approved' | 'rejected'
    assigned_to?: string
    created_at: string
    platform_specific?: Record<string, any>
    posting_notes?: string
}

export interface ScheduleConflict {
    id: string
    conflict_type: 'same_time' | 'daily_limit' | 'team_capacity'
    severity: 'info' | 'warning' | 'error'
    message: string
    asset_ids: string[]
    conflict_date: string
    conflict_time?: string
    resolved: boolean
}

export interface CalendarStats {
    stat_date: string
    platform: Platform
    posts_scheduled: number
    posts_published: number
    posts_approved: number
    team_capacity_used: number
    best_performing_time?: string
    engagement_rate?: number
}

// Helper function to get platform info
export const getPlatformInfo = (platform?: Platform) => {
    if (!platform) return null
    return PLATFORM_METADATA[platform]
}

// Helper function to format time for display
export const formatScheduledTime = (date: string, time?: string) => {
    const parsedDate = new Date(date)
    if (time) {
        const [hours, minutes] = time.split(':')
        parsedDate.setHours(parseInt(hours), parseInt(minutes))
        return parsedDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }
    return parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })
}

// Helper to check if time is optimal for platform
export const isOptimalTime = (time: string, platform?: Platform) => {
    if (!platform) return false
    const metadata = getPlatformInfo(platform)
    return metadata?.defaultTimes.includes(time) || false
}
