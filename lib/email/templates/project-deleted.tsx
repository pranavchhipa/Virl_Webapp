import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Hr,
    Heading,
    Img,
} from '@react-email/components'

interface ProjectDeletedEmailProps {
    memberName: string
    projectName: string
    deletedBy: string
}

export function ProjectDeletedEmail({
    memberName,
    projectName,
    deletedBy,
}: ProjectDeletedEmailProps) {
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
                        <Heading style={h1}>Project Deleted</Heading>

                        <Text style={text}>Hi {memberName},</Text>

                        <Text style={text}>
                            The project <strong>{projectName}</strong> has been permanently deleted by {deletedBy}.
                        </Text>

                        {/* Warning Box */}
                        <Section style={warningBox}>
                            <Text style={warningTitle}>⚠️ <strong>Important</strong></Text>
                            <Text style={warningText}>This action was permanent. All project data including:</Text>
                            <ul style={list}>
                                <li>Tasks and assignments</li>
                                <li>Uploaded assets and files</li>
                                <li>Chat conversations</li>
                                <li>Project settings and history</li>
                            </ul>
                            <Text style={warningText}>...has been removed and cannot be recovered.</Text>
                        </Section>

                        <Text style={text}>
                            If you need access to this project's data, please contact {deletedBy} immediately.
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Text style={footer}>
                        You're receiving this notification because you were a member of {projectName}.
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
