import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import * as geocoding from './geocoding';
import { LocationPicker } from './LocationPicker';

function search(value: string) {
  fireEvent.change(screen.getByLabelText('Search for a place'), {
    target: { value },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
}

describe('LocationPicker', () => {
  it('resolves a search to the first matching place', async () => {
    vi.spyOn(geocoding, 'searchPlaces').mockResolvedValue([
      { name: 'Paris', latitude: 48.85, longitude: 2.35, country: 'France' },
    ]);
    const onLocate = vi.fn();
    render(<LocationPicker onLocate={onLocate} />);

    search('Paris');

    await vi.waitFor(() =>
      expect(onLocate).toHaveBeenCalledWith(
        { latitude: 48.85, longitude: 2.35 },
        'Paris, France',
      ),
    );
  });

  it('shows an error when there are no matches', async () => {
    vi.spyOn(geocoding, 'searchPlaces').mockResolvedValue([]);
    render(<LocationPicker onLocate={vi.fn()} />);

    search('Nowhereville');

    expect(await screen.findByRole('alert')).toHaveTextContent(/No matches/);
  });

  it('shows an error when the search request fails', async () => {
    vi.spyOn(geocoding, 'searchPlaces').mockRejectedValue(new Error('network'));
    render(<LocationPicker onLocate={vi.fn()} />);

    search('Paris');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Could not search/,
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<LocationPicker onLocate={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
