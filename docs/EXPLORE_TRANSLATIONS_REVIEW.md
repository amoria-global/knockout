# Explore translations: review needed

The `explore` namespace (60 keys) lives in messages/{en,fr,es,sw,rw}.json and is the single source for the Explore
page; the mobile app and the dashboard copy these keys from here.

- **en**: source text.
- **fr, es**: written by the engineering assistant; a quick read by a native speaker is still wanted for tone.
- **sw (Kiswahili), rw (Kinyarwanda)**: first drafts that NEED a native reader before launch. The landing app only
  serves en, fr and es today (see i18n.ts: rw and sw are paused), so these two are stored but not yet shown.
  Please check especially: the licence line, the "already bought" flow (codeHint, codeInvalid, recoverBody), the
  15 second preview wording (previewEnds, buyFullHint) and the price words.
