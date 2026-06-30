import type { Resource } from '@medplum/fhirtypes';

import { AppError } from '@repo/utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Structural validation for common FHIR resources before sending to Medplum */
export function validateFhirResource(resource: Partial<Resource>): ValidationResult {
  const errors: string[] = [];

  if (!resource.resourceType) {
    errors.push('resourceType is required');
  }

  if (resource.resourceType === 'Patient') {
    const patient = resource as { name?: unknown[]; gender?: string; birthDate?: string };
    if (!patient.name || patient.name.length === 0) {
      errors.push('Patient.name is required');
    }
    if (patient.birthDate && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(patient.birthDate)) {
      errors.push('Patient.birthDate must be in YYYY, YYYY-MM, or YYYY-MM-DD format');
    }
    if (patient.gender && !['male', 'female', 'other', 'unknown'].includes(patient.gender)) {
      errors.push('Patient.gender must be one of: male, female, other, unknown');
    }
  }

  if (resource.resourceType === 'Practitioner') {
    const prac = resource as { name?: unknown[] };
    if (!prac.name || prac.name.length === 0) {
      errors.push('Practitioner.name is required');
    }
  }

  if (resource.resourceType === 'Appointment') {
    const appt = resource as {
      status?: string;
      start?: string;
      end?: string;
      participant?: unknown[];
    };
    if (!appt.status) errors.push('Appointment.status is required');
    if (!appt.start) errors.push('Appointment.start is required');
    if (!appt.end) errors.push('Appointment.end is required');
    if (!appt.participant || appt.participant.length === 0) {
      errors.push('Appointment.participant must have at least one entry');
    }
    if (appt.start && appt.end && new Date(appt.end) <= new Date(appt.start)) {
      errors.push('Appointment.end must be after Appointment.start');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidFhirResource(resource: Partial<Resource>): void {
  const { valid, errors } = validateFhirResource(resource);
  if (!valid) {
    throw AppError.fhirError('FHIR resource validation failed', errors);
  }
}
