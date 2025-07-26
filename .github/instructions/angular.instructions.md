---
applyTo: "**/*angular*/**/*.ts"
---

# Angular Development Guidelines

**Architecture**: Use standalone components (Angular 17+). Implement control flow with `@if`, `@for`, `@switch`. Use inject() function for dependency injection. Follow component composition patterns.

**Component Structure**:

- Signals: `count = signal(0)`, `computed(() => this.count() * 2)`
- Input signals: `@Input() userData = input.required<UserProfile>()`
- Output events: `@Output() userSelected = output<User>()`
- ViewChild signals: `@ViewChild('template') templateRef = viewChild<TemplateRef>()`

**State Management**: Use signals for local state. Implement signal-based stores with `signalStore`. Use computed signals for derived state. Prefer signals over NgRx for simple cases.

**Services**: Add file path comments (`// src/app/services/user.service.ts`). Use inject() function. Reserve RxJS only for HTTP operations with proper error handling (`catchError`, `retry`). Convert HTTP responses to signals when needed.

**Forms**: Use reactive forms with signal-based validation. Create typed form controls. Use `FormControl<string>` for type safety. Implement custom validators returning signal-compatible errors.

**HTTP**: Type HTTP responses with interfaces. Use RxJS operators only in HTTP services (`map`, `catchError`, `switchMap`). Convert observables to signals in components using `toSignal()`. Implement proper error boundaries.

**Routing**: Use functional guards (`canActivateFn`). Implement data resolvers with signals. Use typed route parameters with new Router APIs. Leverage view transitions API.

**Testing**: Test signal-based components with signal testing utilities. Mock HTTP services returning observables. Test computed signals and effects separately.

**Performance**: Use signal-based change detection. Implement virtual scrolling with CDK. Use `trackBy` with signals. Optimize with `OnPush` where needed.
