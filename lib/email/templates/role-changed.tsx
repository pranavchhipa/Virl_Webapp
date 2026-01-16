import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Button,
    Hr,
    Heading,
    Img,
} from '@react-email/components'

interface RoleChangedEmailProps {
    memberName: string
    changedBy: string
    entityName: string
    oldRole: string
    newRole: string
    actionUrl: string
    isWorkspace?: boolean
}

export function RoleChangedEmail({
    memberName,
    changedBy,
    entityName,
    oldRole,
    newRole,
    actionUrl,
    isWorkspace = true,
}: RoleChangedEmailProps) {
    const entityType = isWorkspace ? 'workspace' : 'project'
    const isPromotion = ['owner', 'admin', 'manager'].includes(newRole.toLowerCase())

    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Img
                            src="https://virl.in/images/virl-email-logo.png"
                            width="40"
                            height="40"
                            alt="Virl"
                            style={logo}
                        />
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading style={h1}>Your Role Has Been Updated</Heading>

                        <Text style={text}>Hi {memberName},</Text>

                        <Text style={text}>
                            <strong>{changedBy}</strong> has updated your role in {entityType} <strong>{entityName}</strong>.
                        </Text>

                        {/* Role Change Box */}
                        <Section style={infoBox}>
                            <Text style={infoText}>
                                <span style={oldRoleStyle}>{oldRole}</span>
                                {' → '}
                                <span style={newRoleStyle}>{newRole}</span>
                            </Text>
                        </Section>

                        <Text style={text}>
                            {isPromotion ? (
                                <>Congratulations! Your new role comes with additional permissions and responsibilities.</>
                            ) : (
                                <>Your permissions have been adjusted to match your new role.</>
                            )}
                        </Text>

                        {/* CTA Button */}
                        <Button href={actionUrl} style={button}>
                            View {isWorkspace ? 'Workspace' : 'Project'}
                        </Button>
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Text style={footer}>
                        You're receiving this because your role in {entityName} has changed.
                    </Text>
                    <Text style={footer}>
                        Virl - Social Media Content Management Platform
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
}

const header = {
    padding: '32px 24px',
    textAlign: 'center' as const,
    backgroundColor: '#6366f1',
}

const logo = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
}

const content = {
    padding: '0 24px',
}

const h1 = {
    color: '#18181b',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '32px 0 16px',
    padding: '0',
}

const text = {
    color: '#525252',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '16px 0',
}

const infoBox = {
    backgroundColor: '#f0f9ff',
    border: '2px solid #7dd3fc',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
    textAlign: 'center' as const,
}

const infoText = {
    color: '#0c4a6e',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
}

const oldRoleStyle = {
    color: '#64748b',
    textDecoration: 'line-through',
}

const newRoleStyle = {
    color: '#0284c7',
    fontWeight: 'bold' as const,
}

const button = {
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 24px',
    margin: '24px 0',
}

const hr = {
    borderColor: '#e5e5e5',
    margin: '32px 0',
}

const footer = {
    color: '#737373',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
    margin: '8px 0',
}
