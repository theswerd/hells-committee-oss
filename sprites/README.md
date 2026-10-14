# Hell’s Committee — illustrated sprite foundation

This version preserves the personality of the approved Sinner Social Club art inside the infernal-office theme: expressive faces, gestural hands, asymmetric silhouettes, fur, wing patterns and adult human caricatures. It contains **fourteen illustrated archetypes and 84 authored pose/reaction drawings**, including eleven demon options for an eight-player committee. Runtime rendering uses JavaScript and vector paths; no image files or image-generation calls are needed.

The separate [casting round two](concepts/round-two/README.md) retains twelve **idle concept studies** around Greg's tired monster personality. Gus Grumble, Norm Goyle and Dot have been promoted into the core six-pose acting library. Their idle frames preserve every contour from the approved concepts and match the acting set's scale and baseline. All three support the generator's palette, mirroring, scene and animation controls; the other nine candidates remain design studies.

Open **studio.html** in a browser. The studio is self-contained and works offline. Choose a character, edit its colors and name, generate a seeded roster, select a reaction or scene, play motion or scrub a frame, and export SVG, PNG or character JSON.

The Node generator requires Node 20 or newer and has no package dependencies.

```sh
node cli.mjs demo
node cli.mjs render --preset mothmanager --reaction stamping --time 0.3 --out moth.svg
node cli.mjs batch --kind demon --seed night-shift --count 100 --out exports/new-demons
node cli.mjs batch --kind human --seed backlog --count 100 --reaction shocked --out exports/new-sinners
```

## Define and drive a character

Character identity is plain JSON. Seeded generation chooses an archetype and palette; storing the complete definition makes every later render repeatable. Reactions reuse the identity instead of rerolling it.

```js
import { createCharacter, generateRoster, PRESETS } from './src/sprites.mjs';
import { renderDrivenSprite, mountSprite, mountScene } from './src/driver.mjs';

const clerk = createCharacter({
  kind: 'demon', archetype: 'mothmanager', seed: 'night-shift-047',
  name: 'Agnes', color: '#b997ed', accent: '#fa416b',
});

const frame = renderDrivenSprite(clerk, { reaction: 'stamping', time: 0.3 });
const actor = mountSprite(document.querySelector('#demon'), clerk);
actor.setState({ reaction: 'writing' });
actor.setState({ reaction: 'voting' });
actor.setState({ reaction: 'shocked', flip: true });
actor.setState({ play: false, time: 0.4 });
actor.destroy();

const tv = mountScene(document.querySelector('#tv'), [clerk, PRESETS.john], {
  scene: 'committee',
  slots: [
    { x: 150, y: 180, size: 360, state: { reaction: 'writing' } },
    { x: 720, y: 180, size: 360, state: { reaction: 'shocked' } },
  ],
});
tv.setState({ scene: 'verdict', reaction: 'celebrate', slots: [] });
tv.destroy();

const moreClerks = generateRoster({ kind: 'demon', seed: 'committee-2', count: 250 });
```

## Available art and controls

| Cast | Authored acting |
| --- | --- |
| Beelzebabs, Mothmanager, Lil’ Litigator, Greg, Velvet Vice, Bonejamin, Cerberus, Dolly Doom, Gus Grumble, Norm Goyle, Dot | Idle, writing, stamping, voting, celebrating, shocked |
| John, Maya, Brad | Idle, talking, angry, embarrassed, celebrating, shocked |

The illustrated mode exposes archetype, name, seeded palette, body/accent colors for demons, skin/hair/clothing tones for humans, build, authored reactions, motion time, scene placement, size and mirroring. Color mapping preserves the original shading. Anatomy and acting come from the authored vector library. New anatomy or clothing silhouettes are added as further archetypes or authored parts; palette generation produces additional variants of the existing archetypes.

Scenes include a transparent lineup, the committee desk, a case profile and a verdict stage. SVG and PNG exports are snapshots; the controllers select acting states and animate body motion at runtime. The procedural drafting implementation remains available through `renderSprite(character, {art:'procedural'})` for developing new parametric parts.

## Source and outputs

- `src/compiled-art.mjs`: 84 editable vector pose drawings, stored as curve/path data.
- `src/compiled-faces.mjs`: complete source-aligned face layers for Maya's angry and celebrating poses. The renderer removes the traced face underneath before drawing these layers.
- `src/compiled-hair.mjs`: six complete Maya hairstyles with continuous curl strokes. Hair recoloring belongs to this isolated layer; body and neck shadows follow skin colors.
- `src/facial-details.mjs`: authored human mouths and Maya's eye/ear contours, with spatial guards that keep facial shadows and gold earrings out of the hair palette. Details survive re-tracing the source art.
- `src/high-fidelity.mjs`: archetype selection, authored-state selection, semantic palette variation and SVG rendering.
- `src/sprites.mjs`: character definitions, seeded generation, presets and validation.
- `src/driver.mjs`: game-state driving, scene composition and browser controllers.
- `src/sheets.mjs`: vector review-sheet layout.
- `cli.mjs`: snapshot, batch and demo export commands.
- `studio.template.html` / `build-studio.mjs`: build the offline studio; run `node build-studio.mjs` after source edits.
- `exports/illustrated/`: all 84 canonical pose SVGs and their manifest.
- `exports/demons/` and `exports/humans/`: 24 seeded variants of each kind and manifests.
- `review/`: cast, acting, variation and scene sheets, plus a code-rendered animated preview.

## Add illustrated art

`art-sources/` holds source pose atlases. `compile_art.py` identifies independent silhouettes, normalizes their scale and baseline, and compiles stacked spline geometry with VTracer. It preserves detail and produces pure path data instead of embedding the source PNGs. Add a source, supply its archetype/kind and palette mapping in the compiler and renderer, then rebuild the library and studio. `OPTIONS.archetype` records the supported identifiers.

Authoring helpers require Python dependencies listed in `requirements-authoring.txt`; the runtime generator and studio do not.

```sh
npm test
python compile_art.py
python compile_faces.py
python compile_hair.py
node cli.mjs demo
python verify_faces.py
python verify_hair.py
python render_previews.py
node make-acting-preview.mjs
python render_animation.py
```

The checks cover repeatable identities, saved-definition round trips, authored-state selection, palette variants, scene placement, browser exports, valid SVGs, alpha transparency and clipping. The studio is a sprite design tool; game rules, networking and scoring are outside this package.
