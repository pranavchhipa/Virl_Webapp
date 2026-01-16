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

interface TaskAssignedEmailProps {
    assigneeName: string
    taskTitle: string
    projectName: string
    assignedBy: string
    dueDate?: string
    priority?: string
    actionUrl: string
}

export function TaskAssignedEmail({
    assigneeName,
    taskTitle,
    projectName,
    assignedBy,
    dueDate,
    priority,
    actionUrl,
}: TaskAssignedEmailProps) {
    const priorityColors = {
        high: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
        medium: { bg: '#fffbeb', border: '#fde047', text: '#92400e' },
        low: { bg: '#f0f9ff', border: '#7dd3fc', text: '#0c4a6e' },
    }

    const priorityColor = priorityColors[(priority as keyof typeof priorityColors) || 'medium']

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
                        <Heading style={h1}>New Task Assigned ✅</Heading>

                        <Text style={text}>Hi {assigneeName},</Text>

                        <Text style={text}>
                            <strong>{assignedBy}</strong> has assigned you a new task in project <strong>{projectName}</strong>.
                        </Text>

                        {/* Task Details Box */}
                        <Section style={{
                            ...infoBox,
                            backgroundColor: priorityColor.bg,
                            borderColor: priorityColor.border,
                        }}>
                            <Text style={{
                                ...taskTitle as any,
                                color: priorityColor.text,
                            }}>
                                {taskTitle}
                            </Text>

                            <div style={taskMeta}>
                                {priority && (
                                    <Text style={metaBadge}>
                                        Priority: <strong>{priority.toUpperCase()}</strong>
                                    </Text>
                                )}
                                {dueDate && (
                                    <Text style={metaBadge}>
                                        Due: <strong>{new Date(dueDate).toLocaleDateString()}</strong>
                                    </Text>
                                )}
                            </div>
                        </Section>

                        <Text style={text}>
                            Click below to view the task details and get started.
                        </Text>

                        {/* CTA Button */}
                        <Button href={actionUrl} style={button}>
                            View Task
                        </Button>
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Text style={footer}>
                        You're receiving this because you've been assigned a task in {projectName}.
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
    border: '2px solid',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
}

const taskTitle = {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    lineHeight: '1.4',
}

const taskMeta = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
}

const metaBadge = {
    fontSize: '14px',
    margin: '4px 0',
    color: '#525252',
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
