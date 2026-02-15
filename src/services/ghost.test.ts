import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GhostRecorder, GhostPlayback, GhostStorage } from './ghost';
import { CONFIG } from '../config';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
});

describe('GhostRecorder', () => {
  let recorder: GhostRecorder;

  beforeEach(() => {
    recorder = new GhostRecorder();
  });

  it('starts empty', () => {
    expect(recorder.getFrameCount()).toBe(0);
    expect(recorder.getRecording()).toEqual({ frames: [], scoreMilestones: [] });
  });

  it('recordFrame adds a frame', () => {
    recorder.recordFrame(100, false);
    expect(recorder.getFrameCount()).toBe(1);
  });

  it('recordFrame captures x position and firing state', () => {
    recorder.recordFrame(150, true);
    const recording = recorder.getRecording();
    expect(recording.frames[0]).toEqual({ x: 150, firing: true });
  });

  it('records multiple frames', () => {
    recorder.recordFrame(100, false);
    recorder.recordFrame(120, true);
    recorder.recordFrame(130, false);
    expect(recorder.getFrameCount()).toBe(3);
  });

  it('recordScoreMilestone adds milestone', () => {
    recorder.recordFrame(100, false);
    recorder.recordScoreMilestone(500, 0);
    recorder.recordFrame(120, false);
    recorder.recordScoreMilestone(1000, 1);
    const recording = recorder.getRecording();
    expect(recording.scoreMilestones).toHaveLength(2);
    expect(recording.scoreMilestones[0]).toEqual({ score: 500, frameIndex: 0 });
    expect(recording.scoreMilestones[1]).toEqual({ score: 1000, frameIndex: 1 });
  });

  it('reset clears all data', () => {
    recorder.recordFrame(100, false);
    recorder.recordScoreMilestone(500, 0);
    recorder.reset();
    expect(recorder.getFrameCount()).toBe(0);
    expect(recorder.getRecording().scoreMilestones).toHaveLength(0);
  });
});

describe('GhostPlayback', () => {
  let playback: GhostPlayback;
  const sampleRecording = {
    frames: [
      { x: 100, firing: false },
      { x: 120, firing: true },
      { x: 140, firing: false },
      { x: 160, firing: false },
      { x: 180, firing: true },
    ],
    scoreMilestones: [
      { score: 500, frameIndex: 1 },
      { score: 1000, frameIndex: 3 },
    ],
  };

  beforeEach(() => {
    playback = new GhostPlayback(sampleRecording);
  });

  it('starts at frame 0', () => {
    expect(playback.getCurrentFrame()).toBe(0);
  });

  it('getPosition returns x from current frame', () => {
    expect(playback.getPosition()).toBe(100);
  });

  it('advance moves to next frame', () => {
    playback.advance();
    expect(playback.getCurrentFrame()).toBe(1);
    expect(playback.getPosition()).toBe(120);
  });

  it('isFiring returns firing state at current frame', () => {
    expect(playback.isFiring()).toBe(false);
    playback.advance();
    expect(playback.isFiring()).toBe(true);
  });

  it('does not advance past the end', () => {
    for (let i = 0; i < 10; i++) playback.advance();
    expect(playback.getCurrentFrame()).toBe(4); // last frame
    expect(playback.isFinished()).toBe(true);
  });

  it('getGhostScore returns score at current frame', () => {
    expect(playback.getGhostScore()).toBe(0); // before first milestone
    playback.advance(); // frame 1
    expect(playback.getGhostScore()).toBe(500);
    playback.advance(); // frame 2
    expect(playback.getGhostScore()).toBe(500); // still at 500
    playback.advance(); // frame 3
    expect(playback.getGhostScore()).toBe(1000);
  });

  it('getScoreDelta returns difference between player and ghost', () => {
    playback.advance(); // frame 1, ghost at 500
    expect(playback.getScoreDelta(600)).toBe(100); // ahead by 100
    expect(playback.getScoreDelta(300)).toBe(-200); // behind by 200
  });

  it('reset starts over', () => {
    playback.advance();
    playback.advance();
    playback.reset();
    expect(playback.getCurrentFrame()).toBe(0);
    expect(playback.getPosition()).toBe(100);
  });
});

describe('GhostStorage', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
  });

  const sampleRecording = {
    frames: [{ x: 100, firing: false }],
    scoreMilestones: [{ score: 500, frameIndex: 0 }],
  };

  it('saves and loads recording for a mode', () => {
    GhostStorage.save('standard', sampleRecording, 5000);
    const loaded = GhostStorage.load('standard');
    expect(loaded).not.toBeNull();
    expect(loaded!.recording.frames).toHaveLength(1);
    expect(loaded!.score).toBe(5000);
  });

  it('returns null when no recording exists', () => {
    expect(GhostStorage.load('endless')).toBeNull();
  });

  it('only saves if new score is higher', () => {
    GhostStorage.save('standard', sampleRecording, 5000);
    const worse = { frames: [{ x: 200, firing: true }], scoreMilestones: [] };
    GhostStorage.save('standard', worse, 3000);
    const loaded = GhostStorage.load('standard');
    expect(loaded!.score).toBe(5000); // kept the better one
    expect(loaded!.recording.frames[0].x).toBe(100);
  });

  it('overwrites if new score is higher', () => {
    GhostStorage.save('standard', sampleRecording, 5000);
    const better = { frames: [{ x: 200, firing: true }], scoreMilestones: [] };
    GhostStorage.save('standard', better, 8000);
    const loaded = GhostStorage.load('standard');
    expect(loaded!.score).toBe(8000);
    expect(loaded!.recording.frames[0].x).toBe(200);
  });

  it('clear removes recording for a mode', () => {
    GhostStorage.save('standard', sampleRecording, 5000);
    GhostStorage.clear('standard');
    expect(GhostStorage.load('standard')).toBeNull();
  });
});
