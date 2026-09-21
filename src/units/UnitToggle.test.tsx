import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { UnitToggle } from './UnitToggle';

describe('UnitToggle', () => {
  it('calls onChange with the selected unit', () => {
    const onChange = vi.fn();
    render(<UnitToggle unit="fahrenheit" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('°C'));

    expect(onChange).toHaveBeenCalledWith('celsius');
  });

  it('reflects the current unit as the checked option', () => {
    render(<UnitToggle unit="celsius" onChange={vi.fn()} />);
    expect(screen.getByLabelText('°C')).toBeChecked();
    expect(screen.getByLabelText('°F')).not.toBeChecked();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <UnitToggle unit="fahrenheit" onChange={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
