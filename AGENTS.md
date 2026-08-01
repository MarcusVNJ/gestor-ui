# Repository Guidance

This repository is intended for an Angular frontend. The application has not
been scaffolded yet, so do not assume an Angular version, package manager,
architecture, test runner, or available script until project configuration
establishes it.

Detailed engineering guidance lives under `.agent/knowledge-base/`. The rules
below summarize the defaults that should guide day-to-day work.

## Instruction Precedence

Apply guidance in this order:

1. Explicit task requirements and acceptance criteria.
2. Executable project configuration.
3. Predominant patterns in the existing code.
4. Project-specific documentation.
5. Generic guidance under `.agent/knowledge-base/`.

Preserve established project conventions rather than reshaping working code to
match a generic recommendation.

## Before Making Changes

- Inspect `package.json`, lockfiles, Angular and TypeScript configuration, and
  lint, formatting, test, and CI configuration when they exist.
- Determine the installed Angular version and whether the project uses
  standalone components or NgModules before selecting APIs or patterns.
- Inspect nearby routes, providers, components, styles, and tests for precedent.
- Check the worktree and preserve unrelated or in-progress changes.
- Do not invent scripts, dependencies, endpoints, or requirements.
- Do not upgrade Angular, TypeScript, the CLI, or dependencies unless requested.
- Ask one focused question when ambiguity affects a public contract, persisted
  data, security, UX, or acceptance criteria. Choose the smallest reversible
  solution for internal implementation details.

## Implementation Principles

- Make the smallest cohesive change that satisfies observable behavior.
- Fix root causes and add a regression test for suitable defects.
- Keep one source of truth; classify state before deciding where it belongs.
- Avoid speculative abstractions, generic base classes, deep inheritance, and
  interfaces without a real boundary or alternate implementation.
- Move code into shared areas only after multiple consumers have the same stable
  semantic need.
- Keep effects at system boundaries and domain rules independent of Angular,
  the DOM, HTTP, storage, time, and randomness.

For complex features, prefer feature-oriented organization with clear roles:

- Presentation: rendering, accessibility, focus, and user-event translation.
- Application/ViewModel: screen state, commands, orchestration, and concurrency.
- Domain: framework-independent rules, entities, validation, and contracts.
- Infrastructure: HTTP, storage, analytics, and external SDK adapters.

This separation is proportional, not mandatory boilerplate. Simple visual
components do not need a ViewModel or multiple layers.

## Angular And TypeScript

- Preserve strict typing; never weaken compiler options to bypass an error.
- Avoid `any`, broad assertions, and non-null assertions. Validate `unknown`
  input at HTTP, URL, storage, form, and third-party boundaries.
- Keep DTOs separate from domain models when their contracts differ.
- Use discriminated unions for mutually exclusive states.
- Prefer semantic HTML, thin components, meaningful inputs and outputs, and
  `OnPush` change detection when compatible with the installed version.
- Keep writable Signals private and expose readonly Signals or `computed` state.
- Derive state instead of synchronizing duplicate copies. Use `effect` only for
  unavoidable side effects with understood lifecycle and cleanup.
- Use Signals for current synchronous state and RxJS for event streams, time,
  cancellation, and asynchronous sequences.
- Choose RxJS flattening operators for the required concurrency semantics and
  avoid nested subscriptions.
- Let reactive forms own editing state rather than mirroring every value into
  Signals.
- Use only APIs supported by the installed Angular version. Signals require
  Angular 16+, and experimental APIs require explicit project support.

## UI And Accessibility

- Treat accessibility and responsive behavior as acceptance criteria.
- Prefer native elements over ARIA. Actions use buttons; navigation uses links.
- Provide accessible names, associated labels and errors, visible focus,
  keyboard operation, logical DOM order, and correct modal focus management.
- Do not communicate information through color, position, icons, or motion alone.
- Design from the smallest useful viewport and let content drive breakpoints.
- Prefer Grid, Flexbox, fluid units, logical properties, and container queries to
  JavaScript layout calculations or duplicated desktop/mobile markup.
- Reuse established tokens and components once a design system exists.
- Model relevant loading, success, empty, error, retry, permission, duplicate
  submission, slow-network, and stale-response states explicitly.

## Security And Performance

- Treat external data as untrusted and avoid raw HTML without an explicit,
  maintained sanitization policy.
- Never expose secrets in frontend bundles or log credentials, personal data,
  tokens, or sensitive payloads.
- Hiding UI is not authorization; protected actions require server enforcement.
- Consider XSS, CSRF, open redirects, unsafe URLs, uploads, privacy, and consent
  according to feature risk.
- Measure before optimizing. Preserve stable list identity, avoid obsolete
  request cascades, and validate performance using production builds.

## Testing And Verification

- Test public behavior and acceptance criteria, not private implementation.
- Use unit tests for domain rules and transformations, ViewModel tests for state
  and concurrency, component tests for interaction and accessibility, and E2E
  tests for critical journeys as project tooling and risk justify.
- Query rendered UI by role, accessible name, and visible text; prefer real user
  interaction and asynchronous waiting over implementation selectors or sleeps.
- Mock external boundaries and keep time, timezone, randomness, network, storage,
  and shared state deterministic.
- Run only scripts declared by project configuration. Prefer targeted tests,
  type checking, lint/format checks, the relevant full suite, then a production
  build when those commands exist.
- Never claim a check passed unless it was actually executed.

Before finishing, review the diff for unrelated changes, dead code, temporary
logging, unsafe assertions, duplicated state, swallowed errors, secrets, and
version incompatibilities. Report delivered behavior, key files, commands run,
their results, and anything that could not be verified.
