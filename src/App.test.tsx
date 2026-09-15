import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the app heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Weather Beats' }),
    ).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
