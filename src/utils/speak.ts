/** Speak text aloud via browser speechSynthesis API. Rate defaults to 0.9 (slightly slower for kids). */
export function speak(text: string, rate = 0.9) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    window.speechSynthesis.speak(utterance)
  }
}
