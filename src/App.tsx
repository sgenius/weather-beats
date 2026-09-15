import { ThemeProvider } from './theme/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <main>
        <h1>Weather Beats</h1>
        <p>
          Stage 0 foundation: build tooling, design tokens and the state
          palettes are in place. The core data contracts and the weather display
          land in later stages.
        </p>
      </main>
    </ThemeProvider>
  );
}

export default App;
