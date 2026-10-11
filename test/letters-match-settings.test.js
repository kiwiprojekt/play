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

  describe('getMute() / setMute()', () => {
    it('returns false by default', () => {
      expect(settings.getMute()).toBe(false);
    });

    it('persists true when muted', () => {
      settings.setMute(true);
      expect(localStorage.getItem('letterMatch_mute')).toBe('true');
      expect(settings.getMute()).toBe(true);
    });

    it('persists false when unmuted', () => {
      settings.setMute(true);
      settings.setMute(false);
      expect(localStorage.getItem('letterMatch_mute')).toBe('false');
      expect(settings.getMute()).toBe(false);
    });
  });

  describe('Font mode & disable handwritten settings', () => {
    it('returns "default" font mode by default', () => {
      expect(settings.getFontMode()).toBe('default');
    });

    it('getDisableHandwritten() returns false by default', () => {
      expect(settings.getDisableHandwritten()).toBe(false);
    });

    it('persists "serif" mode and disables handwritten fonts', () => {
      settings.setFontMode('serif');
      expect(settings.getFontMode()).toBe('serif');
      expect(settings.getDisableHandwritten()).toBe(true);
      expect(localStorage.getItem('letterMatch_fontMode')).toBe('serif');
      expect(localStorage.getItem('letterMatch_disableHandwritten')).toBe('true');
    });

    it('normalizes alias "serifs" to "serif"', () => {
      settings.setFontMode('serifs');
      expect(settings.getFontMode()).toBe('serif');
      expect(settings.getDisableHandwritten()).toBe(true);
    });

    it('normalizes alias "mixed" to "default"', () => {
      settings.setFontMode('mixed');
      expect(settings.getFontMode()).toBe('default');
      expect(settings.getDisableHandwritten()).toBe(false);
    });

    it('persists "hand" mode', () => {
      settings.setFontMode('hand');
      expect(settings.getFontMode()).toBe('hand');
      expect(settings.getDisableHandwritten()).toBe(false);
      expect(localStorage.getItem('letterMatch_fontMode')).toBe('hand');
    });

    it('setDisableHandwritten(true) sets mode to "serif"', () => {
      settings.setDisableHandwritten(true);
      expect(settings.getFontMode()).toBe('serif');
      expect(settings.getDisableHandwritten()).toBe(true);
    });

    it('setDisableHandwritten(false) restores "default" mode', () => {
      settings.setDisableHandwritten(true);
      settings.setDisableHandwritten(false);
      expect(settings.getFontMode()).toBe('default');
      expect(settings.getDisableHandwritten()).toBe(false);
    });

    it('reads legacy letterMatch_disableHandwritten="true" as "serif" mode', () => {
      localStorage.setItem('letterMatch_disableHandwritten', 'true');
      expect(settings.getFontMode()).toBe('serif');
      expect(settings.getDisableHandwritten()).toBe(true);
    });

    it('ignores invalid font mode and logs warning', () => {
      settings.setFontMode('comic-sans');
      expect(settings.getFontMode()).toBe('default');
      expect(localStorage.getItem('letterMatch_fontMode')).toBeNull();
    });
  });

  it('VALID_LANGUAGES includes "en" and "pl"', () => {
    expect(settings.VALID_LANGUAGES).toContain('en');
    expect(settings.VALID_LANGUAGES).toContain('pl');
  });

  it('DEFAULT_LANGUAGE is "en"', () => {
    expect(settings.DEFAULT_LANGUAGE).toBe('en');
  });

  it('VALID_FONT_MODES includes "default", "serif", and "hand"', () => {
    expect(settings.VALID_FONT_MODES).toEqual(['default', 'serif', 'hand']);
  });
});
