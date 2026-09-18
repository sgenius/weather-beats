import { fireEvent, render, screen } from '@testing-library/react';
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

  it('updates the display panel when the sandbox input changes', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Temperature (°C)'), {
      target: { value: '30' },
    });
    expect(screen.getByText('30°C')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
