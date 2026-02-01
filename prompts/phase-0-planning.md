# Phase 0: Planning & Setup

**Focus:** Project foundation, documentation, and demo app creation

**Status:** Active

---

## Overview

Phase 0 establishes the foundation for QAgent development. This includes completing all documentation, setting up the development environment, and creating the Next.js demo application with intentional bugs that the system will later fix.

---

## Skills to Load

None required - this is a documentation and setup phase.

---

## Ralph Loop Template

```
## Ralph Loop - Phase 0 - Iteration [N]

### 1. READ
- [ ] Load CLAUDE.md for project context
- [ ] Check TASKS.md for Phase 0 tasks
- [ ] Review docs/PRD.md for requirements
- [ ] Review docs/DESIGN.md for data structures
- [ ] Review docs/ARCHITECTURE.md for decisions

### 2. ANALYZE
- Current task: [Task ID and description]
- Blockers: [Any dependencies or missing info]
- Files to create/modify: [List]

### 3. PLAN
Increments for this iteration:
1. [Specific deliverable 1]
2. [Specific deliverable 2]
3. [Specific deliverable 3]

### 4. EXECUTE
[Implement one increment at a time]

### 5. VALIDATE
- [ ] Documentation complete (no [TODO] placeholders)
- [ ] Code compiles without errors
- [ ] pnpm install succeeds
- [ ] pnpm dev starts successfully

### 6. LOOP
- [ ] Update TASKS.md with progress
- [ ] Commit working code
- [ ] Continue to next task or end iteration
```

---

## Tasks

### P0.1: Complete PRD
- [ ] Define all 7 core features with acceptance criteria
- [ ] Document success metrics
- [ ] Specify user flows
- [ ] List non-functional requirements

### P0.2: Document Architecture
- [ ] Write Architecture Decision Records (ADRs)
- [ ] Create system diagrams
- [ ] Define agent interfaces
- [ ] Document data structures

### P0.3: Set Up Development Environment
- [ ] Initialize pnpm workspace
- [ ] Configure TypeScript
- [ ] Set up ESLint and Prettier
- [ ] Create .env.example with all variables
- [ ] Add .gitignore

### P0.4: Create Next.js Demo App
- [ ] Initialize Next.js 14+ with App Router
- [ ] Create pages: Home, Products, Cart, Checkout
- [ ] Add basic styling (Tailwind CSS)
- [ ] Implement user authentication flow
- [ ] Add payment processing mock

### P0.5: Plant Intentional Bugs
The demo app must have exactly 3 intentional bugs:

1. **Missing onClick Handler (UI_BUG)**
   - Location: `src/components/Checkout.tsx`
   - Bug: Checkout button has no onClick handler
   - Expected: Button should trigger payment flow

2. **Wrong API Route (BACKEND_ERROR)**
   - Location: `src/app/api/payment/route.ts`
   - Bug: Route is `/api/payments` but code calls `/api/payment`
   - Expected: Payment API should work

3. **Null Reference (DATA_ERROR)**
   - Location: `src/components/Cart.tsx`
   - Bug: Accessing `item.price` without null check when cart is empty
   - Expected: Should handle empty cart gracefully

---

## Validation Checklist

### Documentation
- [ ] CLAUDE.md has all sections filled
- [ ] TASKS.md has all 8 phases with tasks
- [ ] PRD.md has features, metrics, user flows
- [ ] DESIGN.md has data structures and diagrams
- [ ] ARCHITECTURE.md has ADRs for all integrations

### Environment
- [ ] `pnpm install` completes without errors
- [ ] `pnpm dev` starts Next.js on localhost:3000
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] `.env.example` documents all required variables

### Demo App
- [ ] Home page loads with product list
- [ ] Products can be added to cart
- [ ] Cart displays items correctly
- [ ] Checkout page is accessible
- [ ] All 3 intentional bugs are in place
- [ ] Bugs are NOT obvious (realistic scenarios)

---

## Demo App Structure

```
demo-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── products/
│   │   │   └── page.tsx          # Product listing
│   │   ├── cart/
│   │   │   └── page.tsx          # Shopping cart
│   │   ├── checkout/
│   │   │   └── page.tsx          # Checkout flow
│   │   └── api/
│   │       └── payments/         # Payment API (note: plural)
│   │           └── route.ts
│   ├── components/
│   │   ├── Checkout.tsx          # BUG 1: Missing onClick
│   │   ├── Cart.tsx              # BUG 3: Null reference
│   │   ├── ProductCard.tsx
│   │   └── Header.tsx
│   └── lib/
│       └── api.ts                # BUG 2: Wrong route
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## Exit Criteria

Phase 0 is complete when:

1. All documentation has substantive content
2. Development environment is fully configured
3. Demo app runs locally without errors
4. All 3 intentional bugs are planted and verified
5. Manual testing confirms bugs cause failures
6. Code is committed and pushed

---

## Next Phase

Upon completion, proceed to **Phase 1: Test Environment** where we integrate Browserbase and Stagehand to create the Tester Agent that will detect these bugs.

---

## References

- [docs/PRD.md](../docs/PRD.md) - Product requirements
- [docs/DESIGN.md](../docs/DESIGN.md) - System design
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Architecture decisions
- [TASKS.md](../TASKS.md) - Task tracking
