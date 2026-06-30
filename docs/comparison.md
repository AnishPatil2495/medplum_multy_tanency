# Multi-Tenancy Comparison

## Side-by-Side

| Dimension | Option 1: Project-per-Tenant | Option 2: Organization-per-Tenant |
|-----------|------------------------------|-----------------------------------|
| **Tenant isolation** | Medplum-native (project boundary) | Application-enforced (org filter) |
| **Medplum Projects** | 1 per tenant | 1 total |
| **OAuth clients** | 1 per tenant | 1 shared |
| **Medplum client per request** | Dynamically resolved from cache | Single shared client |
| **Tenant provisioning** | Create Project + ClientApplication via super-admin | Create FHIR Organization resource |
| **Provisioning complexity** | High (2 API calls, super-admin needed) | Low (1 API call) |
| **Patient isolation** | Separate FHIR namespace | `managingOrganization` reference |
| **Practitioner isolation** | Separate FHIR namespace | `PractitionerRole.organization` |
| **Appointment isolation** | Separate FHIR namespace | Custom FHIR extension |
| **FHIR search complexity** | Simple (project already scoped) | Must always include org filter |
| **Cross-tenant data leak risk** | Extremely low (Medplum enforces) | Low (requires application bug) |
| **Operational complexity** | High (many projects) | Low (one project) |
| **Cost at scale** | Higher (Medplum project overhead) | Lower |
| **Credential rotation** | Per-tenant, independent | Shared (affects all tenants) |
| **Compliance isolation** | Strong (separate data stores) | Moderate |
| **FHIR subscriptions** | Per-project, fully isolated | Shared, must filter by org |
| **Medplum Bots** | Per-project | Shared project |

## When to Choose Option 1 (Project-per-Tenant)

- Strict regulatory requirements (HIPAA BAA per tenant, SOC 2 scope)
- Large enterprise tenants who demand data isolation guarantees
- Tenants require independent FHIR configuration (different value sets, profiles)
- Low number of tenants (< 100)
- Each tenant generates high data volume

## When to Choose Option 2 (Organization-per-Tenant)

- SaaS with many small tenants (hundreds to thousands)
- Operational simplicity is a priority
- Cost optimization is critical
- Tenants share common FHIR profiles/configurations
- Faster onboarding is needed (no super-admin provisioning)

## Data Flow Comparison

### App 1 — Project-per-Tenant
```
Request
  → TenantResolver (reads tenant_projects table)
  → MedplumClientCache (gets tenant-specific authenticated client)
  → FHIR API call (project-scoped by Medplum)
  → Response
```

### App 2 — Organization-per-Tenant
```
Request
  → TenantOrgResolver (reads tenant_orgs table, loads FHIR Organization)
  → SharedMedplumClient (single client for all tenants)
  → FHIR API call (always includes org filter)
  → Post-filter to verify org membership
  → Response
```

## API Contract

Both applications expose **identical REST APIs**:

```
POST   /api/v1/tenants
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/patients
GET    /api/v1/patients
GET    /api/v1/patients/:id
PUT    /api/v1/patients/:id
DELETE /api/v1/patients/:id
POST   /api/v1/practitioners
GET    /api/v1/practitioners
GET    /api/v1/practitioners/:id
PUT    /api/v1/practitioners/:id
DELETE /api/v1/practitioners/:id
POST   /api/v1/appointments
GET    /api/v1/appointments
GET    /api/v1/appointments/:id
PUT    /api/v1/appointments/:id
DELETE /api/v1/appointments/:id
GET    /health
```

Both require the `X-Tenant-ID` header on all routes except `/api/v1/tenants` and `/health`.

## Postman Testing Strategy

To compare the two options:

1. Import both Postman collections
2. Register the same tenant in both apps (`POST /api/v1/tenants`)
3. Create a user (`POST /api/v1/auth/register`)
4. Login to get a JWT (`POST /api/v1/auth/login`)
5. Create Patients, Practitioners, Appointments
6. Verify search scoping works correctly
7. Try accessing another tenant's resources — should get 403 or 404
