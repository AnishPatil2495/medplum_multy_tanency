import type { Practitioner, Bundle, Organization, PractitionerRole } from '@medplum/fhirtypes';
import type { MedplumClient } from '@repo/medplum';
import { assertValidFhirResource } from '@repo/medplum';
import { AppError } from '@repo/utils';
import { buildPractitionerResource } from '@repo/utils';
import { createLogger } from '@repo/logger';

import type {
  CreatePractitionerDto,
  UpdatePractitionerDto,
} from '../validators/practitioner.validator';

const log = createLogger({ name: 'practitioner-service-app2' });

export class PractitionerOrgService {
  /**
   * Creates a Practitioner + a PractitionerRole linking them to the tenant's org.
   * PractitionerRole is the FHIR-idiomatic way to express org membership.
   */
  async create(
    dto: CreatePractitionerDto,
    client: MedplumClient,
    org: Organization,
  ): Promise<{ practitioner: Practitioner; role: PractitionerRole }> {
    const resource = buildPractitionerResource(dto);
    assertValidFhirResource(resource);

    const practitioner = await client.createResource(resource);

    // Create PractitionerRole to bind practitioner to this organization
    const role = await client.createResource<PractitionerRole>({
      resourceType: 'PractitionerRole',
      active: true,
      practitioner: { reference: `Practitioner/${practitioner.id}` },
      organization: { reference: `Organization/${org.id}`, display: org.name },
    });

    log.info(
      { practitionerId: practitioner.id, orgId: org.id, roleId: role.id },
      'Practitioner created with org role',
    );

    return { practitioner, role };
  }

  async findById(id: string, client: MedplumClient, org: Organization): Promise<Practitioner> {
    try {
      const practitioner = await client.readResource('Practitioner', id);
      await this.assertBelongsToOrg(id, client, org);
      return practitioner;
    } catch (err) {
      if (err instanceof Error && err.message.includes('cross-tenant')) throw err;
      throw AppError.notFound('Practitioner', id);
    }
  }

  async update(
    id: string,
    dto: UpdatePractitionerDto,
    client: MedplumClient,
    org: Organization,
  ): Promise<Practitioner> {
    const existing = await this.findById(id, client, org);
    const merged = buildPractitionerResource({ ...this.practitionerToDto(existing), ...dto });
    merged.id = id;
    assertValidFhirResource(merged);

    const result = await client.updateResource(merged);
    log.info({ practitionerId: id, orgId: org.id }, 'Practitioner updated (org scoped)');
    return result;
  }

  async delete(id: string, client: MedplumClient, org: Organization): Promise<void> {
    await this.findById(id, client, org);

    // Also delete the PractitionerRole linking this practitioner to the org
    const roles = await client.search(
      'PractitionerRole',
      `practitioner=Practitioner/${id}&organization=Organization/${org.id}`,
    );
    for (const entry of roles.entry ?? []) {
      const roleResource = entry.resource as PractitionerRole | undefined;
      if (roleResource?.id) {
        await client.deleteResource('PractitionerRole', roleResource.id);
      }
    }

    await client.deleteResource('Practitioner', id);
    log.info({ practitionerId: id, orgId: org.id }, 'Practitioner deleted (org scoped)');
  }

  async search(
    params: { name?: string; email?: string; page?: number; pageSize?: number },
    client: MedplumClient,
    org: Organization,
  ): Promise<Bundle<Practitioner>> {
    // Search via PractitionerRole to get only this org's practitioners
    const roleBundle = await client.search(
      'PractitionerRole',
      `organization=Organization/${org.id}&_include=PractitionerRole:practitioner&_count=${params.pageSize ?? 20}`,
    );

    const practitioners = (roleBundle.entry ?? [])
      .map((e) => e.resource as unknown as Practitioner | PractitionerRole | undefined)
      .filter((r): r is Practitioner => r?.resourceType === 'Practitioner');

    // Apply client-side name filter if requested (FHIR search via roles doesn't chain easily)
    const filtered = params.name
      ? practitioners.filter((p) =>
          p.name?.some((n) =>
            `${n.given?.join(' ')} ${n.family}`
              .toLowerCase()
              .includes(params.name!.toLowerCase()),
          ),
        )
      : practitioners;

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: filtered.length,
      entry: filtered.map((r) => ({ resource: r })),
    };
  }

  private async assertBelongsToOrg(
    practitionerId: string,
    client: MedplumClient,
    org: Organization,
  ): Promise<void> {
    const roles = await client.search(
      'PractitionerRole',
      `practitioner=Practitioner/${practitionerId}&organization=Organization/${org.id}`,
    );
    if (!roles.entry?.length) {
      throw AppError.forbidden(
        `cross-tenant: Practitioner/${practitionerId} does not belong to Organization/${org.id}`,
      );
    }
  }

  private practitionerToDto(practitioner: Practitioner): CreatePractitionerDto {
    const name = practitioner.name?.[0];
    return {
      firstName: name?.given?.[0] ?? '',
      lastName: name?.family ?? '',
      email: practitioner.telecom?.find((t) => t.system === 'email')?.value,
      phone: practitioner.telecom?.find((t) => t.system === 'phone')?.value,
    };
  }
}
