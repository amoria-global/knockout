# Explore translations: review needed

The `explore` namespace (60 keys) lives in messages/{en,fr,es,sw,rw}.json and is the single source for the Explore
page; the mobile app and the dashboard copy these keys from here.

- **en**: source text.
- **fr, es**: written by the engineering assistant; a quick read by a native speaker is still wanted for tone.
- **sw (Kiswahili), rw (Kinyarwanda)**: first drafts that NEED a native reader before launch. The landing app only
  serves en, fr and es today (see i18n.ts: rw and sw are paused), so these two are stored but not yet shown.
  Please check especially: the licence line, the "already bought" flow (codeHint, codeInvalid, recoverBody), the
  15 second preview wording (previewEnds, buyFullHint) and the price words.

## Redesign keys (2026-11-27)
New keys under `explore` in all five locales: filtersWith, showResults, reset, type, priceLabel, sortLabel, moreLikeThis, viewProfile,
boughtShort, searchShort, subtitleShort, subtitle2, dims, savedEmpty, seeAll, cartCount, approx, loadingMore, priceUpShort, priceDownShort,
min, max, linkCopied, typeLabel. English is the source. Spanish and French are machine drafted. Swahili and Kinyarwanda are best effort and
still need a native read before they are treated as final (same status as the earlier Explore strings).

## Landing-style rebuild (2026-11-28)
New explore.* keys: heroEyebrow, heroTitle, heroTitleShort, heroSub, heroSubShort, sellCta, allTypes, allCategories, anyPrice, itemsFound, itemsFoundMore, apply, clearPrice, resultsBar. es and fr are machine drafted; sw and rw need a native read (itemsFound has no plural form in sw and rw).
