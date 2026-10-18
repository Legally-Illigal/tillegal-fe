import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders its label and handles clicks', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Continue</Button>)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(handleClick).toHaveBeenCalledOnce()
  })
})
