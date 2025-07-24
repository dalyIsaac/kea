---
applyTo: "**"
---

This is a TypeScript-based repository for a Visual Studio Code extension to provide Git-based code review and development tools.

## Architecture Overview

### Dependency Injection via Context

The extension uses a centralized `KeaContext` class that acts as a dependency injection container. All major components receive this context and access dependencies through it:

- `IKeaContext` defines the contract with managers for accounts, repositories, git, commands, caching, and UI trees
- Components are composed in `KeaContext` constructor and registered for disposal
- Example: `new PullRequestContentsProvider(ctx)` receives full context access

### Major Component Boundaries

- **Account Management**: GitHub OAuth integration (`account/`)
- **Repository Management**: Bridges local Git repos with remote APIs (`repository/`)
- **Caching**: Two-tier API/file caching with LRU eviction (`cache/`)
- **Views**: Tree providers for pull requests list and contents (`views/`)
- **Commands**: VS Code command implementations (`commands/`)
- **Decorations**: File tree decorations for issue comments (`decorations/`)

### Event-Driven Architecture

Components communicate via events rather than direct coupling:

- Repository state changes fire `onRepositoryStateChanged` events
- Issue comments changes trigger decoration refreshes
- Tree providers listen to relevant events and refresh UI accordingly

## Code Standards

### Code Style

- Prefer arrow functions for methods
- Avoid excessive comments - comments should only explain "what" for complex logic
- Use JSDoc for public methods and classes, and comment blocks for complex logic
- End comments with a period

### Testing Patterns

- Write tests in the form "Given <context>, when <action>, then <expected result>"
- Test names should be descriptive and follow the format: `should ...`
- Write tests with a `const setupStubs = () => { ... }` pattern to create reusable test data - don't use `setup` or `beforeEach` for stubs
- Do not use `beforeEach`, `beforeAll`, `afterEach`, or `afterAll` for test setup - use `setupStubs()` instead
- Do not use `SinonSandbox`
- `createStubs` can be used in place of `setupStubs`
- **Don't mock external modules** (vscode, sinon.restore, Logger) - only mock context dependencies
- Create comprehensive stub factories in `test-utils.ts` following the pattern: `createXxxStub(props: Partial<IXxx> = {}): IXxx`

### Resource Management

All components extending `KeaDisposable`:

- Must call `this._registerDisposable()` for any disposable resources
- Should consider using `_dispose()` for custom cleanup logic
- Must use the disposal pattern consistently to prevent memory leaks

## Key Developer Workflows

### Build & Watch

```bash
npm run watch:esbuild  # Background bundling
npm run watch:tsc      # Background type checking
npm run watch-tests    # Background test compilation
```

### Testing Strategy

- Unit tests focus on individual component behavior with mocked dependencies
- Integration tests would require VS Code's testing environment
- Use `test-utils.ts` factories extensively - they provide consistent, reusable stubs
- Event testing uses `stubEvents()` utility to mock event emitters and simulate event firing

### Adding New Components

1. Define interface in appropriate module (e.g., `INewManager`)
2. Create implementation extending `KeaDisposable` if it has resources
3. Add to `IKeaContext` interface and `KeaContext` constructor
4. Create stub factory in `test-utils.ts` following existing patterns
5. Write tests using `setupStubs()` pattern with context mocking only

## Project-Specific Conventions

### Error Handling

Functions that can fail return `T | Error` rather than throwing:

```typescript
const result = await repository.getPullRequestList();
if (result instanceof Error) {
  Logger.error(result);
  return;
}
// Use result safely here
```

### Caching Strategy

Two-level caching with explicit invalidation:

- `ApiCache`: In-memory LRU cache for API responses with ETags
- `FileCache`: Persistent cache for file contents
- Cache keys use structured objects, not string concatenation

### Tree Provider Pattern

All tree providers follow consistent patterns:

- Extend `TreeNodeProvider<TNode>`
- Implement lazy loading via `getChildren(element?: TNode)`
- Use `TreeViewContainer` wrapper for consistent tree view setup
- Listen to relevant context events and call `this._onDidChangeTreeData.fire()` to refresh

This extension emphasizes clean architecture, comprehensive testing, and robust resource management. When adding features, follow the established patterns for dependency injection, event handling, and error management.
