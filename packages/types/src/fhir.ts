/** Minimal FHIR R4 domain types — we rely on @medplum/fhirtypes for full types */

export interface FhirReference {
  reference: string;
  display?: string;
}

export interface FhirIdentifier {
  system?: string;
  value: string;
}

export interface FhirHumanName {
  family?: string;
  given?: string[];
  text?: string;
}

export interface FhirContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface FhirAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  email?: string;
  phone?: string;
  address?: {
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  identifiers?: FhirIdentifier[];
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

export interface CreatePractitionerRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  qualification?: string;
  identifiers?: FhirIdentifier[];
}

export interface UpdatePractitionerRequest extends Partial<CreatePractitionerRequest> {}

export type AppointmentStatus =
  | 'proposed'
  | 'pending'
  | 'booked'
  | 'arrived'
  | 'fulfilled'
  | 'cancelled'
  | 'noshow'
  | 'entered-in-error'
  | 'checked-in'
  | 'waitlist';

export interface CreateAppointmentRequest {
  patientId: string;
  practitionerId: string;
  start: string;
  end: string;
  status?: AppointmentStatus;
  description?: string;
  serviceType?: string;
  comment?: string;
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {}

export interface PatientSearchParams {
  name?: string;
  birthDate?: string;
  gender?: string;
  email?: string;
  identifier?: string;
  _count?: number;
  _offset?: number;
}

export interface AppointmentSearchParams {
  patientId?: string;
  practitionerId?: string;
  status?: AppointmentStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  _count?: number;
  _offset?: number;
}
