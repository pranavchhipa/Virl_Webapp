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

interface MemberRemovedEmailProps {
    memberName: string
    removedBy: string
    workspaceName: string
    projectName?: string
    isWorkspace?: boolean
}

export function MemberRemovedEmail({
    memberName,
    removedBy,
    workspaceName,
    projectName,
    isWorkspace = true,
}: MemberRemovedEmailProps) {
    const entityName = isWorkspace ? workspaceName : projectName
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
                        <Heading style={h1}>Access Revoked</Heading>

                        <Text style={text}>Hi {memberName},</Text>

                        <Text style={text}>
                            You have been removed from the {entityType} <strong>{entityName}</strong> by {removedBy}.
                        </Text>

                        {/* Warning Box */}
                        <Section style={warningBox}>
                            <Text style={warningTitle}>⚠️ <strong>What this means</strong></Text>
                            <Text style={warningText}>You no longer have access to:</Text>
                            <ul style={list}>
                                <li>{isWorkspace ? 'Workspace projects and files' : 'Project files and assets'}</li>
                                <li>Team conversations and chat</li>
                                <li>Task assignments and updates</li>
                                {isWorkspace && <li>All projects within this workspace</li>}
                            </ul>
                        </Section>

                        <Text style={text}>
                            If you believe this was a mistake, please contact <strong>{removedBy}</strong> or the workspace administrator.
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Text style={footer}>
                        You're receiving this notification because you were a member of {entityName}.
                    </Text>
                    <Text style={footer} >
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
    color: '#dc2626',
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

const warningBox = {
    backgroundColor: '#fef2f2',
    border: '2px solid #fca5a5',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
}

const warningTitle = {
    color: '#991b1b',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
}

const warningText = {
    color: '#7f1d1d',
    fontSize: '14px',
    margin: '8px 0',
}

const list = {
    color: '#7f1d1d',
    fontSize: '14px',
    margin: '8px 0',
    paddingLeft: '20px',
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
