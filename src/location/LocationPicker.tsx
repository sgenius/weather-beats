import { useId, useState, type FormEvent } from 'react';
import { formatPlaceLabel, searchPlaces } from './geocoding';
import type { Coordinates } from './geolocation';

interface LocationPickerProps {
  onLocate: (coordinates: Coordinates, label: string) => void;
}

type SearchState =
  | { phase: 'idle' }
  | { phase: 'searching' }
  | { phase: 'error'; message: string };

/**
 * The non-map location picker (PLAN.md §13 step 3): search for a place by
 * name instead of relying on geolocation. Takes the first geocoding match -
 * a full results list to choose from isn't needed for this stage.
 */
export function LocationPicker({ onLocate }: LocationPickerProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ phase: 'idle' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;

    setState({ phase: 'searching' });
    try {
      const [place] = await searchPlaces(query);
      if (!place) {
        setState({ phase: 'error', message: `No matches for "${query}".` });
        return;
      }
      onLocate(
        { latitude: place.latitude, longitude: place.longitude },
        formatPlaceLabel(place),
      );
      setState({ phase: 'idle' });
    } catch {
      setState({
        phase: 'error',
        message: 'Could not search for that place. Try again.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Location search">
      <label htmlFor={`${id}-query`}>Search for a place</label>
      <input
        id={`${id}-query`}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" disabled={state.phase === 'searching'}>
        {state.phase === 'searching' ? 'Searching…' : 'Search'}
      </button>
      {state.phase === 'error' && <p role="alert">{state.message}</p>}
    </form>
  );
}
