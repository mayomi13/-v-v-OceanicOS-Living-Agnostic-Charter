import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

// Mock fetch for testing
global.fetch = jest.fn()

describe('App Component', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockClear()
  })

  test('renders the main heading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: '# Charter' })
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/Living Agnostic Charter/i)).toBeInTheDocument()
    })
  })

  test('displays loading state initially', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    )

    render(<App />)
    expect(screen.getByText(/Loading charter/i)).toBeInTheDocument()
  })

  test('creates a new proposal', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: '# Charter' })
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'p_test_123',
        title: 'Test Proposal',
        body: 'Test body',
        status: 'open',
        createdAt: new Date().toISOString()
      })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Proposal title/i)).toBeInTheDocument()
    })

    const titleInput = screen.getByPlaceholderText(/Proposal title/i)
    fireEvent.change(titleInput, { target: { value: 'Test Proposal' } })

    const submitButton = screen.getByRole('button', { name: /Create Proposal/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Test Proposal')).toBeInTheDocument()
    })
  })

  test('handles fetch errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })

  test('displays proposal list', async () => {
    const mockProposals = [
      {
        id: 'p_1',
        title: 'Proposal 1',
        body: 'First proposal',
        status: 'open',
        createdAt: new Date().toISOString()
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: '# Charter' })
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Proposal 1')).toBeInTheDocument()
      expect(screen.getByText('First proposal')).toBeInTheDocument()
    })
  })
})
