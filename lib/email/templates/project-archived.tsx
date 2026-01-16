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

interface ProjectArchivedEmailProps {
    memberName: string
    projectName: string
    archivedBy: string
    actionUrl: string
}

export function ProjectArchivedEmail({
    memberName,
    projectName,
    archivedBy,
    actionUrl,
}: ProjectArchivedEmailProps) {
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
                        <Heading style={h1}>Project Archived 📦</Heading>

                        <Text style={text}>Hi {memberName},</Text>

                        <Text style={text}>
                            The project <strong>{projectName}</strong> has been archived by {archivedBy}.
                        </Text>

                        {/* Info Box */}
                        <Section style={infoBox}>
                            <Text style={infoTitle}>ℹ️ <strong>What this means</strong></Text>
                            <Text style={infoText}>The project is now in read-only mode:</Text>
                            <ul style={list}>
                                <li>No new tasks or assets can be added</li>
                                <li>Existing content remains accessible</li>
                                <li>The project can be restored at any time</li>
                            </ul>
                        </Section>

                        <Text style={text}>
                            You can still view the archived project and its contents.
                        </Text>

                        {/* CTA Button */}
                        <Button href={actionUrl} style={button}>
                            View Archived Project
                        </Button>
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Text style={footer}>
                        You're receiving this because you're a member of {projectName}.
                    </Text>
                    <Text style={footer}>
                        Virl - Social Media Content Management Platform
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

// Styles (same as other templates)
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
    backgroundColor: '#fffbeb',
    border: '2px solid #fde047',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
}

const infoTitle = {
    color: '#92400e',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
}

const infoText = {
    color: '#78350f',
    fontSize: '14px',
    margin: '8px 0',
}

const list = {
    color: '#78350f',
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
