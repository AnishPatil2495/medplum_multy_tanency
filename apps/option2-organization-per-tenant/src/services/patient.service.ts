import type { Patient, Bundle, Organization } from '@medplum/fhirtypes';
import type { MedplumClient } from '@repo/medplum';
import { assertValidFhirResource } from '@repo/medplum';
import { AppError } from '@repo/utils';
import { buildPatientResource } from '@repo/utils';
import { createLogger } from '@repo/logger';

import type { CreatePatientDto, UpdatePatientDto, PatientSearchDto } from '../validators/patient.validator';

const log = createLogger({ name: 'patient-service-app2' });

export class PatientOrgService {
  /**
   * Creates a Patient with managingOrganization automatically set to the
   * current tenant's FHIR Organization.  This is the key tenant isolation
   * mechanism in App 2 — every resource is stamped with the org reference.
   */
  async create(
    dto: CreatePatientDto,
    client: MedplumClient,
    org: Organization,
  ): Promise<Patient> {
    const orgRef = { reference: `Organization/${org.id}`, display: org.name };
    const resource = buildPatientResource(dto, orgRef);
    assertValidFhirResource(resource);

    const created = await client.createResource(resource);
    log.info({ patientId: created.id, orgId: org.id }, 'Patient created (org scoped)');
    return created;
  }

  async findById(id: string, client: MedplumClient, org: Organization): Promise<Patient> {
    try {
      const patient = await client.readResource('Patient', id);
      this.assertBelongsToOrg(patient, org);
      return patient;
    } catch (err) {
      if (err instanceof Error && err.message.includes('cross-tenant')) throw err;
      throw AppError.notFound('Patient', id);
    }
  }

  async update(
    id: string,
    dto: UpdatePatientDto,
    client: MedplumClient,
    org: Organization,
  ): Promise<Patient> {
    const existing = await this.findById(id, client, org);
    const orgRef = { reference: `Organization/${org.id}`, display: org.name };
    const updated = buildPatientResource({ ...this.patientToDto(existing), ...dto }, orgRef);
    updated.id = id;
    assertValidFhirResource(updated);

    const result = await client.updateResource(updated);
    log.info({ patientId: id, orgId: org.id }, 'Patient updated (org scoped)');
    return result;
  }

  async delete(id: string, client: MedplumClient, org: Organization): Promise<void> {
    await this.findById(id, client, org);
    await client.deleteResource('Patient', id);
    log.info({ patientId: id, orgId: org.id }, 'Patient deleted (org scoped)');
  }

  /**
   * Searches patients scoped to the tenant's Organization.
   * The `organization` search parameter ensures cross-tenant data never surfaces.
   */
  async search(
    params: PatientSearchDto,
    client: MedplumClient,
    org: Organization,
  ): Promise<Bundle<Patient>> {
    const searchParams: Record<string, string> = {
      organization: `Organization/${org.id}`,
    };

    if (params.name) searchParams['name'] = params.name;
    if (params.birthDate) searchParams['birthdate'] = params.birthDate;
    if (params.gender) searchParams['gender'] = params.gender;
    if (params.email) searchParams['email'] = params.email;
    if (params.identifier) searchParams['identifier'] = params.identifier;

    const count = params.pageSize ?? 20;
    const offset = ((params.page ?? 1) - 1) * count;
    searchParams['_count'] = String(count);
    searchParams['_offset'] = String(offset);

    return client.search('Patient', new URLSearchParams(searchParams).toString());
  }

  private assertBelongsToOrg(patient: Patient, org: Organization): void {
    const ref = patient.managingOrganization?.reference;
    if (!ref || !ref.includes(org.id ?? '')) {
      throw AppError.forbidden(
        `cross-tenant: Patient does not belong to Organization/${org.id}`,
      );
    }
  }

  private patientToDto(patient: Patient): CreatePatientDto {
    const name = patient.name?.[0];
    return {
      firstName: name?.given?.[0] ?? '',
      lastName: name?.family ?? '',
      birthDate: patient.birthDate,
      gender: patient.gender as 'male' | 'female' | 'other' | 'unknown' | undefined,
      email: patient.telecom?.find((t) => t.system === 'email')?.value,
      phone: patient.telecom?.find((t) => t.system === 'phone')?.value,
    };
  }
}
