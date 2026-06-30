export type TenantStatus = 'active' | 'inactive' | 'suspended';
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface TenantBase {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  subscription: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
}

/** Used by App 1 — Project-per-Tenant */
export interface TenantWithProject extends TenantBase {
  projectId: string;
  clientId: string;
  clientSecret: string;
  medplumBaseUrl: string;
}

/** Used by App 2 — Organization-per-Tenant */
export interface TenantWithOrg extends TenantBase {
  organizationId: string;
  fhirOrganizationId: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  subscription?: SubscriptionPlan;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

export interface CreateTenantResponse {
  tenant: TenantBase;
  adminUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  credentials: {
    clientId?: string;
    projectId?: string;
    organizationId?: string;
  };
}
