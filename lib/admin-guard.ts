// Super Admin Control Centre Configuration
// The secret URL path - only you know this!
// Full URL: https://your-domain.com/control-centre-X7kP2mN9vL3qR8wY5jT1

export const CONTROL_CENTRE_SECRET = 'X7kP2mN9vL3qR8wY5jT1'
export const CONTROL_CENTRE_PATH = `/control-centre-${CONTROL_CENTRE_SECRET}`

// Super Admin PIN - for the separate login
// Change this to your preferred PIN
export const SUPER_ADMIN_PIN = '142536'

// Super Admin emails (for additional verification if needed)
export const SUPER_ADMIN_EMAILS = [
    'pranavchhipa01@gmail.com',
]

export function isSuperAdmin(email: string | null | undefined): boolean {
    if (!email) return false
    return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

export function verifyAdminPin(pin: string): boolean {
    return pin === SUPER_ADMIN_PIN
}
