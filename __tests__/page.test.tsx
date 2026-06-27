import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from '../src/app/page';
import '@testing-library/jest-dom';

// Mock Clerk useUser hook
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    user: { firstName: 'Test User', username: 'testuser' }
  }),
  SignInButton: () => <button>Sign in</button>,
  UserButton: () => <div>User</div>
}));

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('SahayApp Main Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock the GoogleGenAI SDK to prevent errors
    jest.mock('@google/genai', () => ({
      GoogleGenAI: jest.fn().mockImplementation(() => ({
        live: { connect: jest.fn() }
      }))
    }));
  });

  it('renders the setup screen when localStorage is empty', async () => {
    render(<Page />);
    expect(await screen.findByText(/Let's set up your profile/i)).toBeInTheDocument();
    expect(await screen.findByText(/Which exam\?/i)).toBeInTheDocument();
  });

  it('allows completing the setup screen and moves to dashboard', async () => {
    render(<Page />);
    
    // Wait for the form to appear
    await screen.findByText(/Which exam\?/i);
    
    // Select JEE exam chip
    const jeeBtn = screen.getByText('JEE');
    fireEvent.click(jeeBtn);
    
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2027-01-01' } });
      
      const submitBtn = await screen.findByText(/Save & Continue/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('sahay_examName')).toBe('JEE');
        expect(localStorage.getItem('sahay_examDate')).toBe('2027-01-01');
      });
    }
  });

  it('renders the dashboard when setup is complete', async () => {
    localStorage.setItem('sahay_examName', 'NEET');
    localStorage.setItem('sahay_examDate', '2026-05-01');
    render(<Page />);
    
    // Check for dashboard greeting (or header text)
    expect(await screen.findByText(/days to NEET/i)).toBeInTheDocument();
  });

  it('handles clicking the Chat via text button', async () => {
    localStorage.setItem('sahay_examName', 'NEET');
    localStorage.setItem('sahay_examDate', '2026-05-01');
    
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ context: "Mock Context" })
      })
    ) as jest.Mock;

    render(<Page />);
    
    const chatBtn = await screen.findByText(/Chat via text/i);
    fireEvent.click(chatBtn);
    
    // Should open the chat modal
    expect(await screen.findByPlaceholderText(/Type a message.../i)).toBeInTheDocument();
  });
});
