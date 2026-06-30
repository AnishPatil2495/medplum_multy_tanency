# Architecture — Option 2: Organization-per-Tenant

## Overview

All tenants share a **single Medplum Project**.  
Each tenant is represented as a **FHIR Organization** resource.  
Tenant isolation is enforced at the **application layer** by:

1. Stamping every Patient with `managingOrganization`
2. Linking every Practitioner via `PractitionerRole` pointing to the Organization
3. Attaching every Appointment with a custom Organization extension
4. Filtering all FHIR searches by Organization reference

## Key Characteristics

| Property | Value |
|----------|-------|
| Medplum Projects | 1 (shared) |
| OAuth Clients | 1 (shared) |
| FHIR Organization | 1 per tenant |
| Database (PostgreSQL) | Shared (logical separation by `tenantId` FK) |
| Medplum Client | Single shared instance (cached) |
| Tenant Isolation | Application-enforced via Organization reference |

## Request Flow

```mermaid
sequenceDiagram
    participant C as Client (Postman)
    participant E as Express App 2
    participant TR as TenantOrgResolver
    participant M as Medplum Server
    participant DB as PostgreSQL

    C->>E: POST /api/v1/patients<br/>X-Tenant-ID: beta-clinic
    E->>TR: Extract tenant slug "beta-clinic"
    TR->>DB: SELECT * FROM tenant_orgs WHERE slug='beta-clinic'
    DB-->>TR: TenantOrg { fhirOrganizationId: "org-xyz" }
    TR->>M: GET /fhir/R4/Organization/org-xyz
    M-->>TR: Organization resource
    TR-->>E: req.tenant + req.organization + req.medplumClient set
    E->>E: build Patient with managingOrganization=org-xyz
    E->>M: POST /fhir/R4/Patient { managingOrganization: { reference: "Organization/org-xyz" } }
    M-->>E: Patient resource
    E-->>C: 201 Created { data: Patient }
```

## Tenant Registration Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant API as App 2 API
    participant M as Medplum Server
    participant DB as PostgreSQL

    A->>API: POST /api/v1/tenants
    API->>M: POST /fhir/R4/Organization { name: "Beta Clinic" }
    M-->>API: Organization { id: "org-xyz" }
    API->>DB: INSERT INTO tenant_orgs (fhirOrganizationId: "org-xyz")
    API->>DB: INSERT INTO user_orgs (admin user)
    API-->>A: 201 { tenant, credentials: { organizationId: "org-xyz" } }
```

## Tenant Isolation Mechanisms

### Patient
```
Patient.managingOrganization = { reference: "Organization/{orgId}" }
```
Search always includes `organization=Organization/{orgId}`.  
Read always checks `managingOrganization` matches the tenant.

### Practitioner
```
PractitionerRole.organization = { reference: "Organization/{orgId}" }
```
Search traverses PractitionerRole to find only org-scoped practitioners.  
Read verifies a PractitionerRole exists linking Practitioner to the org.

### Appointment
```
Appointment.extension[url=appointment-organization].valueReference = Organization/{orgId}
```
Search post-filters by the org extension.  
Read checks the extension.

## Database Schema (App 2)

```mermaid
erDiagram
    tenant_orgs {
        uuid id PK
        string name
        string slug UK
        enum status
        enum subscription
        string fhirOrganizationId UK
        datetime createdAt
        datetime updatedAt
    }

    user_orgs {
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

    tenant_orgs ||--o{ user_orgs : "has"
```

## Strengths

- **Simplest provisioning**: Creating a tenant is just a `createResource(Organization)` call
- **Single Medplum Project**: Easier operations — one set of configurations, one subscription namespace
- **Lower Medplum resource overhead**: Fewer projects, fewer clients
- **Cheaper at scale for smaller tenants**

## Trade-offs

- **Application-enforced isolation**: A bug could potentially leak cross-tenant data
- **FHIR search complexity**: Every query must include org filters
- **No native Medplum project-level isolation**: Relies on application code discipline
- **Audit complexity**: Harder to produce per-tenant audit logs from Medplum
- **Shared access token**: One token gives access to all tenants' FHIR data (mitigated by app-layer checks)
