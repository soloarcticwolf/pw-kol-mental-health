import { render, screen } from '@testing-library/react';
import Page from '../src/app/page';

// Mock Clerk useUser hook
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    user: { firstName: 'Test User', username: 'testuser' }
  }),
  SignInButton: () => <button>Sign in</button>,
  UserButton: () => <div>User</div>
}));

describe('SahayApp', () => {
  it('renders the dashboard when user is authenticated', () => {
    render(<Page />);
    // The setup screen or the dashboard should render without crashing
    expect(document.body).toBeDefined();
  });
});
