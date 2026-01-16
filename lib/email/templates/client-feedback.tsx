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

interface ClientFeedbackEmailProps {
    clientName: string
    assetName: string
    status: 'approved' | 'changes_requested'
    feedbackText?: string
    reviewUrl: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://virl.in'

export function ClientFeedbackEmail({
    clientName,
    assetName,
    status,
    feedbackText,
    reviewUrl
}: ClientFeedbackEmailProps) {
    const isApproved = status === 'approved'

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
                        <Heading style={h1}>
                            {isApproved ? 'Content Approved' : 'Changes Requested'}
                        </Heading>

                        <Text style={text}>Hi team,</Text>

                        <Text style={text}>
                            <strong>{clientName}</strong> has reviewed your content and submitted feedback:
                        </Text>

                        {/* Info Box */}
                        <Section style={isApproved ? approvedBox : changesBox}>
                            <Text style={infoTitle}>
                                Asset: <span style={{ fontWeight: 'normal' }}>{assetName}</span>
                            </Text>
                            <Text style={{ ...infoTitle, marginBottom: 0 }}>
                                Status: <span style={{ color: isApproved ? '#16a34a' : '#d97706' }}>{isApproved ? 'APPROVED' : 'CHANGES REQUESTED'}</span>
                            </Text>
                            {feedbackText && (
                                <>
                                    <Hr style={divider} />
                                    <Text style={label}>Feedback:</Text>
                                    <Text style={feedbackContent}>{feedbackText}</Text>
                                </>
                            )}
                        </Section>

                        <Text style={text}>
                            {isApproved
                                ? 'Great work! The content is ready for the next stage.'
                                : 'Please review the feedback above and submit a new version.'}
                        </Text>

                        {/* CTA Button */}
                        <Section style={btnContainer}>
                            <Button href={reviewUrl} style={button}>
                                View in Dashboard
                            </Button>
                        </Section>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Hr style={hr} />
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Virl. All rights reserved.
                        </Text>
                        <Text style={footerText}>
                            You are receiving this email because you are a member of the Virl workspace.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

// Styles
const main = {
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '0',
    maxWidth: '580px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
}

const header = {
    padding: '32px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
    borderRadius: '12px 12px 0 0',
}

const logo = {
    display: 'block',
    margin: '0 auto',
}

const content = {
    padding: '40px 48px',
}

const h1 = {
    color: '#0f172a',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 24px',
    textAlign: 'left' as const,
    letterSpacing: '-0.5px',
}

const text = {
    color: '#334155',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 16px',
}

const approvedBox = {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
}

const changesBox = {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
}

const infoTitle = {
    color: '#0f172a',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 8px',
}

const label = {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 8px',
}

const feedbackContent = {
    color: '#334155',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0',
}

const divider = {
    borderColor: '#000000',
    opacity: 0.06,
    margin: '20px 0',
}

const btnContainer = {
    textAlign: 'left' as const,
    margin: '32px 0 0',
}

const button = {
    backgroundColor: '#7c3aed', // Virl Purple
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
}

const footer = {
    padding: '0 48px 48px',
    textAlign: 'center' as const,
}

const hr = {
    borderColor: '#e2e8f0',
    margin: '0 0 24px',
}

const footerText = {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '20px',
    margin: '0 0 4px',
}
