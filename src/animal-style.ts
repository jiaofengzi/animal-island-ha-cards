/** Build-time CSS loading removes only font-face assets and adds :host token scope. */
import 'animal-island-ui/style';
export const animalStyle=(globalThis as typeof globalThis & {__islandAnimalStyle:string}).__islandAnimalStyle;
