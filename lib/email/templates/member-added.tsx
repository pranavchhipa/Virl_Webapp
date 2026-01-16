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

interface MemberAddedEmailProps {
    memberName: string
    addedBy: string
    entityName: string
    role: string
    actionUrl: string
    isWorkspace?: boolean
}

export function MemberAddedEmail({
    memberName,
    addedBy,
    entityName,
    role,
    actionUrl,
    isWorkspace = true,
}: MemberAddedEmailProps) {
    const entityType = isWorkspace ? 'workspace' : 'project'

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
                        <Heading style={h1}>Welcome to {entityName}! 🎉</Heading>

                        <Text style={text}>Hi {memberName},</Text>

                        <Text style={text}>
                            Great news! <strong>{addedBy}</strong> has added you to the {entityType} <strong>{entityName}</strong> as a <strong>{role}</strong>.
                        </Text>

                        {/* Info Box */}
                        <Section style={infoBox}>
                            <Text style={infoTitle}>✨ <strong>What you can do</strong></Text>
                            <Text style={infoText}>As a {role}, you now have access to:</Text>
                            <ul style={list}>
                                {isWorkspace ? (
                                    <>
                                        <li>All projects in this workspace</li>
                                        <li>Team collaboration and chat</li>
                                        <li>Asset uploads and management</li>
                                        <li>Task assignments and tracking</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Project files and assets</li>
                                        <li>Team conversations</li>
                                        <li>Task management</li>
                                        <li>Collaboration tools</li>
                                    </>
                                )}
                            </ul>
                        </Section>

                        <Text style={text}>
                            Click the button below to get started:
                        </Text>

                        {/* CTA Button */}
                        <Button href={actionUrl} style={button}>
                            {isWorkspace ? 'View Workspace' : 'View Project'}
                        </Button>
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Text style={footer}>
                        You're receiving this because you've been added to {entityName}.
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
    backgroundColor: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
}

const infoTitle = {
    color: '#166534',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
}

const infoText = {
    color: '#14532d',
    fontSize: '14px',
    margin: '8px 0',
}

const list = {
    color: '#14532d',
    fontSize: '14px',
    margin: '8px 0',
    paddingLeft: '20px',
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
