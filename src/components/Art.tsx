import { useEffect, useRef, useState } from 'react'

export function Skull({ className = '' }: { className?: string }) {
  return <svg className={`skull ${className}`} viewBox="0 0 80 104" aria-hidden="true"><path d="M42 4C24 32 34 27 19 34c2-16-7-18-7-18S-2 53 6 66c7 16 48 21 64-1 14-20-8-44-8-44s1 23-10 24C42 41 40 29 48 17Z" fill="#ff4262" stroke="#28152f" strokeWidth="4" strokeLinejoin="round"/><path d="M38 43C16 43 11 62 14 74c2 10 9 13 13 15v10h27V89c10-4 13-12 12-21-2-15-12-25-28-25Z" fill="#fff2d2" stroke="#28152f" strokeWidth="4"/><ellipse cx="29" cy="68" rx="7" ry="9" fill="#28152f"/><ellipse cx="50" cy="68" rx="7" ry="9" fill="#28152f"/><path d="m40 77-5 7h10Z" fill="#28152f"/><path d="M34 91v8m12-8v8" stroke="#28152f" strokeWidth="3"/></svg>
}
export function Logo({ size = 'small' }: { size?: 'small' | 'large' | 'tiny' }) {
  return <div className={`game-logo logo-${size}`} aria-label="Hell’s Committee"><Skull /><div className="logo-type"><span>HELL’S</span><strong>COMMITTEE</strong></div></div>
}
export function Sprite({ id, pose = 'idle', className = '', name, vector = false, format }: { id: string; pose?: string; className?: string; name?: string; vector?: boolean; format?: 'svg' | 'webp' | 'png' }) {
  return <img className={`sprite ${className}`} src={`/art/${id}-${pose}.${format ?? (vector ? 'svg' : 'webp')}`} alt={name ?? id.replace('mothmanager', 'Mothmanager').replace('litigator', 'Lil’ Litigator')} draggable={false} />
}
export function Stamp({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`rubber-stamp ${className}`}>{children}</span>
}
export function Ribbon({ children, lime = false, className = '' }: { children: React.ReactNode; lime?: boolean; className?: string }) {
  return <div className={`ribbon ${lime ? 'ribbon-lime' : ''} ${className}`}><span className="ribbon-rays">✹</span>{children}<span className="ribbon-rays">✹</span></div>
}
export function ScaledCanvas({ width, height, className = '', children }: { width: number; height: number; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [width])
  return <div ref={ref} className={`canvas-frame ${className}`} style={{ aspectRatio: `${width}/${height}` }}><div className="canvas" style={{ width, height, transform: `scale(${scale})` }}>{children}</div></div>
}
export function Paperclip() { return <svg className="paperclip" viewBox="0 0 38 86" aria-hidden="true"><path d="M25 60V17C25 1 4 2 4 18v53c0 21 30 18 30 0V20M14 20v48c0 9 11 8 11 0" fill="none" stroke="#28152f" strokeWidth="8" strokeLinecap="round"/><path d="M25 60V17C25 1 4 2 4 18v53c0 21 30 18 30 0V20M14 20v48c0 9 11 8 11 0" fill="none" stroke="#ddc7a2" strokeWidth="4" strokeLinecap="round"/></svg> }
export function Prop({ kind, className = '' }: { kind: 'pancakes' | 'socks' | 'phone' | 'coffee'; className?: string }) {
  return <svg className={`punishment-prop ${className}`} viewBox="0 0 150 120" aria-hidden="true"><g stroke="#28152f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'pancakes' && <><ellipse cx="65" cy="99" rx="58" ry="12" fill="#fff9e7"/><path d="M15 84c0 24 96 23 96 0V67H15Z" fill="#d88b45"/><ellipse cx="64" cy="67" rx="48" ry="13" fill="#f8cf79"/><path d="M21 65c0 20 88 20 88 0V49H21Z" fill="#c9763f"/><ellipse cx="65" cy="49" rx="44" ry="12" fill="#ffdb8e"/><path d="M26 44c0 16 78 18 78 0V34H26Z" fill="#d88b45"/><ellipse cx="65" cy="34" rx="39" ry="11" fill="#ffdb8e"/><path d="m48 27 22-7 22 6-16 11Z" fill="#f5de66"/><path d="M35 34c6 7 14 2 20 8 7 7-1 20 7 24 9 5 14-4 13-12 0-8 5-14 18-15" fill="#b96c3c"/><path d="M113 68h25v29c-2 14-24 13-25 0Z" fill="#fff7df"/><path d="M138 74c19 0 16 19 0 19M117 54q-8-8 0-16m12 16q8-10 0-16" fill="none"/><path d="m9 31 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#f2d85f" strokeWidth="2"/></>}
    {kind === 'socks' && <><ellipse cx="72" cy="104" rx="66" ry="12" fill="#9ce5df" stroke="#518bba"/><path d="M25 16h36v53l25 19c15 18-11 25-29 13L25 79Z" fill="#af92d8"/><path d="M74 9h34v48l29 18c20 14-4 28-24 17L75 69Z" fill="#756aba"/><path d="M25 29h36m-36 12h36m13-18h34M74 34h34" stroke="#fff2d2" strokeWidth="7"/><path d="M58 77q-13 10-14 21m65-36q-13 8-15 18" fill="none"/><path d="M16 56q-9 14 0 17 10-2 0-17Zm113-37q-9 14 0 17 10-2 0-17Z" fill="#9bdedc" stroke="#518bba" strokeWidth="2"/><path d="M14 99h14m77 10h23" stroke="#fff5df" strokeWidth="3"/></>}
    {kind === 'phone' && <><path d="m21 58 13-33h82l17 33v39H21Z" fill="#e94462"/><rect x="21" y="79" width="112" height="21" rx="7" fill="#ca3151"/><circle cx="78" cy="65" r="27" fill="#ffe2a7"/><circle cx="78" cy="65" r="13" fill="#5f3652"/><path d="M30 27q-9-16 4-20 23-8 40 0 30-9 49-1 16 7 2 23l-23-6v-9H55v10Z" fill="#ed4e6c"/><path d="M123 30q27 19 6 35t5 32" fill="none"/><g fill="#28152f" stroke="none"><circle cx="77" cy="45" r="3"/><circle cx="92" cy="51" r="3"/><circle cx="98" cy="66" r="3"/><circle cx="92" cy="81" r="3"/><circle cx="77" cy="87" r="3"/><circle cx="62" cy="80" r="3"/><circle cx="57" cy="65" r="3"/><circle cx="63" cy="51" r="3"/></g></>}
    {kind === 'coffee' && <><ellipse cx="65" cy="103" rx="53" ry="11" fill="#fff2d2"/><path d="M25 36h76v48c-5 30-73 30-76 0Z" fill="#fff2d2"/><ellipse cx="63" cy="36" rx="38" ry="10" fill="#754533"/><path d="M101 46c32-8 38 40 0 38" fill="none" strokeWidth="9"/><path d="M50 24q-16-14 0-22m20 22q16-14 0-22m15 22q-8-9 0-15" fill="none" stroke="#bc9cc6" strokeWidth="3"/><path d="M46 60h35m-30 12h25" stroke="#ff4168" strokeWidth="4"/><path d="m119 13 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" fill="#e4ee75" strokeWidth="2"/></>}
  </g></svg>
}
