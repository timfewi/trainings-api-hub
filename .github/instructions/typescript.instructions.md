---
applyTo: "**/*.ts"
---

# TypeScript Development Guidelines

**Type Safety**: Use strict TypeScript mode with `noImplicitAny`, `strictNullChecks`. Prefer explicit types over `any`. Define interfaces for all data structures, API responses, and function parameters. Use union types and generics appropriately.

**Naming Conventions**:

- camelCase: variables, functions (`getUserData`, `isValid`)
- PascalCase: classes, interfaces, types (`UserService`, `ApiResponse`)
- UPPER_SNAKE_CASE: constants (`API_BASE_URL`, `MAX_RETRIES`)

**Code Structure**: Add relative file path as first line comment (`// src/services/UserService.ts`). Organize imports: external libraries first, internal modules second, separated by blank lines. Use barrel exports for clean module interfaces.

**Documentation**: Include comprehensive JSDoc for all public APIs with parameter types, return types, and usage examples. Document complex business logic inline.

**Error Handling**: Create custom error classes extending base Error. Use proper try-catch blocks with typed error handling. Implement result types for better error propagation.

**Testing**: Write unit tests using Jest/Vitest with TypeScript support. Use proper type assertions and mock typed dependencies. Test both success and error scenarios with type safety.

**Performance**: Use async/await for I/O operations. Implement type guards for runtime type checking. Leverage TypeScript's tree-shaking capabilities. Consider using `readonly` for immutable data structures.

**Best Practices**: Follow DRY principles. Use utility types (`Partial`, `Pick`, `Omit`). Implement proper dependency injection patterns.
