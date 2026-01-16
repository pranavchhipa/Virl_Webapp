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

interface AssetUploadedEmailProps {
    memberName: string
    uploaderName: string
    assetName: string
    projectName: string
    actionUrl: string
}

export function AssetUploadedEmail({
    memberName,
    uploaderName,
    assetName,
    projectName,
    actionUrl,
}: AssetUploadedEmailProps) {
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
                        <Heading style={h1}>New Asset Uploaded 📎</Heading>

                        <Text style={text}>Hi {memberName},</Text>

                        <Text style={text}>
                            <strong>{uploaderName}</strong> uploaded a new asset to <strong>{projectName}</strong>.
                        </Text>

                        <Section style={infoBox}>
                            <Text style={assetNameStyle}>📄 {assetName}</Text>
                        </Section>

                        <Text style={text}>View and review the asset now.</Text>

                        <Button href={actionUrl} style={button}>
                            View Asset
                        </Button>
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
    backgroundColor: '#f0f9ff',
    border: '2px solid #7dd3fc',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
}

const assetNameStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#0c4a6e',
    margin: 0,
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
    textAlign: 'center' as const,
    margin: '8px 0',
}
