# Contributing to Scholarly

Welcome! This guide helps new developers get up to speed quickly.

## Code Style

### TypeScript

- Use TypeScript for all files
- Prefer `interface` over `type` for object shapes
- Use explicit return types on exported functions
- Avoid `any` - use `unknown` if type is truly unknown

### Formatting

We use Prettier for consistent formatting:

```bash
pnpm format        # Format all files
pnpm format:check  # Check formatting
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `CareerCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatSalary.ts`)
- Routes: `kebab-case` folders (e.g., `career-detail/`)

### File Size

Keep files under 200 lines. If larger, split into smaller modules.

## Documentation

### JSDoc

Add JSDoc to exported functions:

```typescript
/**
 * Fetches a career by ID.
 * @param id - The career's unique identifier
 * @returns Career with skills and abilities
 * @throws NotFoundError if career doesn't exist
 */
export async function getCareerById(id: string): Promise<Career> {
  // ...
}
```

### Comments

- Only add comments for non-obvious logic
- Prefer self-documenting code (good names, small functions)
- Don't add organizational comments like `// Section: X`

## Component Patterns

### Server vs Client Components

Default to **Server Components**. Add `'use client'` only when you need:
- Event handlers (`onClick`, `onChange`)
- Hooks (`useState`, `useEffect`)
- Browser APIs

### Colocation

Keep related files together:

```
career/
├── [id]/
│   ├── page.tsx       # Route component
│   ├── loading.tsx    # Loading state
│   └── error.tsx      # Error boundary
```

## Git Workflow

### Commit Messages

Follow conventional commits:

```
feat: add career search functionality
fix: correct salary formatting
docs: update setup instructions
refactor: simplify auth logic
```

### Pull Requests

1. Create a feature branch: `git checkout -b feat/career-search`
2. Make small, focused commits
3. Open PR with description of changes
4. Request review

## Getting Help

- Check existing code for patterns
- Ask questions in team chat
- Review the README for setup issues
