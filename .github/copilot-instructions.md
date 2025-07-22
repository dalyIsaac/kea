This is a TypeScript-based repository for a Visual Studio Code extension to provide Git-based code review and development tools.

## Code standards

### Code style

- Prefer arrow functions for methods
- Avoid excessive comments - comments should only explain "what" for complex logic
- Use JSDoc for public methods and classes, and comment blocks for complex logic
- End comments with a period
- Write tests in the form "Given <context>, when <action>, then <expected result>"
- Test names should be descriptive and follow the format: `should ...`
- Write tests with a `const setupStubs = () => { ... }` pattern to create reusable test data - don't use `setup` or `beforeEach` for stubs
