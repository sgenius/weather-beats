import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { SandboxNowForm } from './SandboxNowForm';
import { DEFAULT_SANDBOX_VALUES } from './sandboxTimeline';

describe('SandboxNowForm', () => {
  it('calls onChange with updated values when a field changes', () => {
    const onChange = vi.fn();
    render(
      <SandboxNowForm values={DEFAULT_SANDBOX_VALUES} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Temperature (°C)'), {
      target: { value: '25' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SANDBOX_VALUES,
      temperatureC: 25,
    });
  });

  it('disables the precipitation amount field when there is no precipitation', () => {
    render(
      <SandboxNowForm values={DEFAULT_SANDBOX_VALUES} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText('Precipitation amount (mm)')).toBeDisabled();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <SandboxNowForm values={DEFAULT_SANDBOX_VALUES} onChange={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
