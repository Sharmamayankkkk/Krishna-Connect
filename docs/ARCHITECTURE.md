# Architecture Overview

## System Context
Krishna Connect is a real-time messaging and social platform built using the **Next.js** framework and **Supabase** backend-as-a-service. It is designed for scalability, performance, and a seamless cross-platform user experience. The platform includes advanced features like AI-powered content analysis, PWA support, push notifications, and comprehensive social networking capabilities.

## Tech Stack
*   **Frontend**: Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS, ShadCN UI.
*   **Backend**: Supabase (PostgreSQL 15+, GoTrue Auth, Realtime, Storage).
*   **State Management**: React Query (TanStack Query), React Context API.
*   **AI Integration**: Google Gemini (Genkit) for intelligent features.
*   **Media Integration**: Giphy API for GIF support.
*   **Push Notifications**: Web Push API with VAPID keys.
*   **Analytics**: Vercel Analytics + Speed Insights.
*   **Hosting**: Vercel (Edge Network) with CDN.

## High-Level Architecture

### 1. Frontend Layer (Next.js)
The application leverages the **App Router** for efficient routing and server-side rendering.
-   **Server Components (`page.tsx`)**: Handle initial data fetching securely on the server.
-   **Client Components (`"use client"`)**: Handle interactivity (chat, forms, state).
-   **State Management**:
    -   **React Query (TanStack Query)**: For server state (caching, polling, infinite scroll).
    -   **Context API**: For global UI state (Auth, Theme, active chat).
-   **PWA Support**: Service worker implementation for offline capabilities and installability.
-   **Push Notifications**: Web Push API integration for real-time alerts.

### 2. Backend Layer (Supabase)
Supabase provides the core infrastructure:
-   **Authentication**: Managed via Supabase Auth (Email/Password, OAuth providers).
-   **Database**: PostgreSQL with complex relational data (posts, followers, chats, events, groups).
-   **Realtime**: WebSocket subscriptions for instant message delivery, status updates, and live notifications.
-   **Storage**: S3-compatible storage for user uploads (avatars, banners, media files, documents).
-   **Row Level Security (RLS)**: Database-level access control ensuring data privacy and security.

### 3. Data flow
1.  **Read Operations**: Primarily use Supabase Client SDK directly in Server Components or via React Query in Client Components.
2.  **Write Operations**: complex writes (e.g., creating a DM, handling blocking) use **PostgreSQL RPC functions** (Stored Procedures) to ensure atomicity and logic encapsulation.
3.  **Security**: **Row Level Security (RLS)** policies enforce access control at the database level, ensuring no data leakage even if frontend constraints fail.

## Key Components

### Profile System
-   **`ProfileView`**: A robust component handling user details, banner/avatar display, follow actions, and content feeds (posts, media).
-   **Data Sync**: Updates to profiles (e.g., banner upload) sync immediately with the database and UI.
-   **Verification Badge**: Visual indicator for verified users.

### Chat System
-   **`ChatList`**: Fetches active conversations with real-time updates.
-   **`ChatWindow`**: Real-time message rendering using subscriptions.
-   **`ChatInput`**: Rich message composition with emoji picker, GIF support, and file attachments.
-   **Logic**: Uses a mixture of direct table inserts (`messages`) and specific RPCs (`create_dm_chat`, `get_dm_chat_id`) to manage participant integrity.
-   **Features**: Message editing, deletion, replies, reactions, forwarding, and starring.

### Feed System
-   **Explore Page**: Infinite scroll feed of public posts with search and filtering.
-   **Post Card**: Reusable component for displaying posts, handling likes/reposts, comments, and deletions.
-   **Post Creation**: Rich text editor with media upload, GIF picker, emoji support, and scheduling.
-   **Hashtags & Mentions**: Clickable tags that link to filtered views.

### Events System
-   **Event Creation**: Form for verified users to create community events.
-   **Event Discovery**: Browse and search upcoming events.
-   **RSVP System**: Track event attendance and participants.

### Groups/Communities
-   **Group Pages**: Dedicated spaces for topic-based discussions.
-   **Group Management**: Join, leave, and manage group memberships.
-   **Group Posts**: Topic-specific content feeds.

### Stories/Status
-   **24-Hour Content**: Ephemeral posts that disappear after 24 hours.
-   **Story Viewer**: Swipeable interface for viewing stories.
-   **Story Creation**: Quick capture and share interface.

### Notifications System
-   **Real-time Notifications**: Instant updates for interactions.
-   **Notification Types**: Likes, comments, mentions, follows, messages, event RSVPs.
-   **Push Notifications**: Web push for offline notifications.

### Analytics Dashboard
-   **Creator Insights**: Engagement metrics, reach, and performance data.
-   **Charts & Graphs**: Visual representation using Recharts.
-   **Time-based Filtering**: View metrics by date range.

### AI Features
-   **Content Analysis**: Google Gemini integration for smart features.
-   **Translation**: Multi-language support for posts and messages.
-   **Smart Replies**: AI-suggested responses (in development).

### Settings & Customization
-   **Appearance**: Light/dark mode, chat wallpapers, bubble colors.
-   **Privacy**: Control profile visibility, post privacy, and blocking.
-   **Security**: Password management, session control (2FA planned).
-   **Promotions**: Ad settings and monetization options.
