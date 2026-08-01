import { readFileSync } from 'node:fs';
import { cwd } from 'node:process';

const tokensCss = readFileSync(`${cwd()}/src/styles/tokens.css`, 'utf8');

const REQUIRED_TOKENS = {
  '--color-background-app': '#f8fafc',
  '--color-surface': '#ffffff',
  '--color-surface-info': '#eff6ff',
  '--color-navigation': '#172554',
  '--color-action-primary': '#1d4ed8',
  '--color-action-primary-hover': '#1e40af',
  '--color-action-primary-active': '#1e3a8a',
  '--color-action-primary-subtle': '#dbeafe',
  '--color-text': '#0f172a',
  '--color-text-secondary': '#475569',
  '--color-control-border': '#64748b',
  '--color-divider': '#cbd5e1',
  '--color-success': '#14532d',
  '--color-success-surface': '#dcfce7',
  '--color-warning': '#713f12',
  '--color-warning-surface': '#fef3c7',
  '--color-danger': '#b91c1c',
  '--color-danger-surface': '#fee2e2',
  '--font-family-base': "system-ui, -apple-system, blinkmacsystemfont, 'segoe ui', sans-serif",
  '--font-size-body': '1rem',
  '--font-size-label': '0.875rem',
  '--font-size-metadata': '0.75rem',
  '--space-1': '0.25rem',
  '--space-2': '0.5rem',
  '--space-3': '0.75rem',
  '--space-4': '1rem',
  '--space-6': '1.5rem',
  '--space-8': '2rem',
  '--space-12': '3rem',
  '--radius-control': '0.375rem',
  '--radius-panel': '0.5rem',
  '--radius-dialog': '0.75rem',
  '--radius-badge': '999px',
  '--shadow-subtle': '0 1px 2px rgb(15 23 42 / 8%)',
  '--focus-ring-width': '3px',
  '--focus-ring-offset': '2px',
  '--target-size-min': '44px',
  '--duration-functional': '160ms',
} as const;

describe('Design tokens', () => {
  it('publishes the required visual foundations as semantic custom properties', () => {
    const rootBlock = tokensCss.match(/:root\s*\{([^}]*)\}/)?.[1];
    expect(rootBlock).toBeDefined();
    const declarations = new Map(
      [...(rootBlock ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [
        match[1],
        match[2].trim().toLowerCase(),
      ]),
    );

    for (const [property, expectedValue] of Object.entries(REQUIRED_TOKENS)) {
      expect(declarations.get(property)).toBe(expectedValue);
    }
  });

  it('removes functional transition duration when reduced motion is requested', () => {
    expect(tokensCss).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*--duration-functional:\s*0ms/,
    );
  });

  it.each([
    ['primary text', '#0f172a', '#ffffff', 4.5],
    ['secondary text', '#475569', '#ffffff', 4.5],
    ['primary action', '#ffffff', '#1d4ed8', 4.5],
    ['primary action hover', '#ffffff', '#1e40af', 4.5],
    ['primary action active', '#ffffff', '#1e3a8a', 4.5],
    ['navigation', '#ffffff', '#172554', 4.5],
    ['inverse focus', '#dbeafe', '#172554', 3],
    ['control border', '#64748b', '#ffffff', 3],
    ['success status', '#14532d', '#dcfce7', 4.5],
    ['warning status', '#713f12', '#fef3c7', 4.5],
    ['danger status', '#b91c1c', '#fee2e2', 4.5],
  ])('%s meets its minimum WCAG contrast', (_name, foreground, background, minimum) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });
});

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hexColor: string): number {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(hexColor.slice(offset, offset + 2), 16),
  );
  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
