import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { PlaybackModeToggle } from './PlaybackModeToggle';

describe('PlaybackModeToggle', () => {
  it('calls onChange with the selected mode', () => {
    const onChange = vi.fn();
    render(<PlaybackModeToggle mode="now" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Next 12h (12s)'));

    expect(onChange).toHaveBeenCalledWith('next12h');
  });

  it('reflects the current mode as the checked option', () => {
    render(<PlaybackModeToggle mode="next12h" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Next 12h (12s)')).toBeChecked();
    expect(screen.getByLabelText('Now (6s)')).not.toBeChecked();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <PlaybackModeToggle mode="now" onChange={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
