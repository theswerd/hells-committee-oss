import {renderSprite, INK, CREAM} from './sprites.mjs';
const escSheet = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

export function renderSheet(entries, {title='Hell’s Committee', subtitle='Code-defined character studies', columns=4, cellSize=320,concept='sticker',renderer=renderSprite}={}) {
  const rows=Math.ceil(entries.length/columns), width=columns*cellSize+80, height=rows*(cellSize+58)+170;
  const cells=entries.map((entry,i)=>{
    const c=entry.character??entry, pose=entry.pose, expression=entry.expression;
    const x=40+(i%columns)*cellSize,y=150+Math.floor(i/columns)*(cellSize+58);
    let svg=renderer(c,{...entry.state,pose,expression,size:cellSize-12,idPrefix:`sheet-${i}`,concept});
    svg=svg.replace('<svg ',`<svg x="${x+6}" y="${y}" `);
    const caption=entry.caption??c.name;
    const detail=entry.detail??`${c.archetype} / ${c.kind==='demon'?c.color:c.clothingColor}`;
    return `<rect x="${x+7}" y="${y+8}" width="${cellSize-14}" height="${cellSize+30}" rx="28" fill="#ffffff" fill-opacity=".6"/>${svg}<text x="${x+cellSize/2}" y="${y+cellSize+6}" text-anchor="middle" font-size="20" font-weight="800">${escSheet(caption)}</text><text x="${x+cellSize/2}" y="${y+cellSize+30}" text-anchor="middle" font-size="13" fill="#71567e">${escSheet(detail)}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${CREAM}"/><g font-family="Arial, sans-serif" fill="${INK}"><rect x="40" y="32" width="190" height="26" rx="13" fill="#fa416b"/><text x="135" y="50" text-anchor="middle" fill="#fff6df" font-size="12" font-weight="700" letter-spacing="2">HELL’S COMMITTEE</text><text x="40" y="101" font-size="36" font-weight="900">${escSheet(title)}</text><text x="40" y="128" font-size="16" fill="#71567e">${escSheet(subtitle)}</text>${cells}</g></svg>`;
}
