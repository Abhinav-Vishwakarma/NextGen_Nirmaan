<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md — Frontend (Next.js + Redux Toolkit Query)

> Read the root `/AGENTS.md` first, then this file.
> This file governs everything inside the `frontend/` directory.

---

## Folder Structure

```
frontend/
├── app/                          # Next.js App Router (pages & layouts)
│   ├── layout.tsx                # Root layout — providers go here only
│   ├── page.tsx                  # Home page
│   ├── error.tsx                 # Route-level error boundary
│   ├── loading.tsx               # Route-level loading UI
│   ├── not-found.tsx
│   ├── (auth)/                   # Route group — public auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── page.tsx          # Logto OIDC redirect handler
│   └── (protected)/              # Route group — requires auth
│       ├── layout.tsx            # AuthGuard wraps this layout
│       ├── dashboard/
│       │   └── page.tsx
│       └── [feature]/
│           └── page.tsx
│
├── components/
│   ├── ui/                       # Dumb, stateless, reusable primitives
│   │   ├── Button/
│   │   │   ├── index.ts          # Re-export only
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   └── Button.test.tsx
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Card/
│   │   └── index.ts              # Barrel export for all ui/ components
│   │
│   └── features/                 # Smart, domain-specific components
│       ├── auth/
│       │   ├── AuthGuard.tsx     # Wraps protected routes
│       │   └── UserMenu.tsx
│       └── [feature]/
│           ├── index.ts
│           ├── FeatureName.tsx
│           ├── FeatureName.types.ts
│           └── FeatureName.test.tsx
│
├── store/
│   ├── index.ts                  # Store configuration — do not edit structure
│   ├── hooks.ts                  # Typed useAppDispatch, useAppSelector
│   ├── slices/                   # UI state only — no server data here
│   │   ├── ui.slice.ts           # Modals, toasts, sidebar state
│   │   └── auth.slice.ts         # Token + decoded user info from Logto
│   └── api/
│       ├── base-query.ts         # fetchBaseQuery with auth header injection
│       ├── main-api.ts           # RTK Query for nest-server (/api/v1)
│       └── ai-api.ts             # RTK Query for ai-service via nest (/api/v1/ai)
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Logto state + token access
│   ├── useToast.ts
│   └── index.ts
│
├── lib/
│   ├── logto.ts                  # Logto client config singleton
│   ├── logger.ts                 # Frontend logger (wraps console in dev only)
│   └── utils.ts                  # Pure utility functions (cn, formatDate, etc.)
│
├── types/
│   ├── api.types.ts              # Shared API request/response types
│   ├── auth.types.ts             # Logto token payload types
│   └── index.ts
│
├── public/
├── .env.local                    # Local only — gitignored
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Rules

### App Router

- **Server Components by default.** Only add `"use client"` when you need: event handlers, browser APIs, React hooks, or Redux.
- **Never** use the `pages/` directory. This project uses App Router exclusively.
- Route groups `(auth)` and `(protected)` are not URL segments — use them for layout grouping only.
- `app/layout.tsx` is the only place to add global Providers. Do not add providers anywhere else.

### Server vs Client Data Fetching

```
Initial page data      → Server Component fetch (no RTK Query)
Client interactions    → RTK Query hooks (useGetXQuery, useCreateXMutation)
Local UI state         → Redux slice (useAppSelector, useAppDispatch)
Form state             → React Hook Form (local, never Redux)
```

- **Never** use `useEffect + fetch` for data fetching. RTK Query handles all client-side fetching.
- **Never** store server-fetched data in a Redux slice. It lives in the RTK Query cache.

### Store Structure

```typescript
// store/index.ts — DO NOT modify the shape without updating this file
import { configureStore } from '@reduxjs/toolkit'
import { mainApi } from './api/main-api'
import { aiApi } from './api/ai-api'
import { uiSlice } from './slices/ui.slice'
import { authSlice } from './slices/auth.slice'

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    auth: authSlice.reducer,
    [mainApi.reducerPath]: mainApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
  },
  middleware: (gDM) => gDM().concat(mainApi.middleware, aiApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

- `mainApi` → nest-server endpoints (base: `/api/v1`)
- `aiApi` → AI endpoints routed through nest-server (base: `/api/v1/ai`)
- Frontend **never** calls FastAPI directly. All AI calls go through NestJS.

### RTK Query API Definition Pattern

```typescript
// store/api/main-api.ts
import { createApi } from '@reduxjs/toolkit/query/react'
import { fetchBaseQueryWithAuth } from './base-query'

export const mainApi = createApi({
  reducerPath: 'mainApi',
  baseQuery: fetchBaseQueryWithAuth('/api/v1'),
  tagTypes: ['User', 'Document'],   // Define ALL cache tags here
  endpoints: (builder) => ({
    getUser: builder.query<UserResponse, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }],
    }),
    updateUser: builder.mutation<UserResponse, UpdateUserDto>({
      query: (body) => ({ url: `/users/${body.id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }],
    }),
  }),
})

export const { useGetUserQuery, useUpdateUserMutation } = mainApi
```

- **Always** type both the response and the argument generics.
- **Always** define `providesTags` on queries and `invalidatesTags` on mutations.
- **Never** use `fetchBaseQuery` directly in endpoints. Use `fetchBaseQueryWithAuth`.

### Base Query with Auth

```typescript
// store/api/base-query.ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

export const fetchBaseQueryWithAuth = (baseUrl: string) =>
  fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  })
```

- This is the **only** place the token is attached to outgoing requests.
- Never manually set `Authorization` headers anywhere else.

### Component Rules

```
components/ui/        ← Zero Redux. Zero API calls. Props only. Fully typed.
components/features/  ← May use Redux hooks and RTK Query hooks.
```

- One component per file. File name matches component name exactly.
- Every component folder has an `index.ts` that re-exports the component.
- Props interfaces are in a separate `.types.ts` file for components with >3 props.
- **Never** put API calls inside a component body. Use RTK Query hooks only.

### Authentication

- Logto client is configured as a singleton in `lib/logto.ts`.
- The client is bootstrapped inside `LogtoProvider` in `app/layout.tsx`.
- On successful auth: decode the token, store `{ token, user }` in `auth` slice.
- Protected pages live under `app/(protected)/`. The layout wraps with `<AuthGuard>`.
- `AuthGuard` reads from `auth` slice. If no token → redirect to `/login`.
- **Never** check auth state inside individual page components. It belongs in `AuthGuard`.
- Token refresh: handled exclusively inside `LogtoProvider`. Do not add refresh logic elsewhere.

### Logto Token Shape (TypeScript)

```typescript
// types/auth.types.ts
export interface LogtoTokenPayload {
  sub: string           // User ID
  email: string
  name: string
  username: string
  roles: string[]       // ['admin', 'user', 'ai_user', 'readonly']
  exp: number
}

export interface AuthState {
  token: string | null
  user: LogtoTokenPayload | null
  isAuthenticated: boolean
}
```

### TypeScript Rules

- `"strict": true` is enforced. No `any`. No `@ts-ignore` without a comment.
- All exported functions and components must have explicit return types.
- Use `type` for object shapes. Use `interface` only when extending is needed.
- Path aliases are configured in `tsconfig.json`:
  ```
  @/components/* → components/*
  @/store/*      → store/*
  @/lib/*        → lib/*
  @/hooks/*      → hooks/*
  @/types/*      → types/*
  ```

### Styling

- **Tailwind CSS** only. No inline `style={{}}` objects except for truly dynamic values (e.g., calculated widths).
- Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional classes.
- No CSS modules. No styled-components.

### What Agents Must NEVER Do in Frontend

- ❌ Add `"use client"` to a component that has no client-side needs
- ❌ Call `fetch()` or `axios` directly in a component or hook — use RTK Query
- ❌ Store API response data in a Redux slice — it lives in RTK Query cache
- ❌ Call `/ai/*` or `:8000` directly — all requests go through `/api/*` (NestJS)
- ❌ Use `localStorage` for tokens or user data
- ❌ Create a new Logto client instance anywhere other than `lib/logto.ts`
- ❌ Add global providers anywhere other than `app/layout.tsx`
- ❌ Use `pages/` directory

<!-- END:nextjs-agent-rules -->