# Frontend SaaS Architecture Review

Act as a senior frontend staff engineer reviewing a production-grade AI-assisted SaaS application.

Project Context:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React
- AI-assisted data cleaning workflow

Your job is to review the codebase for:

## Architecture
- incorrect component structure
- unnecessary complexity
- poor folder organization
- missing abstractions
- premature optimization
- prop drilling
- state management issues

## Frontend Engineering Quality
- React anti-patterns
- unnecessary re-renders
- bad hooks usage
- incorrect client/server component usage
- accessibility issues
- responsiveness issues
- Tailwind misuse
- poor loading/error states

## Product Engineering
- weak workflow UX
- inconsistent interaction patterns
- missing empty states
- unrealistic data workflows
- poor information hierarchy

## Code Quality
- naming inconsistencies
- dead code
- duplication
- bad TypeScript typing
- poor separation of concerns

## Output Format

Return findings in this format:

Severity:
- Critical
- High
- Medium
- Low

For each issue include:
1. Problem
2. Why it matters
3. Recommended fix
4. Example refactor if needed

Focus on realistic production-level improvements.
Avoid generic beginner feedback.

# Objective

You are acting as a senior frontend staff engineer reviewing a modern SaaS AI-assisted data cleaning application.

Your task is to deeply analyze the codebase for:

- architectural issues
- React anti-patterns
- poor component structure
- scalability concerns
- bad state management decisions
- accessibility problems
- inconsistent UI patterns
- Tailwind misuse
- folder structure problems
- TypeScript weaknesses
- maintainability concerns
- unnecessary complexity
- frontend performance risks
- re-render risks
- prop-drilling risks
- naming inconsistencies
- poor separation of concerns
- code smells
- enterprise-readiness gaps

Focus especially on:
- Next.js app router practices
- shadcn/ui usage
- React component composition
- frontend scalability
- SaaS product architecture
- AI workflow UX consistency

For every issue found:
1. Explain WHY it is a problem
2. Explain severity (low/medium/high)
3. Provide a recommended fix
4. Mention whether this matters in production-scale systems

Do NOT praise the codebase excessively.
Be direct, technical, and critical like a senior engineer during a production readiness review.

Prioritize:
- architecture
- maintainability
- scalability
- frontend engineering quality

over stylistic preferences.