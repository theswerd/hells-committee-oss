import { ArrowRight, Check, Smartphone } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Ribbon, Sprite, Stamp } from './Art'

export type QuestionCard = { id: string; choices: { id: string; text: string }[] }
function AnswerText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const slot = ref.current, copy = slot?.firstElementChild as HTMLSpanElement | null
    if (!slot || !copy) return
    let active = true
    const fit = () => {
      if (!active) return
      let size = text.length > 112 ? 20 : 23
      copy.style.fontSize = size + 'px'
      while (copy.offsetHeight > slot.clientHeight + 1 && size > 14) { size -= .5; copy.style.fontSize = size + 'px' }
    }
    const observer = new ResizeObserver(fit); observer.observe(slot)
    void document.fonts.ready.then(fit)
    return () => { active = false; observer.disconnect() }
  }, [text])
  return <span className="favorite-text" ref={ref}><span>{text}</span></span>
}
export function FavoriteQuestion({ question, index, total, selected, onSelect, onConfirm, pending = false, error }: {
  question: QuestionCard; index: number; total: number
  selected: string | null; onSelect: (id: string) => void; onConfirm: () => void; pending?: boolean; error?: string
}) {
  return <form className="phone-vote favorite-vote" onSubmit={event => { event.preventDefault(); if (question.choices.some(choice => choice.id === selected) && !pending) onConfirm() }}>
    <div className="favorite-progress"><span>GROUP {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span><div aria-label={`${index} of ${total} favorites filed`}>{Array.from({ length: total }, (_, i) => <i key={i} className={i < index ? 'done' : i === index ? 'current' : ''}>{i < index ? <Check size={11} /> : i + 1}</i>)}</div></div>
    <Ribbon>YOUR FAVORITE?</Ribbon>
    <fieldset className={`favorite-cards choices-${question.choices.length}`} aria-label="Choose your favorite punishment"><legend className="sr-only">Which of these punishments is your favorite?</legend>{question.choices.map(choice => <label className={`favorite-card ${selected === choice.id ? 'selected' : ''}`} key={choice.id}>
      <input type="radio" name={question.id} value={choice.id} checked={selected === choice.id} onChange={() => onSelect(choice.id)} disabled={pending} />
      <AnswerText text={choice.text} />
      <span className="radio-mark" aria-hidden="true">{selected === choice.id && <Check size={18} strokeWidth={4} />}</span>
    </label>)}</fieldset>
    {error && <p className="favorite-error" role="alert">{error}</p>}
    <button className="infernal-button" type="submit" disabled={!question.choices.some(choice => choice.id === selected) || pending}>{pending ? 'FILING YOUR PICK…' : index + 1 === total ? 'FILE MY FAVORITES' : 'PICK & NEXT GROUP'}{index + 1 === total ? <Check size={22} strokeWidth={4} /> : <ArrowRight size={22} />}</button>
  </form>
}

export function FavoriteReceipt({ demon, favorites }: { demon: string; favorites: { text: string }[] }) {
  return <div className="phone-voted favorite-receipt"><Ribbon lime>FAVORITES FILED.</Ribbon><div className="voted-portrait"><Sprite id={demon} pose="stamping" /></div>
    <article className="voted-ticket paper-stack"><Stamp>DECIDEDLY EVIL</Stamp><h2>Your terrible taste.<br />Officially on record.</h2><ol>{favorites.map((pick, index) => <li key={index}>{pick.text}</li>)}</ol></article>
    <p className="phone-fineprint">Look up. The committee is still deciding.</p>
  </div>
}

export function FavoriteTV({ headline, subject, groups, completed, total }: { headline: [string, string]; subject: string; groups: number; completed: number; total: number }) {
  return <div className="vote-scene favorite-tv"><h1 className="scene-headline">{headline[0]} <span>{headline[1]}</span></h1>
    <div className="favorite-docket paper-stack"><span className="type-label">THE CASE OF {subject.toUpperCase()}</span><h2>Great taste.<br /><em>Terrible consequences.</em></h2><div className="docket-phone"><Smartphone /><span>?</span><i>✦</i></div><div className="favorite-steps"><span><b>{groups}</b> SHORT {groups === 1 ? 'GROUP' : 'GROUPS'}</span><span><b>1</b> FAVORITE IN EACH</span><span><b>0</b> SELF VOTES</span></div><p>Different mixes on each phone. Give every idea a chance.</p><Stamp>THE COMMITTEE DECIDES</Stamp></div>
    <div className="favorite-demon left"><Sprite id="gus" pose="voting" /></div><div className="favorite-demon right"><Sprite id="dot" pose="voting" /></div>
    <Ribbon lime className="vote-instruction"><Smartphone size={24} /> Choose on your phone.<span className="ballots-in">{completed}/{total} DEMONS DECIDED</span></Ribbon>
  </div>
}
