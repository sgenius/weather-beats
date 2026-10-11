import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { TransportControls } from './TransportControls';

function renderControls(
  overrides: Partial<React.ComponentProps<typeof TransportControls>> = {},
) {
  const handlers = {
    onRestart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStop: vi.fn(),
    onVolumeChange: vi.fn(),
  };
  render(
    <TransportControls
      state="stopped"
      volume={1}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe('TransportControls', () => {
  it('labels the primary button "Play" when stopped, and disables Pause/Stop', () => {
    renderControls({ state: 'stopped' });
    expect(screen.getByRole('button', { name: '▶ Play' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '⏸ Pause' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '⏹ Stop' })).toBeDisabled();
  });

  it('relabels the primary button "Restart" and enables Pause/Stop while playing', () => {
    const { onPause, onStop } = renderControls({ state: 'playing' });
    expect(screen.getByRole('button', { name: '↻ Restart' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: '⏸ Pause' }));
    expect(onPause).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '⏹ Stop' }));
    expect(onStop).toHaveBeenCalled();
  });

  it('shows "Resume" and calls onResume while paused', () => {
    const { onResume } = renderControls({ state: 'paused' });
    const resumeButton = screen.getByRole('button', { name: '▶ Resume' });
    expect(resumeButton).toBeEnabled();

    fireEvent.click(resumeButton);
    expect(onResume).toHaveBeenCalled();
  });

  it('calls onRestart from the primary button regardless of state', () => {
    const { onRestart } = renderControls({ state: 'playing' });
    fireEvent.click(screen.getByRole('button', { name: '↻ Restart' }));
    expect(onRestart).toHaveBeenCalled();
  });

  it('shows "Loading…" and disables the primary button when restartDisabled while stopped', () => {
    const { onRestart } = renderControls({
      state: 'stopped',
      restartDisabled: true,
    });
    const button = screen.getByRole('button', { name: 'Loading…' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onRestart).not.toHaveBeenCalled();
  });

  it('calls onVolumeChange with the new value', () => {
    const { onVolumeChange } = renderControls({ volume: 0.5 });
    fireEvent.change(screen.getByLabelText('Volume'), {
      target: { value: '0.2' },
    });
    expect(onVolumeChange).toHaveBeenCalledWith(0.2);
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <TransportControls
        state="playing"
        onRestart={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onStop={vi.fn()}
        volume={1}
        onVolumeChange={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
