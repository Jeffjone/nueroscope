import { createBrainGeometry } from "../assets/neural-geometry.js";
export function neuralPoster() {
  const { points, edges } = createBrainGeometry(true);
  const sy = Math.sin(-0.24),
    cy = Math.cos(-0.24),
    sx = Math.sin(0.24),
    cx = Math.cos(0.24);
  const projected = points.map((p) => {
    const x = p.x * cy + p.z * sy,
      z0 = -p.x * sy + p.z * cy,
      y = p.y * cx - z0 * sx,
      z = p.y * sx + z0 * cx;
    return {
      x: 350 + (x * 205 * 4.5) / (4.5 - z),
      y: 325 - (y * 205 * 4.5) / (4.5 - z),
      z,
    };
  });
  const f = (n) => n.toFixed(1);
  const lines = edges
    .filter(
      ([a, b]) =>
        projected[a].z > -0.35 &&
        Math.hypot(
          projected[a].x - projected[b].x,
          projected[a].y - projected[b].y,
        ) < 35,
    )
    .map(
      ([a, b]) =>
        `M${f(projected[a].x)},${f(projected[a].y)}L${f(projected[b].x)},${f(projected[b].y)}`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 650" fill="none"><path d="${lines}" stroke="#b898ff" stroke-opacity=".18" stroke-width=".6"/>${projected.map((p) => `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(0.5 + ((p.z + 1.1) / 2.2) * 0.7)}" fill="#baa3f7" opacity="${Math.min(0.9, 0.13 + Math.pow(Math.max(0, (p.z + 1.1) / 2.2), 1.7) * 0.7).toFixed(2)}"/>`).join("")}</svg>\n`;
}
