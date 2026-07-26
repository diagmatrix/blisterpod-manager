/**
 * About page copy, kept as Markdown so the wording can be edited without
 * touching JSX. Rendered by `@/components/Markdown`.
 *
 * The changelog is imported from the repository root rather than copied here,
 * so the About page and `CHANGELOG.md` can never drift apart.
 */
import attributions from './attributions.md?raw'
import disclaimers from './disclaimers.md?raw'
import changelog from '../../../../CHANGELOG.md?raw'

export { attributions, disclaimers, changelog }
