import { ConfigurationError } from '../errors';
import { ConfigurationManager } from './configuration-manager';

describe('ConfigurationManager', () => {
  let manager: ConfigurationManager;
  // eslint-disable-next-line no-undef
  let originalEnv: NodeJS.ProcessEnv;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    manager = ConfigurationManager.getInstance();
    manager.clear();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    jest.clearAllMocks();
    manager.clear();
    logSpy.mockRestore();
    process.env = { ...originalEnv };

    // Reset singleton instance to prevent memory leaks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ConfigurationManager as any).instance = null;
    manager = undefined as any;
  });

  describe('getString', () => {
    it('returns stored string values', () => {
      manager.set('KEY', 'value');
      expect(manager.getString('KEY')).toBe('value');
    });

    it('throws when value is not a string', () => {
      manager.set('KEY', 123);
      expect(() => manager.getString('KEY')).toThrow(ConfigurationError);
    });
  });

  describe('getRequiredString', () => {
    it('returns value when present', () => {
      manager.set('REQ', 'present');
      expect(manager.getRequiredString('REQ')).toBe('present');
    });

    it('throws when missing', () => {
      expect(() => manager.getRequiredString('REQ')).toThrow(ConfigurationError);
    });
  });

  describe('getNumber', () => {
    it('returns numeric value when convertible', () => {
      manager.set('NUM', '42');
      expect(manager.getNumber('NUM')).toBe(42);
    });

    it('throws when not a number', () => {
      manager.set('NUM', 'not-a-number');
      expect(() => manager.getNumber('NUM')).toThrow(ConfigurationError);
    });
  });

  describe('getBoolean', () => {
    it.each([
      ['true', true],
      ['1', true],
      ['yes', true],
      ['on', true],
      ['false', false],
      ['0', false],
      ['no', false],
      ['off', false],
    ])('parses %s as %s', (value, expected) => {
      manager.set('BOOL', value);
      expect(manager.getBoolean('BOOL')).toBe(expected);
    });

    it('throws when value is not boolean-like', () => {
      manager.set('BOOL', 'invalid');
      expect(() => manager.getBoolean('BOOL')).toThrow(ConfigurationError);
    });
  });

  describe('getJSON', () => {
    it('parses JSON strings', () => {
      manager.set('JSON', '{"key":"value"}');
      expect(manager.getJSON('JSON')).toStrictEqual({ key: 'value' });
    });

    it('throws when JSON parsing fails', () => {
      manager.set('JSON', 'not-json');
      expect(() => manager.getJSON('JSON')).toThrow(ConfigurationError);
    });
  });

  describe('loadFromEnvironment', () => {
    it('loads variables matching prefix', () => {
      process.env.TEST_PREFIX_VALUE = 'prefixed';
      manager.loadFromEnvironment('TEST_PREFIX_');
      expect(manager.getString('VALUE')).toBe('prefixed');
    });
  });

  describe('loadFromObject', () => {
    it('loads entries with optional prefix', () => {
      manager.loadFromObject({ KEY: 'value' }, 'APP_');
      expect(manager.getString('APP_KEY')).toBe('value');
    });
  });

  describe('validateRequired', () => {
    it('passes when all keys exist', () => {
      manager.set('EXISTS', 'yes');
      expect(() => manager.validateRequired(['EXISTS'])).not.toThrow();
    });

    it('throws when keys are missing', () => {
      expect(() => manager.validateRequired(['MISSING'])).toThrow(ConfigurationError);
    });
  });
});
