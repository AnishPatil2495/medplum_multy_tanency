import { describe, it, expect } from 'vitest';

import { hashPassword, verifyPassword, generateId, generateRequestId } from '../crypto';

describe('hashPassword / verifyPassword', () => {
  it('produces a hash and salt', () => {
    const { hash, salt } = hashPassword('supersecret');
    expect(hash).toBeTruthy();
    expect(salt).toBeTruthy();
    expect(hash).not.toBe('supersecret');
  });

  it('verifies a correct password', () => {
    const { hash, salt } = hashPassword('mysecret');
    expect(verifyPassword('mysecret', hash, salt)).toBe(true);
  });

  it('rejects a wrong password', () => {
    const { hash, salt } = hashPassword('mysecret');
    expect(verifyPassword('wrongpassword', hash, salt)).toBe(false);
  });

  it('produces the same hash for the same password+salt', () => {
    const { hash, salt } = hashPassword('stable');
    const { hash: hash2 } = hashPassword('stable', salt);
    expect(hash).toBe(hash2);
  });

  it('produces different hashes for different salts', () => {
    const { hash: h1, salt: s1 } = hashPassword('password');
    const { hash: h2, salt: s2 } = hashPassword('password');
    expect(s1).not.toBe(s2);
    expect(h1).not.toBe(h2);
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId()).toBeTruthy();
  });

  it('returns unique values', () => {
    expect(generateId()).not.toBe(generateId());
  });
});

describe('generateRequestId', () => {
  it('returns a hex string of 16 chars', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });
});
