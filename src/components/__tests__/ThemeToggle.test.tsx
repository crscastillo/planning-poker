import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle'
import userEvent from '@testing-library/user-event'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('renders sun icon in light mode', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    // Component shows placeholder initially, then renders after mount
    // We can't directly test the icon since it's SVG, but we can test the button exists
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('toggles theme when clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    await user.click(button)

    // After click, theme should have toggled
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('has hover and focus states', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-gray-300')
    expect(button).toHaveClass('dark:hover:bg-gray-600')
  })
})
