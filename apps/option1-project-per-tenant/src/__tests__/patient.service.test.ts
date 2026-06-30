import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Patient } from '@medplum/fhirtypes';

import { PatientService } from '../services/patient.service';

const mockClient = {
  createResource: vi.fn(),
  readResource: vi.fn(),
  updateResource: vi.fn(),
  deleteResource: vi.fn(),
  search: vi.fn(),
};

const tenantId = 'tenant-abc';

describe('PatientService (App 1 — Project-per-Tenant)', () => {
  let service: PatientService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PatientService();
  });

  describe('create', () => {
    it('creates a patient resource via Medplum client', async () => {
      const mockPatient: Patient = {
        resourceType: 'Patient',
        id: 'p1',
        name: [{ family: 'Smith', given: ['John'] }],
        active: true,
      };
      mockClient.createResource.mockResolvedValueOnce(mockPatient);

      const result = await service.create(
        { firstName: 'John', lastName: 'Smith' },
        mockClient as never,
        tenantId,
      );

      expect(result.id).toBe('p1');
      expect(mockClient.createResource).toHaveBeenCalledOnce();
    });

    it('passes managingOrganization if provided — but App 1 does NOT inject it', async () => {
      const mockPatient: Patient = {
        resourceType: 'Patient',
        id: 'p2',
        name: [{ family: 'Jones', given: ['Jane'] }],
      };
      mockClient.createResource.mockResolvedValueOnce(mockPatient);

      await service.create({ firstName: 'Jane', lastName: 'Jones' }, mockClient as never, tenantId);

      const call = mockClient.createResource.mock.calls[0]?.[0] as Patient;
      // App 1 does NOT set managingOrganization — that's the key difference from App 2
      expect(call.managingOrganization).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('returns patient when found', async () => {
      const mockPatient: Patient = { resourceType: 'Patient', id: 'p1', name: [] };
      mockClient.readResource.mockResolvedValueOnce(mockPatient);

      const result = await service.findById('p1', mockClient as never);
      expect(result.id).toBe('p1');
    });

    it('throws NotFound when Medplum returns an error', async () => {
      mockClient.readResource.mockRejectedValueOnce(new Error('Not Found'));

      await expect(service.findById('missing', mockClient as never)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('delete', () => {
    it('deletes the patient resource', async () => {
      mockClient.readResource.mockResolvedValueOnce({
        resourceType: 'Patient',
        id: 'p1',
        name: [],
      });
      mockClient.deleteResource.mockResolvedValueOnce(undefined);

      await service.delete('p1', mockClient as never, tenantId);
      expect(mockClient.deleteResource).toHaveBeenCalledWith('Patient', 'p1');
    });
  });
});
