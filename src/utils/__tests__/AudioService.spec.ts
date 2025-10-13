import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioService } from '../AudioService';

// Mock the MP3 import
vi.mock('@/assets/clock-chime.mp3', () => ({
  default: 'mocked-audio-url'
}));

// Mock fetch for audio loading
global.fetch = vi.fn();

// Create a simpler test approach focusing on core functionality
describe('AudioService', () => {
  let audioService: AudioService;
  let mockAudioContext: any;
  let mockAudioBuffer: any;
  let mockBufferSource: any;
  let mockHtmlAudio: any;

  beforeEach(() => {
    audioService = new AudioService();

    // Create fresh mocks for each test
    mockAudioBuffer = {
      getChannelData: vi.fn().mockReturnValue(new Float32Array(22050))
    };

    mockBufferSource = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn()
    };

    mockAudioContext = {
      state: 'running',
      sampleRate: 44100,
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createBuffer: vi.fn().mockReturnValue(mockAudioBuffer),
      createBufferSource: vi.fn().mockReturnValue(mockBufferSource),
      decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
      destination: {}
    };

    mockHtmlAudio = {
      preload: '',
      currentTime: 0,
      load: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock global constructors
    global.Audio = vi.fn().mockImplementation(() => mockHtmlAudio);
    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext);
    (global as any).webkitAudioContext = vi.fn().mockImplementation(() => mockAudioContext);
    global.btoa = vi.fn().mockReturnValue('mocked-base64-string');

    // Mock fetch for loading audio files
    (global.fetch as any).mockResolvedValue({
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    });
  });

  afterEach(() => {
    audioService.dispose();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with Web Audio API', async () => {
      await audioService.initialize();

      expect(audioService.isInitialized()).toBe(true);
      expect(AudioContext).toHaveBeenCalled();
    });

    it('should fall back to HTML5 Audio when Web Audio API fails', async () => {
      // Make AudioContext throw an error
      global.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });
      (global as any).webkitAudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });

      // Mock successful HTML Audio initialization
      mockHtmlAudio.addEventListener = vi.fn().mockImplementation((event, callback) => {
        if (event === 'canplaythrough') {
          setTimeout(callback, 0);
        }
      });

      await audioService.initialize();

      expect(audioService.isInitialized()).toBe(true);
      expect(Audio).toHaveBeenCalled();
    });

    it('should throw error when both Web Audio API and HTML5 Audio fail', async () => {
      // Make AudioContext throw an error
      global.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });
      (global as any).webkitAudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });

      // Make HTML Audio fail
      mockHtmlAudio.addEventListener = vi.fn().mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('HTML Audio failed')), 0);
        }
      });

      await expect(audioService.initialize()).rejects.toThrow('Audio initialization failed');
    });

    it('should not reinitialize if already initialized', async () => {
      await audioService.initialize();
      const firstCallCount = (AudioContext as any).mock.calls.length;

      await audioService.initialize();

      expect((AudioContext as any).mock.calls.length).toBe(firstCallCount);
    });

    it('should resume suspended audio context', async () => {
      mockAudioContext.state = 'suspended';

      await audioService.initialize();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('audio playback', () => {
    beforeEach(async () => {
      await audioService.initialize();
    });

    it('should play notification using Web Audio API', async () => {
      await audioService.playNotification();

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockBufferSource.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    it('should not play when audio is disabled', async () => {
      audioService.setEnabled(false);

      await audioService.playNotification();

      expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });

    it('should not play when not initialized', async () => {
      const uninitializedService = new AudioService();

      await uninitializedService.playNotification();

      expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });

    it('should handle playback errors gracefully', async () => {
      mockAudioContext.createBufferSource = vi.fn().mockImplementation(() => {
        throw new Error('Playback failed');
      });

      // Should not throw
      await expect(audioService.playNotification()).resolves.toBeUndefined();
    });

    it('should resume suspended context before playing', async () => {
      mockAudioContext.state = 'suspended';

      await audioService.playNotification();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('HTML5 Audio fallback', () => {
    beforeEach(async () => {
      // Force HTML5 Audio fallback
      global.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });
      (global as any).webkitAudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });

      mockHtmlAudio.addEventListener = vi.fn().mockImplementation((event, callback) => {
        if (event === 'canplaythrough') {
          setTimeout(callback, 0);
        }
      });

      await audioService.initialize();
    });

    it('should play notification using HTML5 Audio', async () => {
      await audioService.playNotification();

      expect(mockHtmlAudio.currentTime).toBe(0);
      expect(mockHtmlAudio.play).toHaveBeenCalled();
    });

    it('should handle HTML5 Audio playback errors', async () => {
      mockHtmlAudio.play = vi.fn().mockRejectedValue(new Error('Play failed'));

      // Should not throw
      await expect(audioService.playNotification()).resolves.toBeUndefined();
    });
  });

  describe('enable/disable functionality', () => {
    it('should be enabled by default', () => {
      expect(audioService.isEnabled()).toBe(true);
    });

    it('should allow enabling and disabling', () => {
      audioService.setEnabled(false);
      expect(audioService.isEnabled()).toBe(false);

      audioService.setEnabled(true);
      expect(audioService.isEnabled()).toBe(true);
    });
  });

  describe('system settings respect', () => {
    it('should respect system settings on mobile', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      expect(audioService.respectsSystemSettings()).toBe(true);
    });

    it('should respect system settings on desktop', () => {
      // Mock desktop user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true
      });

      expect(audioService.respectsSystemSettings()).toBe(true);
    });
  });

  describe('resource cleanup', () => {
    it('should dispose of Web Audio API resources', async () => {
      await audioService.initialize();

      audioService.dispose();

      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(audioService.isInitialized()).toBe(false);
    });

    it('should dispose of HTML5 Audio resources', async () => {
      // Force HTML5 Audio fallback
      global.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });
      (global as any).webkitAudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });

      mockHtmlAudio.addEventListener = vi.fn().mockImplementation((event, callback) => {
        if (event === 'canplaythrough') {
          setTimeout(callback, 0);
        }
      });

      await audioService.initialize();

      audioService.dispose();

      expect(mockHtmlAudio.pause).toHaveBeenCalled();
      expect(audioService.isInitialized()).toBe(false);
    });
  });

  describe('sound generation', () => {
    it('should use MP3 file for HTML5 Audio', async () => {
      global.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });
      (global as any).webkitAudioContext = vi.fn().mockImplementation(() => {
        throw new Error('Web Audio API not supported');
      });

      mockHtmlAudio.addEventListener = vi.fn().mockImplementation((event, callback) => {
        if (event === 'canplaythrough') {
          setTimeout(callback, 0);
        }
      });

      await audioService.initialize();

      expect(Audio).toHaveBeenCalledWith('mocked-audio-url');
    });
  });
});