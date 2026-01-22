# Development Guidelines

## Getting Started
See the [Get Started](../README.md#getting-started-internal) section in the README.

## Code Standards
We use **TypeScript** and **Tailwind CSS**.
*   **Types**: Avoid `any`. Define interfaces in `@/types/index.ts` or local component files.
*   **Components**: Use functional components. Prefer small, reusable components.
*   **Styling**: Use Tailwind utility classes. Avoid custom CSS files unless necessary (`globals.css`).
*   **Icons**: Use `lucide-react`.

## Project Structure
*   `src/app/(app)`: Main application routes (authenticated).
*   `src/app/(auth)`: Authentication routes (login, register).
*   `src/components/ui`: Shadcn UI reusable components.
*   `src/lib`: Utilities and helpers.
*   `supabase`: SQL schemas and migrations.

## Workflow
1.  **Pull latest changes** from `main`.
2.  **Create a feature branch**: `git checkout -b feature/my-new-feature`.
3.  **Develop & Test**: Run `npm run dev` and test locally.
4.  **Commit**: Use descriptive commit messages.
5.  **Push & PR**: Push to GitHub and open a Pull Request for review.
