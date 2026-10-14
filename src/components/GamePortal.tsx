import { Link } from '@tanstack/react-router'
import { Monitor, Smartphone } from 'lucide-react'
import { Logo, Sprite, Stamp } from './Art'

export function GamePortal() {
  return <main className="game-portal"><div className="office-backdrop" /><div className="portal-shade" /><div className="portal-content"><Stamp>NOW HIRING</Stamp><Logo size="large" /><p className="portal-tagline">Great minds. Terrible judgment.</p><div className="portal-cast">{['greg', 'gus', 'norm', 'dot'].map(id => <Sprite key={id} id={id} />)}</div><div className="portal-invitation paper-stack"><h1>Make somebody’s eternity<br /><em>everybody’s problem.</em></h1><p>Pitch a punishment. Pick your favorites. Blame management.</p><div className="portal-buttons"><Link className="infernal-button" to="/host" search={{}} hash=""><Monitor size={21} /> HOST ON THE TV</Link><Link className="infernal-button button-lime" to="/join" search={{}} hash=""><Smartphone size={21} /> JOIN ON YOUR PHONE</Link></div><small>3–8 players · 3 sinners · one spectacularly bad meeting</small></div></div></main>
}
