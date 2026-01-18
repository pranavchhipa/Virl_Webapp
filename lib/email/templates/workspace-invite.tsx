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

interface WorkspaceInviteEmailProps {
    inviteeName: string
    inviterName: string
    workspaceName: string
    role: string
    inviteUrl: string
}

export function WorkspaceInviteEmail({
    inviteeName,
    inviterName,
    workspaceName,
    role,
    inviteUrl,
}: WorkspaceInviteEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Img
                            src="https://virl.in/images/virl-logo-full.png"
                            width="140"
                            height="40"
                            alt="Virl"
                            style={{ ...logo, objectFit: 'contain' }}
                        />
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>You're Invited! 🎉</Heading>

                        <Text style={text}>Hi {inviteeName},</Text>

                        <Text style={text}>
                            <strong>{inviterName}</strong> has invited you to join <strong>{workspaceName}</strong> on Virl as a <strong>{role}</strong>.
                        </Text>

                        <Section style={infoBox}>
                            <Text style={infoTitle}>✨ What you'll get:</Text>
                            <ul style={list}>
                                <li>Collaborate on projects with your team</li>
                                <li>Manage social media content seamlessly</li>
                                <li>Track tasks and assignments</li>
                                <li>Share and review assets</li>
                            </ul>
                        </Section>

                        <Text style={text}>
                            Click below to accept the invitation and get started!
                        </Text>

                        <Button href={inviteUrl} style={button}>
                            Accept Invitation
                        </Button>

                        <Text style={smallText}>
                            This invitation will expire in 7 days.
                        </Text>
                    </Section>

                    <Hr style={hr} />
                    <Text style={footer}>
                        Virl - Social Media Content Management Platform
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

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

const list = {
    color: '#14532d',
    fontSize: '14px',
    margin: '8px 0',
    paddingLeft: '20px',
}

const button = {
    backgroundColor: '#10b981',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '14px 28px',
    margin: '24px 0',
}

const smallText = {
    color: '#737373',
    fontSize: '14px',
    textAlign: 'center' as const,
    margin: '16px 0',
}

const hr = {
    borderColor: '#e5e5e5',
    margin: '32px 0',
}

const footer = {
    color: '#737373',
    fontSize: '12px',
    textAlign: 'center' as const,
    margin: '8px 0',
}
