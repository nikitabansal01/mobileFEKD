import { resolveApiBaseUrl } from '../config';

describe('resolveApiBaseUrl', () => {
  it('adds exactly one v2 prefix to a configured origin', () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: 'https://api.auvra.com/',
        platform: 'ios',
        development: false,
      }),
    ).toBe('https://api.auvra.com/api/v2');
  });

  it('uses emulator-safe local origins only in development', () => {
    expect(
      resolveApiBaseUrl({ platform: 'android', development: true }),
    ).toBe('http://10.0.2.2:8000/api/v2');
    expect(
      resolveApiBaseUrl({ platform: 'ios', development: true }),
    ).toBe('http://localhost:8000/api/v2');
  });

  it('fails closed when production configuration is missing or insecure', () => {
    expect(() =>
      resolveApiBaseUrl({ platform: 'ios', development: false }),
    ).toThrow('required');
    expect(() =>
      resolveApiBaseUrl({
        configuredUrl: 'http://api.auvra.com',
        platform: 'ios',
        development: false,
      }),
    ).toThrow('https');
  });

  it('rejects versioned URLs so services cannot select competing contracts', () => {
    expect(() =>
      resolveApiBaseUrl({
        configuredUrl: 'https://api.auvra.com/api/v1',
        platform: 'ios',
        development: false,
      }),
    ).toThrow('origin');
  });
});
