/**
 * Extracts @mentions from a text message
 * Returns array of mentioned user IDs
 */
export async function extractMentions(
    message: string,
    projectId: string,
    supabaseClient: any
): Promise<string[]> {
    // Find all @mentions in the message
    const mentionPattern = /@(\w+)/g
    const matches = message.match(mentionPattern)

    if (!matches || matches.length === 0) {
        return []
    }

    // Extract usernames (remove @ symbol)
    const usernames = matches.map(m => m.slice(1))

    // Get project members
    const { data: members } = await supabaseClient
        .from('project_members')
        .select(`
            user_id,
            profiles(full_name, email)
        `)
        .eq('project_id', projectId)

    if (!members) return []

    // Match mentioned names to user IDs
    const mentionedIds: string[] = []

    for (const username of usernames) {
        const lowerUsername = username.toLowerCase()

        // Find users whose name or email starts with the mentioned username
        const matchingMember = members.find((m: any) => {
            const fullName = m.profiles?.full_name?.toLowerCase() || ''
            const email = m.profiles?.email?.toLowerCase() || ''
            return fullName.includes(lowerUsername) || email.startsWith(lowerUsername)
        })

        if (matchingMember && !mentionedIds.includes(matchingMember.user_id)) {
            mentionedIds.push(matchingMember.user_id)
        }
    }

    return mentionedIds
}
