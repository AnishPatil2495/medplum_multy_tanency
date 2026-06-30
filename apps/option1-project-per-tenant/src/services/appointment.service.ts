import type { Appointment, Bundle } from '@medplum/fhirtypes';
import type { MedplumClient } from '@repo/medplum';
import { assertValidFhirResource } from '@repo/medplum';
import { AppError } from '@repo/utils';
import { buildAppointmentResource } from '@repo/utils';
import { createLogger } from '@repo/logger';

import type {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentSearchDto,
} from '../validators/appointment.validator';

const log = createLogger({ name: 'appointment-service-app1' });

export class AppointmentService {
  async create(
    dto: CreateAppointmentDto,
    client: MedplumClient,
    tenantId: string,
  ): Promise<Appointment> {
    const resource = buildAppointmentResource(dto);
    assertValidFhirResource(resource);

    const created = await client.createResource(resource);
    log.info({ appointmentId: created.id, tenantId }, 'Appointment created');
    return created;
  }

  async findById(id: string, client: MedplumClient): Promise<Appointment> {
    try {
      return await client.readResource('Appointment', id);
    } catch {
      throw AppError.notFound('Appointment', id);
    }
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    client: MedplumClient,
    tenantId: string,
  ): Promise<Appointment> {
    const existing = await this.findById(id, client);
    const merged = this.mergeAppointment(existing, dto);
    assertValidFhirResource(merged);

    const result = await client.updateResource(merged);
    log.info({ appointmentId: id, tenantId }, 'Appointment updated');
    return result;
  }

  async delete(id: string, client: MedplumClient, tenantId: string): Promise<void> {
    await this.findById(id, client);
    await client.deleteResource('Appointment', id);
    log.info({ appointmentId: id, tenantId }, 'Appointment deleted');
  }

  async search(
    params: AppointmentSearchDto,
    client: MedplumClient,
  ): Promise<Bundle<Appointment>> {
    const searchParams: Record<string, string> = {};

    if (params.patientId) searchParams['patient'] = `Patient/${params.patientId}`;
    if (params.practitionerId) searchParams['practitioner'] = `Practitioner/${params.practitionerId}`;
    if (params.status) searchParams['status'] = params.status;
    if (params.date) searchParams['date'] = params.date;
    if (params.dateFrom) searchParams['date'] = `ge${params.dateFrom}`;
    if (params.dateTo) {
      const existing = searchParams['date'] ?? '';
      searchParams['date'] = existing ? `${existing}&date=le${params.dateTo}` : `le${params.dateTo}`;
    }

    const count = params.pageSize ?? 20;
    const offset = ((params.page ?? 1) - 1) * count;
    searchParams['_count'] = String(count);
    searchParams['_offset'] = String(offset);

    return client.search('Appointment', new URLSearchParams(searchParams).toString());
  }

  private mergeAppointment(existing: Appointment, dto: UpdateAppointmentDto): Appointment {
    const merged: Appointment = { ...existing };

    if (dto.status) merged.status = dto.status;
    if (dto.start) merged.start = dto.start;
    if (dto.end) merged.end = dto.end;
    if (dto.description) merged.description = dto.description;
    if (dto.comment) merged.comment = dto.comment;

    if (dto.patientId || dto.practitionerId) {
      merged.participant = [
        {
          actor: {
            reference: `Patient/${dto.patientId ?? existing.participant?.[0]?.actor?.reference?.replace('Patient/', '')}`,
          },
          status: 'accepted',
          required: 'required',
        },
        {
          actor: {
            reference: `Practitioner/${dto.practitionerId ?? existing.participant?.[1]?.actor?.reference?.replace('Practitioner/', '')}`,
          },
          status: 'accepted',
          required: 'required',
        },
      ];
    }

    return merged;
  }
}
