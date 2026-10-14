export const VOICE_IDS = ['committee', 'weird', 'showtime'] as const
export type VoiceId = typeof VOICE_IDS[number]
export type Voice = {
  id: VoiceId; name: string; hint: string; headline: [string, string]
  phoneWelcome: [string, string]
  pitchHeadline: [string, string]; sticky: [string, string]
  writingLabel: string; placeholder: string; pitchTip: string; filed: string
  voteHeadline: [string, string]
  verdictHeadline: [string, string]
  footer: { lobby: string; round: string; verdict: string }
}
export const DEFAULT_VOICE: VoiceId = 'committee'
export function voiceId(value: unknown): VoiceId | undefined {
  return VOICE_IDS.includes(value as VoiceId) ? value as VoiceId : undefined
}
export const VOICES: Record<VoiceId, Voice> = {
  committee: {
    id:'committee', name:'The chaos committee', hint:'Overconfident office monsters.',
    headline:['GREAT MINDS.','TERRIBLE JUDGMENT.'],
    phoneWelcome:['WELCOME TO','BAD MANAGEMENT.'],
    pitchHeadline:['PROPOSE','A DISASTER.'], sticky:['ALL POWER.','NO CLUE.'],
    writingLabel:'WHAT COULD POSSIBLY GO WRONG?', placeholder:'Give this sinner a spectacularly bad eternity.',
    pitchTip:'Make it fit the sinner. Then get wildly carried away.', filed:'A terrible idea. We’re promoting you.',
    voteHeadline:['BAD IDEAS.','BIG DECISIONS.'],
    verdictHeadline:['ANOTHER DISASTER.','APPROVED.'],
    footer:{lobby:'EVERYONE IS QUALIFIED. APPARENTLY.',round:'ANY IDEA CAN BECOME COMPANY POLICY.',verdict:'THE AFTERLIFE IS IN QUESTIONABLE HANDS.'},
  },
  weird: {
    id:'weird', name:'Make hell weird', hint:'Big, surreal cartoon chaos.',
    headline:['WELCOME TO HELL.','MAKE IT WEIRD.'],
    phoneWelcome:['WELCOME TO','WEIRD COMPANY.'],
    pitchHeadline:['MAKE IT','UNHINGED.'], sticky:['REALITY?','OPTIONAL.'],
    writingLabel:'WHAT DOES YOUR BRAIN DO WITH THIS?', placeholder:'Invent an eternity that only makes sense in hell.',
    pitchTip:'Make it fit the sinner. Reality can take the night off.', filed:'We have several questions. All impressed.',
    voteHeadline:['CHOOSE','THE CHAOS.'],
    verdictHeadline:['HELL JUST GOT','WEIRDER.'],
    footer:{lobby:'IMAGINATION REQUIRED. CONSCIENCE OPTIONAL.',round:'ANYTHING IS POSSIBLE. UNFORTUNATELY.',verdict:'SOMEONE HAS TO EXPLAIN THIS TO THE UNIVERSE.'},
  },
  showtime: {
    id:'showtime', name:'Showtime in hell', hint:'Camp hosts. Applause. Bad taste.',
    headline:['DAMN GOOD.','BAD IDEAS.'],
    phoneWelcome:['WELCOME TO','THE WORST SHOW.'],
    pitchHeadline:['GIVE US','A SHOWSTOPPER.'], sticky:['BIG IDEAS.','BIG FINISH.'],
    writingLabel:'GIVE THIS ETERNITY SOME STAR POWER.', placeholder:'Pitch a punishment that brings the house down.',
    pitchTip:'Make it fit the sinner. Make the room lose it.', filed:'Disgusting. Five stars.',
    voteHeadline:['STEAL','THE SHOW.'],
    verdictHeadline:['HELL OF','A PERFORMANCE.'],
    footer:{lobby:'BIG CAST. BAD JUDGMENT.',round:'THIS ETERNITY IS BROUGHT TO YOU BY BAD IDEAS.',verdict:'THAT’S ENTERTAINMENT. APPARENTLY.'},
  },
}
