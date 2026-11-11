/** An artistic two-lobe surface. These coordinates do not encode brain anatomy. */
export function createBrainGeometry(compact = false) {
  const points = [],
    edges = [];
  const rows = compact ? 26 : 38,
    cols = compact ? 38 : 54;
  for (const side of [-1, 1]) {
    const offset = points.length;
    for (let i = 0; i <= rows; i++)
      for (let j = 0; j <= cols; j++) {
        const t = Math.max(
          0,
          Math.min(
            Math.PI,
            (i / rows) * Math.PI + 0.014 * Math.sin(i * 6 + j * 7),
          ),
        );
        const p = (j / cols) * Math.PI * 2 + 0.02 * Math.sin(i * 5 + j * 3);
        const wave =
          0.075 * Math.sin(t * 17 + 1.6 * Math.sin(p * 5)) +
          0.04 * Math.sin(p * 22 + t * 4);
        points.push({
          x:
            side *
            Math.max(0.085, 0.48 + (0.6 + wave) * Math.sin(t) * Math.cos(p)),
          y: (1.12 + wave) * Math.cos(t),
          z:
            (0.83 + wave) *
            Math.sin(t) *
            Math.sin(p) *
            (1 - 0.08 * Math.cos(t * 2)),
          seed: t * 7 + p * 3,
          side,
        });
        const index = offset + i * (cols + 1) + j;
        if (i > 0 && j % 2 === 0) edges.push([index, index - (cols + 1)]);
        if (j > 0 && i % 2 === 0) edges.push([index, index - 1]);
      }
  }
  return { points, edges };
}
