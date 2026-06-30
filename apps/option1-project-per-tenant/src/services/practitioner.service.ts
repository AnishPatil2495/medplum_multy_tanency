import type { Practitioner, Bundle } from '@medplum/fhirtypes';
import type { MedplumClient } from '@repo/medplum';
import { assertValidFhirResource } from '@repo/medplum';
import { AppError } from '@repo/utils';
import { buildPractitionerResource } from '@repo/utils';
import { createLogger } from '@repo/logger';

import type {
  CreatePractitionerDto,
  UpdatePractitionerDto,
} from '../validators/practitioner.validator';

const log = createLogger({ name: 'practitioner-service-app1' });

export class PractitionerService {
  async create(
    dto: CreatePractitionerDto,
    client: MedplumClient,
    tenantId: string,
  ): Promise<Practitioner> {
    const resource = buildPractitionerResource(dto);
    assertValidFhirResource(resource);

    const created = await client.createResource(resource);
    log.info({ practitionerId: created.id, tenantId }, 'Practitioner created');
    return created;
  }

  async findById(id: string, client: MedplumClient): Promise<Practitioner> {
    try {
      return await client.readResource('Practitioner', id);
    } catch {
      throw AppError.notFound('Practitioner', id);
    }
  }

  async update(
    id: string,
    dto: UpdatePractitionerDto,
    client: MedplumClient,
    tenantId: string,
  ): Promise<Practitioner> {
    const existing = await this.findById(id, client);
    const existingDto = this.practitionerToDto(existing);
    const updated = buildPractitionerResource({ ...existingDto, ...dto });
    updated.id = id;
    assertValidFhirResource(updated);

    const result = await client.updateResource(updated);
    log.info({ practitionerId: id, tenantId }, 'Practitioner updated');
    return result;
  }

  async delete(id: string, client: MedplumClient, tenantId: string): Promise<void> {
    await this.findById(id, client);
    await client.deleteResource('Practitioner', id);
    log.info({ practitionerId: id, tenantId }, 'Practitioner deleted');
  }

  async search(
    params: { name?: string; email?: string; page?: number; pageSize?: number },
    client: MedplumClient,
  ): Promise<Bundle<Practitioner>> {
    const searchParams: Record<string, string> = {};
    if (params.name) searchParams['name'] = params.name;
    if (params.email) searchParams['email'] = params.email;

    const count = params.pageSize ?? 20;
    const offset = ((params.page ?? 1) - 1) * count;
    searchParams['_count'] = String(count);
    searchParams['_offset'] = String(offset);

    return client.search('Practitioner', new URLSearchParams(searchParams).toString());
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
