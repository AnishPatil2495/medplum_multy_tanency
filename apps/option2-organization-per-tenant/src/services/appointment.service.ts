import type { Appointment, Bundle, Organization } from '@medplum/fhirtypes';
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

const log = createLogger({ name: 'appointment-service-app2' });

const ORG_EXTENSION_URL =
  'http://example.com/fhir/StructureDefinition/appointment-organization';

export class AppointmentOrgService {
  /**
   * Creates an Appointment with an extension pointing to the tenant's Organization.
   * This is the App 2 tenant stamp for appointments.
   */
  async create(
    dto: CreateAppointmentDto,
    client: MedplumClient,
    org: Organization,
  ): Promise<Appointment> {
    const orgRef = { reference: `Organization/${org.id}`, display: org.name };
    const resource = buildAppointmentResource(dto, orgRef);
    assertValidFhirResource(resource);

    // Also verify patient belongs to this org before booking
    await this.assertPatientBelongsToOrg(dto.patientId, client, org);

    const created = await client.createResource(resource);
    log.info({ appointmentId: created.id, orgId: org.id }, 'Appointment created (org scoped)');
    return created;
  }

  async findById(id: string, client: MedplumClient, org: Organization): Promise<Appointment> {
    try {
      const appt = await client.readResource('Appointment', id);
      this.assertBelongsToOrg(appt, org);
      return appt;
    } catch (err) {
      if (err instanceof Error && err.message.includes('cross-tenant')) throw err;
      throw AppError.notFound('Appointment', id);
    }
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    client: MedplumClient,
    org: Organization,
  ): Promise<Appointment> {
    const existing = await this.findById(id, client, org);
    const orgRef = { reference: `Organization/${org.id}`, display: org.name };
    const merged = this.mergeAppointment(existing, dto, orgRef);
    assertValidFhirResource(merged);

    const result = await client.updateResource(merged);
    log.info({ appointmentId: id, orgId: org.id }, 'Appointment updated (org scoped)');
    return result;
  }

  async delete(id: string, client: MedplumClient, org: Organization): Promise<void> {
    await this.findById(id, client, org);
    await client.deleteResource('Appointment', id);
    log.info({ appointmentId: id, orgId: org.id }, 'Appointment deleted (org scoped)');
  }

  async search(
    params: AppointmentSearchDto,
    client: MedplumClient,
    org: Organization,
  ): Promise<Bundle<Appointment>> {
    const searchParams: Record<string, string> = {};

    if (params.patientId) searchParams['patient'] = `Patient/${params.patientId}`;
    if (params.practitionerId) searchParams['practitioner'] = `Practitioner/${params.practitionerId}`;
    if (params.status) searchParams['status'] = params.status;
    if (params.date) searchParams['date'] = params.date;
    if (params.dateFrom) searchParams['date'] = `ge${params.dateFrom}`;

    const count = params.pageSize ?? 20;
    const offset = ((params.page ?? 1) - 1) * count;
    searchParams['_count'] = String(count);
    searchParams['_offset'] = String(offset);

    const bundle = await client.search(
      'Appointment',
      new URLSearchParams(searchParams).toString(),
    );

    // Post-filter by org extension to enforce tenant isolation
    const orgEntries = (bundle.entry ?? []).filter((e) => {
      const appt = e.resource as Appointment | undefined;
      return appt?.extension?.some(
        (ext) =>
          ext.url === ORG_EXTENSION_URL &&
          ext.valueReference?.reference === `Organization/${org.id}`,
      );
    });

    return { ...bundle, entry: orgEntries, total: orgEntries.length };
  }

  private assertBelongsToOrg(appt: Appointment, org: Organization): void {
    const hasOrgExt = appt.extension?.some(
      (ext) =>
        ext.url === ORG_EXTENSION_URL &&
        ext.valueReference?.reference === `Organization/${org.id}`,
    );
    if (!hasOrgExt) {
      throw AppError.forbidden(
        `cross-tenant: Appointment does not belong to Organization/${org.id}`,
      );
    }
  }

  private async assertPatientBelongsToOrg(
    patientId: string,
    client: MedplumClient,
    org: Organization,
  ): Promise<void> {
    try {
      const patient = await client.readResource('Patient', patientId);
      const ref = patient.managingOrganization?.reference;
      if (!ref || !ref.includes(org.id ?? '')) {
        throw AppError.forbidden(
          `cross-tenant: Patient/${patientId} does not belong to Organization/${org.id}`,
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('cross-tenant')) throw err;
      throw AppError.notFound('Patient', patientId);
    }
  }

  private mergeAppointment(
    existing: Appointment,
    dto: UpdateAppointmentDto,
    orgRef: { reference: string; display?: string },
  ): Appointment {
    const merged: Appointment = { ...existing };

    if (dto.status) merged.status = dto.status;
    if (dto.start) merged.start = dto.start;
    if (dto.end) merged.end = dto.end;
    if (dto.description) merged.description = dto.description;
    if (dto.comment) merged.comment = dto.comment;

    merged.extension = [{ url: ORG_EXTENSION_URL, valueReference: orgRef }];

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
