# Architecture Overview

## System Context
Krishna Connect is a real-time messaging and social platform built using the **Next.js** framework and **Supabase** backend-as-a-service. It is designed for scalability, performance, and a seamless cross-platform user experience.

## Tech Stack
*   **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS.
*   **Backend**: Supabase (PostgreSQL 15+, GoTrue Auth, Realtime).
*   **Hosting**: Vercel (Edge Network).

## High-Level Architecture

### 1. Frontend Layer (Next.js)
The application leverages the **App Router** for efficient routing and server-side rendering.
-   **Server Components (`page.tsx`)**: Handle initial data fetching securely on the server.
-   **Client Components (`"use client"`)**: Handle interactivity (chat, forms, state).
-   **State Management**:
    -   **React Query**: For server state (caching, polling, infinite scroll).
    -   **Context API**: For global UI state (Auth, Theme, active chat).

### 2. Backend Layer (Supabase)
Supabase provides the core infrastructure:
-   **Authentication**: Managed via Supabase Auth (Email/Password, OAuth).
-   **Database**: PostgreSQL with complex relational data (posts, followers, chats).
-   **Realtime**: WebSocket subscriptions for instant message delivery and status updates.
-   **Storage**: S3-compatible storage for user uploads (avatars, banners, media).

### 3. Data flow
1.  **Read Operations**: Primarily use Supabase Client SDK directly in Server Components or via React Query in Client Components.
2.  **Write Operations**: complex writes (e.g., creating a DM, handling blocking) use **PostgreSQL RPC functions** (Stored Procedures) to ensure atomicity and logic encapsulation.
3.  **Security**: **Row Level Security (RLS)** policies enforce access control at the database level, ensuring no data leakage even if frontend constraints fail.

## Key Components

### Profile System
-   **`ProfileView`**: A robust component handling user details, banner/avatar display, follow actions, and content feeds (posts, media).
-   **Data Sync**: Updates to profiles (e.g., banner upload) sync immediately with the database and UI.

### Chat System
-   **`ChatList`**: Fetches active conversations.
-   **`ChatWindow`**: Real-time message rendering using subscriptions.
-   **Logic**: Uses a mixture of direct table inserts (`messages`) and specific RPCs (`create_dm_chat`) to manage participant integrity.

### Feed System
-   **Explore Page**: Infinite scroll feed of public posts.
-   **Post Card**: Reusable component for displaying posts, handling likes/reposts, and deletions.
