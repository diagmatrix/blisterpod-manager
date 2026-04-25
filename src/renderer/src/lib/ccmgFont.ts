export function injectCCMGFontFace(): void {
  if (document.getElementById('ccmg-font-face')) return
  const style = document.createElement('style')
  style.id = 'ccmg-font-face'
  style.textContent = "@font-face { font-family: 'CCMG'; src: url('app-font://app/CCMG.otf') format('opentype'); }"
  document.head.appendChild(style)
}

export function applyCCMGFont(active: boolean): void {
  if (active) {
    injectCCMGFontFace()
    document.documentElement.classList.add('font-ccmg')
  } else {
    document.documentElement.classList.remove('font-ccmg')
  }
}
