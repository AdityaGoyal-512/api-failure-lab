# API Failure Lab Development Instructions

## Project philosophy

API Failure Lab is a realistic final-year SDE project. Prioritize correctness, clean architecture, understandable code, and meaningful engineering decisions. Do not overengineer.

## Scope boundaries

Do not introduce the following unless explicitly requested:

- Kubernetes
- Kafka
- Redis Cluster
- database sharding
- multi-region architecture
- service mesh
- CQRS
- event sourcing
- complex distributed consensus

## Development workflow

Before making significant changes:

1. Inspect the existing repository.
2. Understand the current architecture.
3. Identify affected files.
4. Explain the approach.
5. Implement incrementally.
6. Run tests or builds.
7. Fix issues.
8. Update documentation when necessary.

Never implement the entire project in one step.

## Dependencies

Do not add dependencies unless they solve an actual project requirement.

## Security

Never commit `.env`, passwords, database credentials, API keys, or JWT secrets. Use `.env.example` for required configuration.

## Code quality

Prefer readable, modular code with clear naming and appropriate error handling. Avoid unnecessary abstractions.

