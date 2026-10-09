import { Store } from '../../state/store';
import type { InputDevice } from './controls';

/**
 * The input the player used last: prompts follow it (pad glyphs or key letters), and the page
 * carries it as `<html data-input="…">` so CSS can always show the focus ring for a pad.
 */
export const inputDevice = new Store<InputDevice>('pointer');

export function setInputDevice(device: InputDevice): void {
  if (inputDevice.get() === device) return;
  inputDevice.set(device);
  if (typeof document !== 'undefined') document.documentElement.dataset.input = device;
}
