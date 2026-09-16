import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// public/ isn't under src/, but it's the one non-CSS/non-TS asset Stage 0
// adds - worth a regression test so a typo'd icon path or invalid JSON
// fails CI instead of only surfacing as a silent PWA-install failure.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../');
const manifestPath = join(repoRoot, 'public/manifest.webmanifest');

describe('PWA manifest', () => {
  it('is valid JSON with the required fields', () => {
    const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf-8'));

    expect(manifest).toMatchObject({
      name: 'Weather Beats',
      short_name: 'Weather Beats',
      display: 'standalone',
    });
  });

  it('every icon it references exists on disk', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
      icons: { src: string }[];
    };

    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      expect(existsSync(join(repoRoot, 'public', icon.src))).toBe(true);
    }
  });
});
