# Development Guidelines

## Getting Started
See the [Get Started](../README.md#getting-started-internal) section in the README.

## Code Standards
We use **TypeScript** and **Tailwind CSS** with strict quality guidelines.

### TypeScript
*   **Types**: Avoid `any`. Define interfaces in `@/types/index.ts` or local component files.
*   **Strict Mode**: Keep `strict: true` in `tsconfig.json`.
*   **Null Safety**: Use optional chaining (`?.`) and nullish coalescing (`??`).
*   **Type Imports**: Use `import type` for type-only imports.

### Components
*   **Functional Components**: Always use functional components with hooks.
*   **Server vs Client**: Default to Server Components; use `"use client"` only when needed.
*   **Component Size**: Prefer small, focused, reusable components.
*   **Props**: Define explicit TypeScript interfaces for all props.
*   **Hooks**: Keep custom hooks in `@/hooks` directory.

### Styling
*   **Tailwind**: Use Tailwind utility classes as primary styling method.
*   **Custom CSS**: Avoid custom CSS files unless absolutely necessary (use `globals.css` sparingly).
*   **ShadCN**: Leverage ShadCN UI components for consistency.
*   **Responsive**: Always consider mobile-first responsive design.
*   **Dark Mode**: Support both light and dark themes using `next-themes`.

### Icons
*   **Library**: Use `lucide-react` for all icons.
*   **Consistency**: Maintain consistent icon sizes and styling.

### Data Fetching
*   **Server Components**: Use direct Supabase calls for initial data.
*   **Client Components**: Use React Query for caching and real-time updates.
*   **Error Handling**: Always handle loading and error states.
*   **Optimistic Updates**: Implement for better UX in mutations.

### State Management
*   **Local State**: Use `useState` for component-local state.
*   **Server State**: Use React Query (TanStack Query) for API data.
*   **Global State**: Use Context API for auth, theme, and global UI state.
*   **Avoid Props Drilling**: Use Context or composition patterns.

## Project Structure
```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (app)/        # Main authenticated routes
│   │   │   ├── chat/     # Messaging system
│   │   │   ├── events/   # Events management
│   │   │   ├── explore/  # Discovery feed
│   │   │   ├── feed/     # Personal feed
│   │   │   ├── groups/   # Communities
│   │   │   ├── profile/  # User profiles
│   │   │   ├── settings/ # User settings
│   │   │   └── ...       # Other features
│   │   ├── (auth)/       # Authentication routes
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── ...
│   │   ├── (legal)/      # Legal pages
│   │   ├── api/          # API routes
│   │   │   ├── push/     # Push notifications
│   │   │   └── ...
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Shared components
│   │   ├── ui/           # ShadCN UI components
│   │   ├── ads/          # Advertisement components
│   │   └── ...           # Feature components
│   ├── lib/              # Utilities and helpers
│   │   ├── supabase/     # Supabase client setup
│   │   ├── utils.ts      # Common utilities
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── ai/               # AI features (Genkit)
│   │   └── flows/        # AI workflows
│   ├── providers/        # Context providers
│   └── proxy.ts     # Next.js proxy
├── public/               # Static assets
│   ├── icons/            # PWA icons
│   ├── manifest.json     # PWA manifest
│   └── service-worker.js # Service worker
├── supabase/
│   └── migrations/       # Database migrations
├── docs/                 # Documentation
└── ...
```

## Workflow
1.  **Pull latest changes** from `main`.
    ```bash
    git checkout main
    git pull origin main
    ```
2.  **Create a feature branch**: Use descriptive naming.
    ```bash
    git checkout -b feature/my-new-feature
    # or
    git checkout -b fix/bug-description
    ```
3.  **Develop & Test**: 
    - Run `npm run dev` for development server.
    - Test features thoroughly in browser.
    - Check mobile responsiveness.
    - Verify dark mode compatibility.
    - Test real-time features with multiple tabs/devices.
4.  **Type Checking**: Run TypeScript compiler.
    ```bash
    npm run typecheck
    ```
5.  **Linting**: Check code quality.
    ```bash
    npm run lint
    ```
6.  **Commit**: Use descriptive commit messages following conventional commits.
    ```bash
    git add .
    git commit -m "feat: add new feature"
    # or
    git commit -m "fix: resolve issue with..."
    ```
7.  **Push & PR**: Push to GitHub and open a Pull Request for review.
    ```bash
    git push origin feature/my-new-feature
    ```

## Available Scripts

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)

# AI Development (optional)
npm run genkit:dev       # Start Genkit development server
npm run genkit:watch     # Start Genkit with watch mode

# Production
npm run build            # Build for production
npm start                # Start production server

# Quality Checks
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler check
```

## Development Best Practices

### Real-time Features
- Always handle connection/disconnection states.
- Implement proper error boundaries.
- Clean up subscriptions in `useEffect` cleanup.
- Test with slow network conditions.

### Database Operations
- Use RLS policies for security - never bypass them.
- Test with different user roles and permissions.
- Optimize queries with proper indexes.
- Use RPCs for complex multi-step operations.

### Performance
- Use Next.js Image component for images.
- Implement infinite scroll for large lists.
- Lazy load heavy components.
- Monitor bundle size.
- Use React.memo() judiciously.

### Accessibility
- Include proper ARIA labels.
- Ensure keyboard navigation works.
- Test with screen readers.
- Maintain good color contrast ratios.

### Testing
- Test authentication flows thoroughly.
- Verify RLS policies prevent unauthorized access.
- Test with multiple user accounts.
- Check mobile and tablet layouts.
- Test PWA installation and offline functionality.

### Maintenance Mode
To enable maintenance mode locally:
1. Set `NEXT_PUBLIC_MAINTENANCE_MODE=true` in `.env.local`.
2. Restart the dev server.
3. Access the app to see the maintenance screen.
4. To bypass, use `http://localhost:3000?bypass=YOUR_SECRET` (set `MAINTENANCE_BYPASS_SECRET` in `.env.local`).

## Common Development Tasks

### Adding a New Page
1. Create page file in appropriate `(app)` subdirectory.
2. Export default async function for Server Component.
3. Add to navigation if needed.
4. Test authentication requirements.

### Adding a New API Route
1. Create route handler in `src/app/api/`.
2. Implement proper error handling.
3. Add authentication checks.
4. Document expected request/response format.

### Adding a New Component
1. Create component in `src/components/` or feature-specific directory.
2. Define TypeScript props interface.
3. Document usage with JSDoc comments.
4. Add to Storybook if applicable.

### Working with Supabase
1. Test queries in Supabase SQL Editor first.
2. Verify RLS policies allow/deny correctly.
3. Use TypeScript types from Supabase generated types.
4. Handle realtime subscriptions properly.
