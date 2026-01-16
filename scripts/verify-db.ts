import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        env[key] = value
    }
})

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(url, key)

async function check() {
    console.log('Verifying columns on', url)

    // Attempt to select the specific new column
    const { data, error } = await supabase
        .from('workspaces')
        .select('custom_storage_limit, custom_member_limit, custom_workspace_limit, custom_vixi_spark_limit')
        .limit(1)

    if (error) {
        console.error('VERIFICATION FAILED:', error.message)
    } else {
        console.log('VERIFICATION SUCCESS: All custom limit columns exist.')
    }
}

check()
