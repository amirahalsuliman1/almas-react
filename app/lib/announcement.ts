/**
 * The announcement bar's dismissal. A visitor who closes the bar does not see
 * that text again; a new text shows again, because the storage key is a hash of
 * the text. The class goes on `<html>` before first paint, so a dismissed bar
 * never paints and then vanishes (a layout shift of its whole height).
 */
export const DISMISSED_CLASS = 'announcement-dismissed';

/** A short, stable key for this announcement text. */
export function dismissKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return `am1als:announcement:${(hash >>> 0).toString(36)}`;
}

/** Inline, before paint: hide the bar for a visitor who closed this text. */
export function dismissedScript(key: string): string {
  return `try{if(localStorage.getItem(${JSON.stringify(key)}))document.documentElement.classList.add('${DISMISSED_CLASS}')}catch(e){}`;
}
