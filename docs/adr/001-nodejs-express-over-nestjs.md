# ADR-001: Node.js with Express over NestJS

## Status

Accepted

## Date

2025-11-19

## Context

This project is a GitHub repository scoring API with a well-defined, limited scope:

- Single primary endpoint for searching and scoring repositories
- No authentication, complex authorization, or multi-tenant requirements
- No database layer or complex data relationships

When selecting a backend framework, I evaluated two primary options:

1. **Express.js** - Minimalist, unopinionated web framework
2. **NestJS** - Opinionated, enterprise-grade framework with extensive built-in features

The decision needed to balance developer productivity, maintainability, and appropriateness for the project's scope.

## Decision

I chose **Node.js with Express.js** as the backend framework for this project.

With a straightforward 3-layer architecture:

- **Routes** - Define endpoints and map to controllers
- **Controllers** - Handle HTTP request/response, validation
- **Services** - Implement business logic and external integrations

## Alternatives Considered

### NestJS (REJECTED)

NestJS is a comprehensive framework inspired by Angular, providing:

- Dependency injection container
- Decorators for routing, validation, and middleware
- Built-in modules for common patterns (CQRS, microservices, websockets)
- Opinionated project structure
- Extensive CLI tooling

**Why Rejected:**

**Over-engineering for project scope:**
NestJS shines in large-scale enterprise applications with complex requirements. For my simple API with a single core endpoint, the framework's extensive features would be unused overhead:

- No need for advanced dependency injection (simple service imports suffice)
- No microservices communication patterns required
- No complex module organization needed
- No websockets, GraphQL, or multiple transport layers

**Steeper learning curve:**

- I need to understand NestJS-specific concepts (decorators, modules, providers)
- More boilerplate code for simple operations
- Framework conventions add cognitive overhead for a simple project

**Development velocity:**
For my project scope, Express allows faster iteration:

- Less boilerplate to write and maintain
- Simpler debugging (less framework abstraction)
- Direct control over middleware and request flow

## Conclusion

For a GitHub repository scoring API with a simple, well-defined scope, Express provides the optimal balance of simplicity, performance, and developer productivity.
NestJS would introduce unnecessary complexity and cognitive overhead without delivering proportional value for this project's requirements.

The principle: **Choose the simplest tool that adequately solves the problem.**
