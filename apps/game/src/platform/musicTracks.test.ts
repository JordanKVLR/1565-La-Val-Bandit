import { describe, expect, it } from 'vitest';
import { restartsOnEntry, trackFor, TRACKS } from './musicTracks';

describe('music tracks', () => {
  it('plays Gentle Piano outside battle and Thunderous Charge in every battle', () => {
    expect(trackFor('title')).toBe(TRACKS.piano);
    expect(trackFor('story')).toBe(TRACKS.piano);
    expect(trackFor('battle')).toBe(TRACKS.charge);
    expect(trackFor('boss')).toBe(TRACKS.charge);
    expect(trackFor('none')).toBeNull();
    expect(TRACKS.piano).toMatch(/gentle-piano.*\.mp3/);
    expect(TRACKS.charge).toMatch(/thunderous-charge.*\.mp3/);
  });

  it('starts battle music from the top, and lets the piano carry on', () => {
    expect(restartsOnEntry('story', 'battle')).toBe(true);
    expect(restartsOnEntry('title', 'boss')).toBe(true);
    expect(restartsOnEntry('battle', 'boss')).toBe(false);
    expect(restartsOnEntry('battle', 'story')).toBe(false);
  });
});
