<div align="center">
  <img src="https://chat.krishnaconsciousnesssociety.com/logo/light_KCS.svg" alt="Krishna Connect Logo" width="150">
  
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

*   **Real-Time Messaging**: one-on-one DMs, group chats, and community circles.
*   **Media Sharing**: Rich text, images, voice notes, and file attachments.
*   **User Profiles**: Customizable profiles with banners, avatars, and social stats.
*   **Community Safety**: Built-in reporting and blocking systems.
*   **Events**: Create and RSVP to community events.
*   **Cross-Platform**: Responsive design for web and mobile.

---

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + ShadCN UI
*   **Backend**: Supabase (PostgreSQL, Auth, Realtime)
*   **Deployment**: Vercel

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

*   Node.js v18+
*   Supabase CLI (optional)
*   Access to the development Supabase project

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

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 License

**Copyright (c) 2026 Krishna Connect.** All Rights Reserved.

This project is proprietary and confidential. unauthorized copying of this file, via any medium is strictly prohibited.
