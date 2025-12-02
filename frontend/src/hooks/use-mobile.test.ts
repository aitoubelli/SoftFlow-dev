import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  let originalInnerWidth: number;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
    window.matchMedia = originalMatchMedia;
  });

  it('returns true when window width is less than 768', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 767,
    });
    window.matchMedia = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false when window width is 768 or more', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    });
    window.matchMedia = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('updates when window resizes', () => {
    let callback: (e: MediaQueryListEvent) => void;
    window.matchMedia = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn((event, cb) => {
        callback = cb;
      }),
      removeEventListener: jest.fn(),
    }));

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    // simulate resize to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 800,
    });

    act(() => {
      callback({ matches: false } as MediaQueryListEvent);
    });

    expect(result.current).toBe(false);
  });
});
