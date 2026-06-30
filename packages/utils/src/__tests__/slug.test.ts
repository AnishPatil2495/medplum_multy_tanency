import { describe, it, expect } from 'vitest';

import { generateSlug, isValidSlug } from '../slug';

describe('generateSlug', () => {
  it('converts spaces to hyphens', () => {
    expect(generateSlug('Acme Health')).toBe('acme-health');
  });

  it('lowercases the result', () => {
    expect(generateSlug('UPPER CASE')).toBe('upper-case');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello & World!')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('foo  --  bar')).toBe('foo-bar');
  });

  it('trims leading/trailing hyphens', () => {
    expect(generateSlug('  hello  ')).toBe('hello');
  });
});

describe('isValidSlug', () => {
  it('accepts valid slugs', () => {
    expect(isValidSlug('acme')).toBe(true);
    expect(isValidSlug('acme-health')).toBe(true);
    expect(isValidSlug('my-org-123')).toBe(true);
  });

  it('rejects slugs with uppercase', () => {
    expect(isValidSlug('Acme')).toBe(false);
  });

  it('rejects slugs starting with hyphen', () => {
    expect(isValidSlug('-acme')).toBe(false);
  });

  it('rejects slugs ending with hyphen', () => {
    expect(isValidSlug('acme-')).toBe(false);
  });

  it('rejects slugs with spaces', () => {
    expect(isValidSlug('acme health')).toBe(false);
  });
});
