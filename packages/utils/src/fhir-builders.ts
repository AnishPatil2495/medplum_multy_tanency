import type { Patient, Practitioner, Appointment, HumanName } from '@medplum/fhirtypes';

import type { CreatePatientRequest, CreatePractitionerRequest, CreateAppointmentRequest } from '@repo/types';

export function buildPatientResource(
  req: CreatePatientRequest,
  managingOrganization?: { reference: string; display?: string },
): Patient {
  const name: HumanName = {
    family: req.lastName,
    given: [req.firstName],
    text: `${req.firstName} ${req.lastName}`,
  };

  const patient: Patient = {
    resourceType: 'Patient',
    name: [name],
    active: true,
  };

  if (req.birthDate) patient.birthDate = req.birthDate;
  if (req.gender) patient.gender = req.gender;

  if (req.email || req.phone) {
    patient.telecom = [];
    if (req.email) patient.telecom.push({ system: 'email', value: req.email });
    if (req.phone) patient.telecom.push({ system: 'phone', value: req.phone });
  }

  if (req.address) {
    patient.address = [
      {
        use: 'home',
        line: req.address.line,
        city: req.address.city,
        state: req.address.state,
        postalCode: req.address.postalCode,
        country: req.address.country,
      },
    ];
  }

  if (req.identifiers?.length) {
    patient.identifier = req.identifiers;
  }

  if (managingOrganization) {
    patient.managingOrganization = managingOrganization;
  }

  return patient;
}

export function buildPractitionerResource(req: CreatePractitionerRequest): Practitioner {
  const name: HumanName = {
    family: req.lastName,
    given: [req.firstName],
    text: `${req.firstName} ${req.lastName}`,
  };

  const practitioner: Practitioner = {
    resourceType: 'Practitioner',
    name: [name],
    active: true,
  };

  if (req.email || req.phone) {
    practitioner.telecom = [];
    if (req.email) practitioner.telecom.push({ system: 'email', value: req.email });
    if (req.phone) practitioner.telecom.push({ system: 'phone', value: req.phone });
  }

  if (req.qualification) {
    practitioner.qualification = [
      {
        code: {
          coding: [{ display: req.qualification }],
          text: req.qualification,
        },
      },
    ];
  }

  if (req.identifiers?.length) {
    practitioner.identifier = req.identifiers;
  }

  return practitioner;
}

export function buildAppointmentResource(
  req: CreateAppointmentRequest,
  organizationRef?: { reference: string; display?: string },
): Appointment {
  const appointment: Appointment = {
    resourceType: 'Appointment',
    status: req.status ?? 'booked',
    start: req.start,
    end: req.end,
    participant: [
      {
        actor: { reference: `Patient/${req.patientId}` },
        status: 'accepted',
        required: 'required',
      },
      {
        actor: { reference: `Practitioner/${req.practitionerId}` },
        status: 'accepted',
        required: 'required',
      },
    ],
  };

  if (req.description) appointment.description = req.description;
  if (req.comment) appointment.comment = req.comment;

  if (req.serviceType) {
    appointment.serviceType = [
      {
        coding: [{ display: req.serviceType }],
        text: req.serviceType,
      },
    ];
  }

  if (organizationRef) {
    appointment.extension = [
      {
        url: 'http://example.com/fhir/StructureDefinition/appointment-organization',
        valueReference: organizationRef,
      },
    ];
  }

  return appointment;
}

export function extractPatientName(patient: Patient): string {
  const name = patient.name?.[0];
  if (!name) return 'Unknown';
  if (name.text) return name.text;
  const given = name.given?.join(' ') ?? '';
  const family = name.family ?? '';
  return `${given} ${family}`.trim();
}
