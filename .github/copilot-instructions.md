---
applyTo: '**'
---

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## Coding Guidelines

- Always keep in mind that this repository is public and open-source.
- Always add the relative file path as a comment in the first line of every file (e.g., `// src/components/MyComponent.ts`)
- Use TypeScript strict mode and enable all recommended linting rules
- Follow consistent naming conventions: camelCase for variables/functions, PascalCase for classes/components
- Include comprehensive JSDoc comments for all public APIs and complex functions
- Prefer explicit typing over `any` type - use proper interfaces and type definitions
- Implement proper error handling with meaningful error messages
- Write unit tests for all business logic and critical functionality
- Use semantic commit messages following conventional commit format
- Keep functions small and focused on a single responsibility
- Organize imports: external libraries first, then internal modules, separated by blank lines
- Write comprehensive documentation but avoid excessive inline comments - code should be self-documenting through clear naming and structure
- Always check if there is existing code implemented for the use case before creating new implementations - follow DRY (Don't Repeat Yourself) principles
