# Virl.in - Content Workflow Platform

Virl is a modern, AI-powered workspace for content creators. Manage projects with Kanban boards, collaborate on assets in real-time, and generate ideas instantly.

## Features

- **Project Management**: Drag-and-drop Kanban board (Idea -> Posted) with `dnd-kit`.
- **AI Integration**: "Generate Ideas" feature simulates AI brainstorming to populate your board.
- **Asset Hub**: Upload videos/images, assign them to team members, and manage files via Supabase Storage.
- **Collaboration**: Real-time commenting system with @mentions on asset previews.
- **Premium UI**: "Deep Violet" dark mode aesthetic with glassmorphism and smooth animations.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **UI Components**: Shadcn UI, Lucide React, Framer Motion
- **Backend Service**: Supabase (Database, Auth, Storage, Real-time)

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/virl-webapp.git
    cd virl-webapp
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file with your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

This app is optimized for deployment on Vercel.
1.  Push code to GitHub.
2.  Import project in Vercel.
3.  Add Environment Variables.
4.  Deploy.

## License
MIT
