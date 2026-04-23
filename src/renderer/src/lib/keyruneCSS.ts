export function injectKeyruneCSS(): void {
  if (document.getElementById('keyrune-override')) return
  const link = document.createElement('link')
  link.id = 'keyrune-override'
  link.rel = 'stylesheet'
  // keyrune://app/ acts as the dummy hostname so that the CSS's relative font
  // paths (../fonts/keyrune.*) resolve to keyrune://app/fonts/*, which our
  // protocol handler maps to ASSETS_DIR/fonts/* via url.pathname only.
  link.href = 'keyrune://app/css/keyrune.min.css'
  document.head.appendChild(link)
}
