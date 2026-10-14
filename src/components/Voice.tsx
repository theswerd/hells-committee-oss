import { createContext, useContext } from 'react'
import { DEFAULT_VOICE, VOICES } from '../voice'
import type { VoiceId } from '../voice'

const VoiceContext = createContext(VOICES[DEFAULT_VOICE])
export function VoiceProvider({ children, tone }: { children: React.ReactNode; tone?: VoiceId }) {
  return <VoiceContext.Provider value={VOICES[tone ?? DEFAULT_VOICE]}>{children}</VoiceContext.Provider>
}
export const useVoice = () => useContext(VoiceContext)
