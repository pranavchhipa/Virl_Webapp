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

interface WelcomeEmailProps {
    name: string
    actionUrl: string
}

export function WelcomeEmail({
    name,
    actionUrl,
}: WelcomeEmailProps) {
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
                        <Heading style={h1}>Welcome to Virl! 🚀</Heading>

                        <Text style={text}>Hi {name},</Text>

                        <Text style={text}>
                            We're thrilled to have you on board! You've just taken the first step towards streamlining your social media content workflow.
                        </Text>

                        <Section style={infoBox}>
                            <Text style={infoTitle}>✨ <strong>Here's what you can do</strong></Text>
                            <ul style={list}>
                                <li>Create projects and organize your content</li>
                                <li>Collaborate with your team in real-time</li>
                                <li>Use Vixi AI to generate viral ideas</li>
                                <li>Manage your production pipeline effortlessly</li>
                            </ul>
                        </Section>

                        <Text style={text}>
                            Ready to dive in? Click the button below to access your dashboard.
                        </Text>

                        {/* CTA Button */}
                        <Button href={actionUrl} style={button}>
                            Go to Dashboard
                        </Button>
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Text style={footer}>
                        If you have any questions, just reply to this email - we're here to help!
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
    backgroundColor: '#f5f3ff',
    border: '2px solid #ddd6fe',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
}

const infoTitle = {
    color: '#5b21b6',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
}

const list = {
    color: '#4c1d95',
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
