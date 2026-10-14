export type Scene = 'lobby' | 'case' | 'pitch' | 'vote' | 'verdict'
export type Demon = 'beelzebabs' | 'mothmanager' | 'litigator' | 'greg' | 'velvet' | 'bonejamin' | 'cerberus' | 'dolly' | 'gus' | 'norm' | 'dot'
export type SinnerId = 'john' | 'maya' | 'brad' | 'tessa' | 'derek' | 'pam' | 'olivia' | 'elliot' | 'david'
export const PLAYERS: { id: Demon; name: string; job: string; color: string }[] = [
  { id: 'beelzebabs', name: 'Beelzebabs', job: 'Chaos & compliance', color: '#ff466e' },
  { id: 'mothmanager', name: 'Mothmanager', job: 'Human suffering resources', color: '#bf9be6' },
  { id: 'litigator', name: 'Lil’ Litigator', job: 'Legal damnation', color: '#efd856' },
  { id: 'greg', name: 'Greg', job: 'Just here for the benefits', color: '#a9dfb7' },
  { id: 'velvet', name: 'Velvet Vice', job: 'Vice president of spite', color: '#7695ef' },
  { id: 'bonejamin', name: 'Bonejamin', job: 'Been here since the bone age', color: '#e98536' },
  { id: 'cerberus', name: 'Cerberus', job: 'Three heads. One expense account.', color: '#55bab7' },
  { id: 'dolly', name: 'Dolly Doom', job: 'Hazard pay & questionable expenses', color: '#eb579b' },
  { id: 'gus', name: 'Gus Grumble', job: 'Stamping & complaints', color: '#df6d40' },
  { id: 'norm', name: 'Norm Goyle', job: 'The load-bearing employee', color: '#a6a39b' },
  { id: 'dot', name: 'Dot', job: 'Records & reprimands', color: '#dd197d' },
]
export const OPENING_CAST: Demon[] = ['greg', 'gus', 'norm', 'dot', 'beelzebabs', 'mothmanager', 'bonejamin', 'cerberus']
export const DEMON_CHOICES = OPENING_CAST.map(id => PLAYERS.find(player => player.id === id)!)
export const SINNERS: Record<SinnerId, { name: string; age?: number; title: string; sins: string; quote: string; label: string; likes: string[]; pronoun: 'his' | 'her' }> = {
  john: { name: 'John', age: 34, title: 'Professional brunch guest', sins: 'Yells at waiters.\nNever tips.\nSteals the table jam.', quote: '“I’m basically keeping this place in business.”', label: 'BRUNCH MENACE', likes: ['Himself', 'Bottomless mimosas', 'The manager'], pronoun: 'his' },
  maya: { name: 'Maya', age: 28, title: 'Group chat administrator', sins: 'Says “let’s hang.”\nNever picks a date.\nCancels by emoji.', quote: '“Omg yes!! Let’s do something soon 💕”', label: 'REPEAT FLAKER', likes: ['Vague plans', 'Unread messages', 'Rain checks'], pronoun: 'her' },
  brad: { name: 'Brad', age: 46, title: 'Visionary. Founder. Problem.', sins: 'Calls staff “family.”\nFires them on Friday.\nBills for the cake.', quote: '“We need everyone to give 110 percent.”', label: 'CORPORATE MENACE', likes: ['Synergy', 'Unpaid overtime', 'His own podcast'], pronoun: 'his' },
  tessa: { name: 'Tessa', age: 32, title: 'Wellness guru', sins: 'Sells a 5 a.m. cleanse.\nCalls naps “failure.”\nCharges for the cure.', quote: '“Your exhaustion is a mindset.”', label: 'SELF-CARE SCAM', likes: ['Cold plunges', 'Referral codes', 'Her ring light'], pronoun: 'her' },
  derek: { name: 'Derek', age: 57, title: 'Neighborhood watch president', sins: 'Measures every lawn.\nFines sidewalk chalk.\nBans birthday balloons.', quote: '“The bylaws are very clear.”', label: 'CURB TYRANT', likes: ['Clipboards', 'Property lines', 'Anonymous complaints'], pronoun: 'his' },
  pam: { name: 'Pam', age: 41, title: 'Office kitchen regular', sins: 'Steals labeled lunches.\nMicrowaves fish at noon.\nCalls it “team culture.”', quote: '“If it’s in the fridge, it’s for everyone.”', label: 'FRIDGE BANDIT', likes: ['Other people’s yogurt', 'Passive-aggressive notes', 'Tuna'], pronoun: 'her' },
  olivia: { name: 'Olivia', age: 26, title: 'Apology video creator', sins: 'Films every apology.\nOpens with a sponsor.\nCries in the thumbnail.', quote: '“I’m taking accountability. Link in bio.”', label: 'CONTENT MENACE', likes: ['Tripods', 'Tear filters', 'Engagement'], pronoun: 'her' },
  elliot: { name: 'Elliot', age: 38, title: 'Queue management expert', sins: 'Cuts for twelve friends.\nCalls it “networking.”\nComplains about the wait.', quote: '“My friends are just around the corner.”', label: 'LINE CRIMINAL', likes: ['Priority lanes', 'Placeholder jackets', 'His own time'], pronoun: 'his' },
  david: { name: 'David', title: 'Meeting enthusiast', sins: 'Books lunch for a sync.\nAdds a pre-meeting.\nOne more slide, please.', quote: '“Just a quick sync.”', label: 'SYNC MENACE', likes: ['Calendar holds', 'Follow-ups', 'One more slide'], pronoun: 'his' },
}
