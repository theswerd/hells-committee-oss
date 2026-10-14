# Hell’s Committee — casting round two

Twelve distinct candidates inspired by Greg’s big silhouette, deadpan face, and exhausted office personality. This folder retains their **idle design studies** and native source atlases. Gus Grumble, Norm Goyle and Dot now also have six acting poses in the core `PRESETS` and `src/compiled-art.mjs`; the other nine candidates remain concepts.

Every study is compiled into editable SVG path data. The gallery’s WebP files are display caches rendered from those SVGs. No raster is embedded in the code or SVG output.

```js
import { renderConcept, renderConceptScene, CONCEPT_IDS } from './characters.mjs'

const edgar = renderConcept('edgar', {
  body: '#dca745', accent: '#71324f', flip: true, size: 512,
})
const office = renderConceptScene([
  { id: 'norm', x: 110, y: 220, size: 360 },
  { id: 'slugworth', x: 550, y: 220, size: 360 },
])
```

`body` and `accent` recolor semantic color regions while retaining shading; `flip`, `tilt`, and scene position are independent controls. All authored contours, including the eyes, mouth and held props, stay in place. Dark inks and colors tagged `fixed` retain their original paint. All characters expose only `state: 'idle'` until selected for a full reaction series.

- `sources/`: four original native transparent atlases.
- `normalized/`: extracted transparent source silhouettes and initial traces.
- `compiled-concepts.mjs`: all twelve vector character definitions.
- `characters.mjs`: dependency-free rendering, palette and scene controls.
- `exports/`: individual transparent SVGs and display previews.
- `manifest.json`: source hashes, bounds, candidate IDs and path counts.

Rebuild with `python concepts/round-two/compile.py` from the sprite project. Requires the same Pillow, NumPy, SciPy and VTracer authoring dependencies as `compile_art.py`. Rendering needs only a browser or Node; no Python runtime is required.
