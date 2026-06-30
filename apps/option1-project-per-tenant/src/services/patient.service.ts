import type { Patient, Bundle } from '@medplum/fhirtypes';
import type { MedplumClient } from '@repo/medplum';
import { assertValidFhirResource } from '@repo/medplum';
import { AppError } from '@repo/utils';
import { buildPatientResource } from '@repo/utils';
import { createLogger } from '@repo/logger';

import type { CreatePatientDto, UpdatePatientDto, PatientSearchDto } from '../validators/patient.validator';

const log = createLogger({ name: 'patient-service-app1' });

export class PatientService {
  async create(dto: CreatePatientDto, client: MedplumClient, tenantId: string): Promise<Patient> {
    const resource = buildPatientResource(dto);
    assertValidFhirResource(resource);

    const created = await client.createResource(resource);
    log.info({ patientId: created.id, tenantId }, 'Patient created');
    return created;
  }

  async findById(id: string, client: MedplumClient): Promise<Patient> {
    try {
      return await client.readResource('Patient', id);
    } catch {
      throw AppError.notFound('Patient', id);
    }
  }

  async update(id: string, dto: UpdatePatientDto, client: MedplumClient, tenantId: string): Promise<Patient> {
    const existing = await this.findById(id, client);
    const updated = buildPatientResource({ ...this.patientToDto(existing), ...dto });
    updated.id = id;
    assertValidFhirResource(updated);

    const result = await client.updateResource(updated);
    log.info({ patientId: id, tenantId }, 'Patient updated');
    return result;
  }

  async delete(id: string, client: MedplumClient, tenantId: string): Promise<void> {
    await this.findById(id, client);
    await client.deleteResource('Patient', id);
    log.info({ patientId: id, tenantId }, 'Patient deleted');
  }

  async search(params: PatientSearchDto, client: MedplumClient): Promise<Bundle<Patient>> {
    const searchParams: Record<string, string> = {};

    if (params.name) searchParams['name'] = params.name;
    if (params.birthDate) searchParams['birthdate'] = params.birthDate;
    if (params.gender) searchParams['gender'] = params.gender;
    if (params.email) searchParams['email'] = params.email;
    if (params.identifier) searchParams['identifier'] = params.identifier;

    const count = params.pageSize ?? params._count ?? 20;
    const offset = params._offset ?? ((params.page ?? 1) - 1) * count;

    searchParams['_count'] = String(count);
    searchParams['_offset'] = String(offset);

    return client.search('Patient', new URLSearchParams(searchParams).toString());
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
