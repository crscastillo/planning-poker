import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import React from 'react'

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document class
    document.documentElement.className = ''
  })

  it('provides default light theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('light')
  })

  it('toggles theme from light to dark', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    const initialTheme = result.current.theme
    
    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).not.toBe(initialTheme)
    expect(['light', 'dark']).toContain(result.current.theme)
  })

  it('toggles theme from dark to light', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    // Toggle to dark first
    act(() => {
      result.current.toggleTheme()
    })

    // Toggle back to light
    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('loads saved theme from localStorage', () => {
    localStorage.getItem = jest.fn().mockReturnValue('dark')
    
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    // Wait for useEffect to run
    expect(localStorage.getItem).toHaveBeenCalledWith('theme')
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })

  it('toggles theme multiple times', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    const theme1 = result.current.theme
    
    // Toggle once
    act(() => {
      result.current.toggleTheme()
    })
    const theme2 = result.current.theme
    expect(theme2).not.toBe(theme1)

    // Toggle again
    act(() => {
      result.current.toggleTheme()
    })
    const theme3 = result.current.theme
    expect(theme3).not.toBe(theme2)
    expect(theme3).toBe(theme1) // Should be back to original
  })
})
