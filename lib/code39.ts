// Minimal Code 39 barcode encoder — renders straight to an SVG string with zero dependencies and
// no external assets, matching this app's "first-party, no external services" module philosophy.
// Code 39 (not Code 128) was chosen deliberately: its character table is small (44 symbols, each
// just 5 bars + 4 spaces, narrow-or-wide only) and easy to reproduce correctly by hand, versus
// Code 128's 106-symbol variable-module-width table where a single transcription error silently
// produces a barcode that looks right but won't scan. Supports 0-9, A-Z (auto-uppercased),
// space, and - . $ / + % — any other character is dropped.
// NOTE: not verified against a physical scanner here — test-print and scan a sample label before
// relying on this operationally.

const CODE39_PATTERNS: Record<string, string> = {
  '0': 'NNNWWNWNN', '1': 'WNNWNNNNW', '2': 'NNWWNNNNW', '3': 'WNWWNNNNN',
  '4': 'NNNWWNNNW', '5': 'WNNWWNNNN', '6': 'NNWWWNNNN', '7': 'NNNWNNWNW',
  '8': 'WNNWNNWNN', '9': 'NNWWNNWNN',
  A: 'WNNNNWNNW', B: 'NNWNNWNNW', C: 'WNWNNWNNN', D: 'NNNNWWNNW',
  E: 'WNNNWWNNN', F: 'NNWNWWNNN', G: 'NNNNNWWNW', H: 'WNNNNWWNN',
  I: 'NNWNNWWNN', J: 'NNNNWWWNN', K: 'WNNNNNNWW', L: 'NNWNNNNWW',
  M: 'WNWNNNNWN', N: 'NNNNWNNWW', O: 'WNNNWNNWN', P: 'NNWNWNNWN',
  Q: 'NNNNNNWWW', R: 'WNNNNNWWN', S: 'NNWNNNWWN', T: 'NNNNWNWWN',
  U: 'WWNNNNNNW', V: 'NWWNNNNNW', W: 'WWWNNNNNN', X: 'NWNNWNNNW',
  Y: 'WWNNWNNNN', Z: 'NWWNWNNNN',
  '-': 'NWNNNNWNW', '.': 'WWNNNNWNN', ' ': 'NWWNNNWNN',
  $: 'NWNWNWNNN', '/': 'NWNWNNNWN', '+': 'NWNNNWNWN', '%': 'NNNWNWNWN',
  '*': 'NWNNWNWNN', // start/stop
};

// Returns null if nothing in `value` is encodable (caller shows a fallback instead of a blank SVG).
export function renderCode39SVG(value: string, opts?: { height?: number; narrowWidth?: number }): string | null {
  const height = opts?.height ?? 40;
  const narrow = opts?.narrowWidth ?? 2;
  const wide = narrow * 3;

  const chars = ('*' + value.toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '') + '*').split('');
  if (chars.length <= 2) return null; // only start/stop, nothing real to encode

  let x = 0;
  const bars: string[] = [];
  chars.forEach((char, charIndex) => {
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) return;
    pattern.split('').forEach((element, i) => {
      const isBar = i % 2 === 0; // pattern alternates bar,space,bar,space,...
      const width = element === 'W' ? wide : narrow;
      if (isBar) {
        bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}" fill="#000" />`);
      }
      x += width;
    });
    if (charIndex < chars.length - 1) x += narrow; // inter-character gap
  });

  const totalWidth = x;
  return `<svg viewBox="0 0 ${totalWidth} ${height}" width="${totalWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">${bars.join('')}</svg>`;
}
