/**
 * Vixi Sparks Icon - Lightning bolt emoji style ⚡
 * The exact orange/yellow lightning bolt from the design
 */

import { cn } from "@/lib/utils"

import { useId } from "react"

interface VixiSparksIconProps {
    className?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function VixiSparksIcon({ className, size = 'md' }: VixiSparksIconProps) {
    const sizeClasses = {
        xs: 'h-4 w-4',
        sm: 'h-5 w-5',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-10 w-10'
    }

    const uniqueId = useId().replace(/:/g, '') // Sanitize for SVG ID usage
    const id = `bolt-${uniqueId}`

    return (
        <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(sizeClasses[size], className)}
        >
            <defs>
                <linearGradient id={`${id}-grad`} x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#FFCC4D" />
                    <stop offset="50%" stopColor="#F4900C" />
                    <stop offset="100%" stopColor="#DD8E0B" />
                </linearGradient>
            </defs>

            {/* Lightning bolt - emoji style ⚡ */}
            <path
                d="M20 2L6 22H16L14 34L30 14H18L20 2Z"
                fill={`url(#${id}-grad)`}
            />
        </svg>
    )
}

export default VixiSparksIcon
