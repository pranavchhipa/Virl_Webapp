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

interface ProjectInviteEmailProps {
    inviteeName: string
    inviterName: string
    projectName: string
    workspaceName: string
    role: string
    inviteUrl: string
}

export function ProjectInviteEmail({
    inviteeName,
    inviterName,
    projectName,
    workspaceName,
    role,
    inviteUrl,
}: ProjectInviteEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Img
                            src="https://virl.in/images/virl-email-logo.png"
                            width="40"
                            height="40"
                            alt="Virl"
                            style={logo}
                        />
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>Project Invitation 📁</Heading>

                        <Text style={text}>Hi {inviteeName},</Text>

                        <Text style={text}>
                            <strong>{inviterName}</strong> has invited you to collaborate on <strong>{projectName}</strong> in workspace <strong>{workspaceName}</strong> as a <strong>{role}</strong>.
                        </Text>

                        <Section style={infoBox}>
                            <Text style={projectNameStyle}>📂 {projectName}</Text>
                            <Text style={workspaceLabel}>Workspace: {workspaceName}</Text>
                            <Text style={roleLabel}>Role: {role}</Text>
                        </Section>

                        <Text style={text}>
                            Accept the invitation to start collaborating!
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
    backgroundColor: '#ede9fe',
    border: '2px solid #c4b5fd',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
}

const projectNameStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#5b21b6',
    margin: '0 0 12px 0',
}

const workspaceLabel = {
    fontSize: '14px',
    color: '#6b21a8',
    margin: '4px 0',
}

const roleLabel = {
    fontSize: '14px',
    color: '#6b21a8',
    fontWeight: 'bold' as const,
    margin: '4px 0',
}

const button = {
    backgroundColor: '#7c3aed',
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
