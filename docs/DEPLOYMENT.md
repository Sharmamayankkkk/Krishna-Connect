# Deployment Guide

This project is optimized for deployment on **Vercel**, which provides built-in support for Next.js App Router and edge functions.

## Production Requirements

1.  **Vercel Account**: A Pro or Enterprise team account is recommended for production workloads.
2.  **Supabase Project**: A dedicated production project (separate from dev).
3.  **Domain Names**: 
    - Primary: `krishnaconnect.in`
    - Secondary: `chat.krishnaconsciousnesssociety.com`

## Environment Variables

Ensure the following variables are set in the Vercel Project Settings:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of your production Supabase instance. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public "anon" API key for Supabase. |

> **Security Note:** Never expose the `service_role` key in frontend environment variables.

## Deployment Steps

1.  **Push to `main`**: Ensure all code is reviewed and merged into the `main` branch.
2.  **Automatic Build**: Vercel will detect the commit and start a build automatically.
3.  **Verification**:
    -   Check the "Deployments" tab in Vercel.
    -   Verify that build logs show no errors.
    -   Test the preview URL before promoting if using a staging workflow.

## Database Migrations

When deploying code that requires schema changes:
1.  Run the necessary SQL scripts in the **production** Supabase SQL Editor.
2.  Verify no breaking changes (e.g., column renames) affect the currently live app before the new code is deployed.
