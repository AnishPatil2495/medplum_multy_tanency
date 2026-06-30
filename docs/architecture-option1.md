# Architecture — Option 1: Project-per-Tenant

## Overview

Each tenant is given a **dedicated Medplum Project** with its own OAuth2 Client Application.  
Tenant isolation is enforced by Medplum itself at the project boundary — one tenant cannot read another tenant's FHIR resources because they exist in separate projects.

## Key Characteristics

| Property | Value |
|----------|-------|
| Medplum Projects | 1 per tenant |
| OAuth Clients | 1 per tenant |
| Database (PostgreSQL) | Shared (logical separation by `tenantId` FK) |
| Medplum Client | Dynamically created per tenant, LRU-cached |
| Tenant Isolation | Enforced by Medplum project boundaries |

## Request Flow

```mermaid
sequenceDiagram
    participant C as Client (Postman)
    participant E as Express App 1
    participant TR as TenantResolver
    participant CC as ClientCache
    participant M as Medplum Server
    participant DB as PostgreSQL

    C->>E: POST /api/v1/patients<br/>X-Tenant-ID: acme
    E->>TR: Extract tenant slug "acme"
    TR->>DB: SELECT * FROM tenant_projects WHERE slug='acme'
    DB-->>TR: TenantProject { projectId, clientId, clientSecret }
    TR->>CC: getOrCreate(tenantId, config)
    CC->>M: POST /oauth2/token (client credentials)
    M-->>CC: access_token
    CC-->>TR: MedplumClient (authenticated)
    TR-->>E: req.tenant + req.medplumClient set
    E->>M: POST /fhir/R4/Patient (using tenant's access token)
    M-->>E: Patient resource
    E-->>C: 201 Created { data: Patient }
```

## Tenant Registration Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant API as App 1 API
    participant SA as SuperAdmin Client
    participant M as Medplum Server
    participant DB as PostgreSQL

    A->>API: POST /api/v1/tenants
    API->>SA: Authenticate with super-admin credentials
    SA->>M: POST /fhir/R4/Project { name: "Acme" }
    M-->>SA: Project { id: "proj-abc" }
    SA->>M: POST /fhir/R4/ClientApplication { projectId }
    M-->>SA: ClientApplication { id, secret }
    API->>DB: INSERT INTO tenant_projects (projectId, clientId, clientSecret)
    API->>DB: INSERT INTO user_projects (admin user)
    API-->>A: 201 { tenant, credentials: { projectId, clientId } }
```

## Database Schema (App 1)

```mermaid
erDiagram
    tenant_projects {
        uuid id PK
        string name
        string slug UK
        enum status
        enum subscription
        string projectId UK
        string clientId UK
        string clientSecret
        string medplumBaseUrl
        datetime createdAt
        datetime updatedAt
    }

    user_projects {
        uuid id PK
        string email
        string passwordHash
        string passwordSalt
        string firstName
        string lastName
        enum role
        boolean isActive
        uuid tenantId FK
        datetime createdAt
        datetime updatedAt
    }

    tenant_projects ||--o{ user_projects : "has"
```

## Strengths

- **Maximum isolation**: Medplum enforces project-level boundaries at the FHIR server level
- **Independent credentials**: Each tenant rotates their own credentials without affecting others
- **No cross-tenant data leak possible**: Even a bug in the application cannot return data across projects
- **Independent FHIR policies**: Each project can have different FHIR resource policies

## Trade-offs

- **Higher provisioning cost**: Registering a tenant requires super-admin API calls to create a Project + ClientApplication
- **More Medplum resources**: N tenants = N projects + N OAuth clients
- **Complexity**: The MedplumClientFactory + cache is required to route requests correctly
- **Scaling limit**: Medplum's project-level features (subscriptions, bots) are per-project
