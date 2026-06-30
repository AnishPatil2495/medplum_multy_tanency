import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Patient, Organization } from '@medplum/fhirtypes';

import { PatientOrgService } from '../services/patient.service';

const mockOrg: Organization = {
  resourceType: 'Organization',
  id: 'org-1',
  name: 'Acme Health',
};

const mockClient = {
  createResource: vi.fn(),
  readResource: vi.fn(),
  updateResource: vi.fn(),
  deleteResource: vi.fn(),
  search: vi.fn(),
};

describe('PatientOrgService (App 2 — Organization-per-Tenant)', () => {
  let service: PatientOrgService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PatientOrgService();
  });

  describe('create', () => {
    it('injects managingOrganization into every new Patient', async () => {
      const createdPatient: Patient = {
        resourceType: 'Patient',
        id: 'p1',
        name: [{ family: 'Smith', given: ['John'] }],
        managingOrganization: { reference: 'Organization/org-1' },
      };
      mockClient.createResource.mockResolvedValueOnce(createdPatient);

      await service.create({ firstName: 'John', lastName: 'Smith' }, mockClient as never, mockOrg);

      const call = mockClient.createResource.mock.calls[0]?.[0] as Patient;
      expect(call.managingOrganization?.reference).toBe('Organization/org-1');
    });
  });

  describe('findById', () => {
    it('returns patient when it belongs to the org', async () => {
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'p1',
        name: [],
        managingOrganization: { reference: 'Organization/org-1' },
      };
      mockClient.readResource.mockResolvedValueOnce(patient);

      const result = await service.findById('p1', mockClient as never, mockOrg);
      expect(result.id).toBe('p1');
    });

    it('throws Forbidden when patient belongs to a different org', async () => {
      const patient: Patient = {
        resourceType: 'Patient',
        id: 'p-other',
        name: [],
        managingOrganization: { reference: 'Organization/org-2' }, // different org!
      };
      mockClient.readResource.mockResolvedValueOnce(patient);

      await expect(service.findById('p-other', mockClient as never, mockOrg)).rejects.toMatchObject(
        { code: 'FORBIDDEN' },
      );
    });
  });

  describe('search', () => {
    it('always includes organization filter in the search query', async () => {
      mockClient.search.mockResolvedValueOnce({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      });

      await service.search({}, mockClient as never, mockOrg);

      const queryArg = mockClient.search.mock.calls[0]?.[1] as string;
      expect(decodeURIComponent(queryArg)).toContain('Organization/org-1');
    });
  });
});
