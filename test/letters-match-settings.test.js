/**
 * @jest-environment jsdom
 */
'use strict';

describe('letters-match / settings.js', () => {
  let settings;

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
    settings = require('../letters-match/settings.js');
  });

  describe('getLanguage()', () => {
    it('returns "en" by default', () => {
      expect(settings.getLanguage()).toBe('en');
    });

    it('returns stored language "pl"', () => {
      localStorage.setItem('letterMatch_language', 'pl');
      expect(settings.getLanguage()).toBe('pl');
    });

    it('falls back to "en" for an unsupported stored value', () => {
      localStorage.setItem('letterMatch_language', 'fr');
      expect(settings.getLanguage()).toBe('en');
    });
  });

  describe('setLanguage()', () => {
    it('persists a valid language', () => {
      settings.setLanguage('pl');
      expect(localStorage.getItem('letterMatch_language')).toBe('pl');
    });

    it('does not store an invalid language', () => {
      settings.setLanguage('de');
      expect(localStorage.getItem('letterMatch_language')).toBeNull();
    });

    it('round-trips "en"', () => {
      settings.setLanguage('en');
      expect(settings.getLanguage()).toBe('en');
    });
  });

  it('VALID_LANGUAGES includes "en" and "pl"', () => {
    expect(settings.VALID_LANGUAGES).toContain('en');
    expect(settings.VALID_LANGUAGES).toContain('pl');
  });

  it('DEFAULT_LANGUAGE is "en"', () => {
    expect(settings.DEFAULT_LANGUAGE).toBe('en');
  });
});
