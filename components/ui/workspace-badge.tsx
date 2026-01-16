import { Crown, Users, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WorkspaceBadgeProps {
    isOwner: boolean
    role?: string
    className?: string
}

export function WorkspaceBadge({ isOwner, role, className }: WorkspaceBadgeProps) {
    if (isOwner) {
        return (
            <Badge
                variant="secondary"
                className={cn(
                    "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 gap-1",
                    className
                )}
            >
                <Crown className="w-3 h-3" />
                Owner
            </Badge>
        )
    }

    // Role-based badges for non-owners
    const roleConfig = {
        admin: {
            color: 'bg-blue-50 text-blue-700 border-blue-300',
            icon: Shield,
            label: 'Admin'
        },
        member: {
            color: 'bg-slate-50 text-slate-700 border-slate-300',
            icon: Users,
            label: 'Member'
        }
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.member
    const Icon = config.icon

    return (
        <Badge
            variant="secondary"
            className={cn(
                config.color,
                "hover:opacity-80 gap-1",
                className
            )}
        >
            <Icon className="w-3 h-3" />
            {config.label}
        </Badge>
    )
}
