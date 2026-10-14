import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('./',import.meta.url);
export async function buildStudio() {
  const template=await readFile(new URL('studio.template.html',root),'utf8');
  const source=(await readFile(new URL('src/sprites.mjs',root),'utf8')).replace(/^import[^\n]*\n/gm,'');
  const illustrated=await readFile(new URL('src/illustrated.mjs',root),'utf8');
  const compiled=await readFile(new URL('src/compiled-art.mjs',root),'utf8');
  const faces=await readFile(new URL('src/compiled-faces.mjs',root),'utf8');
  const hair=await readFile(new URL('src/compiled-hair.mjs',root),'utf8');
  const facialDetails=await readFile(new URL('src/facial-details.mjs',root),'utf8');
  const vector=(await readFile(new URL('src/high-fidelity.mjs',root),'utf8')).replace(/^import[^\n]*\n/gm,'');
  const sheets=(await readFile(new URL('src/sheets.mjs',root),'utf8')).replace(/^import[^\n]*\n/,'');
  const driver=(await readFile(new URL('src/driver.mjs',root),'utf8')).replace(/^import[^\n]*\n/,'');
  const html=template.replace('/* COMPILED_SOURCE */',compiled.replace(/<\/script/gi,'<\\/script')).replace('/* COMPILED_FACES_SOURCE */',faces.replace(/<\/script/gi,'<\\/script')).replace('/* COMPILED_HAIR_SOURCE */',hair.replace(/<\/script/gi,'<\\/script')).replace('/* FACIAL_DETAILS_SOURCE */',facialDetails.replace(/<\/script/gi,'<\\/script')).replace('/* VECTOR_SOURCE */',vector.replace(/<\/script/gi,'<\\/script')).replace('/* ILLUSTRATED_SOURCE */',illustrated.replace(/<\/script/gi,'<\\/script')).replace('/* SPRITE_SOURCE */',source.replace(/<\/script/gi,'<\\/script')).replace('/* DRIVER_SOURCE */',driver.replace(/<\/script/gi,'<\\/script')).replace('/* SHEET_SOURCE */',sheets.replace(/<\/script/gi,'<\\/script'));
  const target=new URL('studio.html',root);
  await writeFile(target,html);
  return fileURLToPath(target);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]) console.log(await buildStudio());
