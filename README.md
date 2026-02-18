<div align="center">
  <img src="https://krishnaconnect.in/logo/krishna_connect.png" alt="Krishna Connect Logo" width="150">
  
  <h1 align="center">Krishna Connect</h1>

  <p align="center">
    <i>Where Devotees Unite</i>
    <br />
    A modern, real-time chat application for the conscious community.
    <br />
    <br />
    <a href="https://krishnaconnect.in/"><strong>Visit Website »</strong></a>
    ·
    <a href="https://chat.krishnaconsciousnesssociety.com/">Alternate URL</a>
  </p>
</div>

---

> **Note:** This is a proprietary project owned by the **Krishna Consciousness Society**. Unauthorized copying, distribution, or use of this source code is strictly prohibited.

## 📖 About The Project

**Krishna Connect** is a sacred digital space designed to foster deep connections, share spiritual inspiration, and strengthen the collective journey in Krishna consciousness. Built with modern, scalable technology, it provides a secure and feature-rich environment for meaningful conversations.

### Key Features

#### 💬 Communication & Messaging
*   **Real-Time Messaging**: One-on-one direct messages and group chats with typing indicators
*   **Rich Text Formatting**: Compose messages with formatting, mentions, and hashtags
*   **Media Sharing**: Share images, files, voice notes, GIFs (Giphy integration), and emojis
*   **Message Management**: Edit, delete, reply, forward, and star important messages
*   **Chat Customization**: Personalize chat appearance with wallpapers and bubble colors

#### 👤 User Experience
*   **User Profiles**: Customizable profiles with banners, avatars, bios, and social stats
*   **Stories/Status**: Share ephemeral 24-hour content with the community
*   **Feed System**: Explore posts with infinite scroll, likes, reposts, and comments (with pinning and hiding support)
*   **Leela Videos**: Share and discover engaging short-form videos
*   **Bookmarks**: Save and organize your favorite posts and content
*   **Notifications**: Real-time notifications for mentions, likes, messages, and events
*   **Theme Customization**: Switch between light and dark modes

#### 🌐 Community & Social
*   **Communities/Groups**: Create and join topic-specific spaces
*   **Events Management**: Create, discover, and RSVP to community events
*   **Hashtags & Mentions**: Tag content and mention users with @ and # support
*   **Explore Page**: Discover trending posts, users, and content
*   **Search Functionality**: Find users, posts, and conversations
*   **Verification System**: Verified user badges for trusted community members

#### 🛡️ Safety & Privacy
*   **Content Moderation**: Built-in reporting system for inappropriate content
*   **User Blocking**: Block unwanted interactions
*   **Privacy Controls**: Granular privacy settings for your profile and content
*   **Security Settings**: Enhanced account security options
*   **Row Level Security**: Database-level access control via Supabase RLS

#### 🚀 Advanced Features
*   **Progressive Web App (PWA)**: Install on any device for native-like experience
*   **Push Notifications**: Stay updated with web push notifications
*   **AI-Powered Features**: Smart content analysis powered by Google Gemini
*   **Analytics Dashboard**: Track engagement and insights for content creators
*   **Image Editing**: Built-in tools for cropping, rotating, and filters
*   **Content Scheduling**: Schedule posts for future publication
*   **Collaborative Posts**: Co-author posts with multiple users
*   **Thread Support**: Create connected series of posts
*   **Maintenance Mode**: System-wide maintenance mode with bypass capabilities for administrators
*   **Monetization**: Optional ads integration for content promotion

#### 📱 Cross-Platform
*   **Responsive Design**: Optimized for desktop, tablet, and mobile devices
*   **PWA Support**: Installable web app with offline capabilities
*   **Service Worker**: Enhanced performance with caching and background sync

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **UI Library**: React 18
*   **Styling**: Tailwind CSS + ShadCN UI Components
*   **Icons**: Lucide React
*   **State Management**: React Query (TanStack Query) + React Context
*   **Forms**: React Hook Form + Zod validation

### Backend & Infrastructure
*   **Backend**: Supabase (PostgreSQL 15+, GoTrue Auth, Realtime, Storage)
*   **Database**: PostgreSQL with Row Level Security (RLS)
*   **Authentication**: Supabase Auth (Email/Password + OAuth)
*   **Real-time**: WebSocket connections via Supabase Realtime
*   **Storage**: S3-compatible object storage for media files

### AI & Integrations
*   **AI**: Google Gemini (Genkit) for smart features
*   **GIF Integration**: Giphy API
*   **Analytics**: Vercel Analytics + Speed Insights
*   **Push Notifications**: Web Push API

### Deployment & DevOps
*   **Hosting**: Vercel (Edge Network)
*   **CDN**: Vercel Edge Functions
*   **CI/CD**: GitHub Actions + Vercel automatic deployments

---

## 📚 Documentation

For detailed technical documentation, please refer to the following resources in the `docs/` directory:

*   [**Architecture Overview**](docs/ARCHITECTURE.md) - High-level system design and component structure.
*   [**Database Schema**](docs/DATABASE.md) - Detailed breakdown of tables, relationships, and RLS policies.
*   [**Deployment Guide**](docs/DEPLOYMENT.md) - Instructions for deploying to production.
*   [**Development Guidelines**](docs/DEVELOPMENT.md) - Coding standards and contribution workflow.

---

## 🚀 Getting Started (Internal)

Follow these steps to set up the development environment.

### Prerequisites

*   Node.js v18+ or v20+
*   npm or yarn package manager
*   Supabase CLI (optional, for local development)
*   Access to the development Supabase project
*   API Keys (for full functionality):
    - Supabase project credentials
    - Google Gemini API key (optional, for AI features)
    - Giphy API key (optional, for GIF integration)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/KrishnaConsciousnessSociety/chat.git
    cd chat
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Copy the example environment file and configure it with your Supabase credentials.
    ```bash
    cp .env.example .env.local
    ```
    
    Required environment variables:
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
    
    Optional environment variables:
    - `GEMINI_API_KEY`: Google Gemini API key for AI features
    - `NEXT_PUBLIC_GIPHY_API_KEY`: Giphy API key for GIF integration
    - `NEXT_PUBLIC_ENABLE_MONETIZATION`: Enable ads (true/false)
    - `NEXT_PUBLIC_ADSENSE_CLIENT_ID`: Google AdSense client ID
    - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: VAPID public key for push notifications
    - `VAPID_PRIVATE_KEY`: VAPID private key for push notifications

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 License

**Copyright (c) 2026 Krishna Connect.** All Rights Reserved.

This project is proprietary and confidential. unauthorized copying of this file, via any medium is strictly prohibited.
