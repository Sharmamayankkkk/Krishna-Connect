
# Project Synopsis: Krishna Connect

---

### **1. Title**
**Krishna Connect: Where Devotees Unite**

---

### **2. Introduction / Background**
In an increasingly digital world, spiritual communities seek dedicated spaces to foster connection, share wisdom, and organize activities. Krishna Connect is a modern, real-time chat application designed to serve this need for the conscious community of Krishna devotees. It aims to provide a secure, feature-rich, and spiritually uplifting alternative to mainstream messaging platforms, which are often filled with distractions.

The project was undertaken to create a sacred digital *satsang* (spiritual gathering) where members can engage in meaningful conversations, coordinate *seva* (selfless service), and deepen their collective spiritual journey, free from the noise of commercial social media.

---

### **3. Objectives**
The primary objectives of Krishna Connect are:
- **To Foster Community:** Create a centralized platform for devotees to connect, communicate, and build strong, supportive relationships.
- **To Facilitate Communication:** Provide robust real-time messaging features, including one-on-one DMs, group chats (Circles), and channels for announcements.
- **To Enhance User Experience:** Deliver a beautiful, intuitive, and highly performant user interface that is both a joy to use and customizable to individual preferences.
- **To Ensure a Safe & Sacred Space:** Implement features like user reporting to maintain a respectful and secure environment.
- **To Support Community Activities:** Integrate features for organizing and managing events, with special permissions for "Verified Users."
- **To Be Extensible:** Build upon a modern, scalable tech stack that allows for future feature development and community growth.

---

### **4. Scope**
The scope of the project defines its boundaries, outlining what is included and what is intentionally excluded.

#### **In-Scope:**
- **User Authentication:** Secure sign-up, login (email/password & OAuth), password recovery, and profile management.
- **Real-Time Messaging:** One-on-one and group chats with typing indicators, read receipts, and online status.
- **Rich Media:** Sharing of images, documents, voice notes, GIFs (via Giphy), and emojis.
- **Message Interactions:** Reactions, replies, editing, deleting, forwarding, and starring messages.
- **Advanced Features:** Text formatting, link previews, `@mentions`, and hashtags.
- **Customization:** Light/dark modes and customizable chat appearance (bubble colors, wallpapers).
- **Community Management:** Democratized group creation, user-powered reporting, and content moderation.
- **Event System:** Creation of events by "Verified Users," with open RSVP for all community members.
- **Feed System:** Public posts with likes, reposts, comments, and infinite scroll.
- **Stories/Status:** Ephemeral 24-hour content sharing.
- **Bookmarks:** Save and organize favorite posts.
- **Notifications:** Real-time notifications for interactions, mentions, and events.
- **Search & Explore:** Discover users, posts, hashtags, and trending content.
- **Analytics Dashboard:** Insights and metrics for content creators.
- **Progressive Web App (PWA):** Installable web app with service worker and offline support.
- **Push Notifications:** Web push notifications for real-time alerts.
- **AI-Powered Features:** Content analysis and smart features using Google Gemini.
- **Image Editing:** Built-in cropping, rotation, and filters.
- **Content Scheduling:** Schedule posts for future publication.
- **Collaborative Posts:** Multi-author content creation.
- **Thread Support:** Connected series of posts.
- **Monetization:** Optional ads integration (Google AdSense).
- **Privacy & Security:** Advanced privacy controls, user blocking, and account security settings.

#### **Out-of-Scope (for the current version):**
- **Live Video/Audio Calls:** While planned for the future, real-time video/audio calling is not part of the initial scope.
- **E-commerce or Donations:** The platform will not handle financial transactions.
- **Native Mobile Applications:** The product is a responsive Progressive Web App (PWA). Native iOS/Android apps are a future consideration.
- **Live Audio Spaces:** Voice-only rooms (in development).
- **NFT Integration:** Digital collectibles and verified profile pictures (planned).
- **AR Filters:** Augmented reality camera effects (planned).
- **Advanced Lists:** Custom user feed curation (planned).

---

### **5. Methodology / Approach**
The project follows an **Agile development methodology**, characterized by iterative development cycles.
1.  **Requirement Gathering:** Features are defined based on the core needs of a spiritual community and inspired by best practices from modern chat applications.
2.  **Design & Prototyping:** User interface and experience are designed using a component-based approach with ShadCN UI and Figma mockups.
3.  **Development Sprints:** Development is broken down into small, manageable tasks. The front end (Next.js) and back end (Supabase) are developed in parallel.
4.  **Database-First Approach:** The database schema is designed first in Supabase, with security rules (RLS) being a primary consideration.
5.  **Testing & QA:** Manual testing is performed at the end of each feature implementation to ensure functionality and identify bugs.
6.  **Deployment:** The application is deployed on Vercel, leveraging its seamless integration with Next.js and serverless functions.
7.  **Feedback & Iteration:** Post-launch, user feedback will be collected to guide future development cycles.

---

### **6. Tools & Technologies Used**
- **Framework:** **Next.js 16** (App Router)
- **UI Library:** **React 18**
- **UI Components:** **ShadCN UI**
- **Styling:** **Tailwind CSS**
- **Backend & Database:** **Supabase** (PostgreSQL 15+, GoTrue Auth, Storage, Realtime)
- **Language:** **TypeScript**
- **State Management:** **React Query (TanStack Query)** + **React Context**
- **Forms:** **React Hook Form** + **Zod**
- **AI Integration:** **Google Gemini (Genkit)**
- **GIF Integration:** **Giphy API**
- **Image Processing:** **react-easy-crop**, **react-image-crop**
- **Push Notifications:** **Web Push API** + **web-push**
- **Analytics:** **Vercel Analytics** + **Vercel Speed Insights**
- **Icons:** **Lucide React**
- **Deployment:** **Vercel**
- **Package Management:** **npm**
- **Version Control:** **Git & GitHub**

---

### **7. System Architecture & Data Flow**

#### **High-Level Architecture Diagram**
This diagram illustrates the main components of the system and their interactions.

```mermaid
graph TD
    subgraph "User"
        A[Browser / PWA]
    end

    subgraph "Vercel"
        B[Next.js Frontend]
    end
    
    subgraph "Supabase Cloud"
        C[Supabase Auth]
        D[PostgreSQL Database]
        E[Realtime Engine]
        F[Storage]
    end

    subgraph "Third-Party OAuth"
        G[Google]
        H[Facebook]
    end

    A -- HTTP/S Requests --> B
    B -- API Calls / SDK --> C
    B -- API Calls / SDK --> D
    B -- WebSocket Connection --> E
    B -- API Calls / SDK --> F
    
    C -- OAuth Handshake --> G
    C -- OAuth Handshake --> H
```

#### **Chat Message Data Flow Diagram**
This diagram shows the sequence of events when a user sends a message.

```mermaid
sequenceDiagram
    participant UserA as User A's Browser
    participant App as Next.js App (Vercel)
    participant DB as Supabase DB
    participant RT as Supabase Realtime
    participant UserB as User B's Browser

    UserA->>+App: Types and sends a message
    App->>+DB: Inserts new message into 'messages' table
    DB-->>-App: Confirms insertion
    DB->>RT: Triggers database change event (INSERT)
    RT-->>UserA: Pushes new message (confirms sent status)
    RT-->>UserB: Pushes new message to other participants
    UserB->>UserB: Renders new message in UI
    App-->>-UserA: Updates UI to show message as sent/delivered
```

---

### **8. Database Schema**
*(The database schema is defined in the `supabase/schema.sql` file in the project repository. It is critical to run this file in the Supabase SQL Editor during initial setup.)*

---

### **9. Expected Outcomes**
Upon completion, the project will deliver:
- **A Fully Functional Web Application:** A responsive and performant chat application accessible from any modern web browser.
- **Secure & Scalable Backend:** A complete backend system powered by Supabase, capable of handling authentication, data storage, and real-time communication for a growing user base.
- **Comprehensive Feature Set:** All features listed in the "In-Scope" section will be implemented and functional.
- **Project Documentation:** Well-documented code, a detailed README, and this synopsis to facilitate maintenance and future development.

---

### **10. Timeline (High-Level Phases)**
- **Phase 1: Foundation & Core Chat (Completed)**
  - Setup of Next.js project, Supabase, and Vercel.
  - Implementation of user authentication and profiles.
  - Development of core real-time messaging (DMs and groups).
- **Phase 2: Feature Enhancement (Completed)**
  - Addition of rich media (images, files, voice notes).
  - Implementation of message replies, reactions, editing, and deleting.
  - UI/UX improvements, including theme customization.
- **Phase 3: Democratization & Refinement (Completed)**
  - Removal of all admin-related code and UI.
  - Democratization of features like group creation.
  - Introduction of the "Verified User" role for event creation.
- **Phase 4: Future Growth (Future)**
  - Exploration of native mobile app development.
  - Integration of real-time audio/video calls.

---

### **11. Conclusion**
Krishna Connect is more than a software project; it is a digital tool for community building and spiritual nourishment. By leveraging modern web technologies, it provides a tailored, safe, and engaging environment that meets the unique needs of the devotee community. Its successful implementation will offer a valuable resource that strengthens bonds, facilitates collaboration, and supports the shared spiritual path of its members.
