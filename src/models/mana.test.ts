import { describe, expect, it } from 'vitest'
import { getColorsComplement, getManaSymbolUrl, MANA_SYMBOL_BASE_URL, setStandardColorOrder } from './mana'

describe('mana models', () => {
    it.each<[string[], boolean, string[]]>([
        // Complement of single color
        [['G'], true, ['W', 'U', 'B', 'R']],
        // Complement of single color with colorless
        [['U'], false, ['W', 'B', 'R', 'G', 'C']],
        // Complement of multiple colors
        [['W', 'B'], true, ['U', 'R', 'G']],
        // Complement of multiple colors with colorless
        [['W', 'R'], false, ['U', 'B', 'G', 'C']],
        // Complement of all colors
        [['W', 'U', 'B', 'R', 'G'], true, []],
        // Complement of all colors with colorless
        [['W', 'U', 'B', 'R', 'G'], false, ['C']],
        // Complement of no colors
        [[], true, ['W', 'U', 'B', 'R', 'G']],
        // Complement of no colors with colorless
        [[], false, ['W', 'U', 'B', 'R', 'G', 'C']],
        // Complement of colorless
        [['C'], false, ['W', 'U', 'B', 'R', 'G']],
    ])('returns color complements', (colors: string[], removeColorless: boolean, expectedColors: string[]) =>{
        const colorComplement = getColorsComplement(colors, removeColorless)

        expect(colorComplement).toEqual(expectedColors)
    })

    it.each<[string[], boolean, string[]]>([
        // Single color
        [['W'], true, ['W']],
        // Ordered pair of colors (simic)
        [['U', 'G'], true, ['G', 'U']],
        // Unordered pair of colors (golgari)
        [['G', 'B'], false, ['B', 'G']],
        // Ordered triad of colors (jeskai)
        [['W', 'U', 'R'], true, ['U', 'R', 'W']],
        // Unordered triad of colors (bant)
        [['U', 'W', 'G'], false, ['G', 'W', 'U']],
        // Ordered quartet of colors (Glint-Eye)
        [['U', 'B', 'R', 'G'], true, ['U', 'B', 'R', 'G']],
        // Unordered quartet of colors (Yore-Tiller)
        [['U', 'R', 'B', 'W'], false, ['W', 'U', 'B', 'R']],
        // Ordered rainbow of colors
        [['W', 'U', 'B', 'R', 'G'], true, ['W', 'U', 'B', 'R', 'G']],
        // Unordered rainbow of colors
        [['G', 'U', 'B', 'W', 'R'], false, ['W', 'U', 'B', 'R', 'G']],
    ])('returns the standard color order', (colors: string[], ordered: boolean, expectedColors: string[]) => {
        const colorOrder = setStandardColorOrder(colors, ordered)

        expect(colorOrder).toEqual(expectedColors)
    })

    it.each([
        ['{W}', `${MANA_SYMBOL_BASE_URL}W.svg`],
        ['w', `${MANA_SYMBOL_BASE_URL}W.svg`],
        ['{2}', `${MANA_SYMBOL_BASE_URL}2.svg`],
        ['{u/b}', `${MANA_SYMBOL_BASE_URL}UB.svg`],
        ['{2/G}', `${MANA_SYMBOL_BASE_URL}2G.svg`],
    ])('builds a mana symbol URL', (input: string, expectedURL: string) => {
        const manaSymbolURL = getManaSymbolUrl(input)

        expect(manaSymbolURL).toEqual(expectedURL)
    })
})
