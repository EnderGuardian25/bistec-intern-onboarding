# ADR 0002: Hosting Platform — Azure App Service over Azure Container Apps

## Status
Accepted (date: 2026-05-28)

## Context

- GreenChit's backend is a .NET Core Web API and its frontend is a React SPA. Both need to be hosted on Azure.
- The team is composed of early-career engineers. Most have touched Azure through tutorials but nobody has operated Kubernetes or container orchestration in production.
- The system has a predictable, low-to-moderate load profile: BISTEC staff submitting expenses is not a bursty, unpredictable workload. Peak usage occurs around month-end payroll cycles.
- We need the platform to support managed TLS, custom domains, deployment slots for staging/production swap, and straightforward integration with Azure SQL and Azure Blob Storage.
- We do not yet know whether GreenChit will need to run background workers or scheduled jobs at scale; the current scope is limited to a Service Bus consumer for notifications.
- Two realistic Azure options exist: **Azure App Service** and **Azure Container Apps**.

## Decision

We deploy the GreenChit backend API and the React frontend on **Azure App Service (Standard S1 tier)**. The backend runs as a .NET Core Web App; the frontend is served as a static site via the same App Service.

We do not use Azure Container Apps for the initial release. If future requirements introduce a need for per-revision traffic splitting, sidecar patterns, or scale-to-zero economics at significant traffic volume, we will revisit this decision via a superseding ADR.

## Consequences

**Easier**
- Deployment is a straightforward `dotnet publish` + ZIP deploy or GitHub Actions workflow. New team members can ship a change in their first week without learning container registries or image tagging conventions.
- Deployment slots give us a staging environment that can be swapped to production atomically, reducing the risk of a bad release reaching real payroll data.
- Azure's built-in diagnostics, log streams, and Application Insights integration work out of the box without container log routing configuration.

**Harder**
- App Service does not scale to zero. We pay for compute even when no staff member is actively using GreenChit. At S1 pricing (~$70/month) this is acceptable, but it is real money for a tool with idle overnight periods.
- If GreenChit eventually needs to run as multiple isolated microservices with per-service scaling, migrating away from App Service will require containerising the application and re-platforming. We are accepting this future migration cost consciously.

**Different**
- The operations runbook is simpler than a container-based runbook: restart, swap slots, check log stream. Engineers do not need to understand pod scheduling or container restarts.

## Alternatives Considered

**Azure Container Apps** — Offers scale-to-zero and modern container-native features, but requires the team to maintain container images, a container registry, and understand revision management. The operational overhead is not justified by GreenChit's current scale or the team's current experience level. Rejected for initial release.