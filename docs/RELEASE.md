# Releasing Armatura 1565

One codebase, four destinations. Everything below starts from a clean `main`, with
`pnpm check` and `pnpm e2e` green.

| Destination      | Build                                                    | Output                                                               |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| Web (PWA)        | automatic on every merge to `main` (`deploy-web.yml`)    | `gh-pages` branch → https://jordankvlr.github.io/1565-La-Val-Bandit/ |
| Android test APK | automatic on every merge (`android.yml`)                 | "armatura-1565-debug-apk" artifact on the Actions run                |
| Google Play      | `pnpm --filter @m1565/game cap:android` → Android Studio | signed `.aab`                                                        |
| App Store        | `pnpm --filter @m1565/game cap:ios` → Xcode (macOS)      | archive uploaded to App Store Connect                                |
| Steam            | Actions → "Desktop builds (Steam)" → Run workflow        | unpacked Windows/macOS/Linux folders                                 |

## Web

- GitHub Pages must serve the `gh-pages` branch: **Settings → Pages → Build and deployment →
  Source: Deploy from a branch → Branch: `gh-pages` / `(root)` → Save.** GitHub normally does this
  automatically the first time that branch is pushed.
- The site installs as an app from the browser menu ("Add to Home screen" / "Install app") and
  works offline after the first visit.

## Trying the Android build on a phone

1. Open the latest **Android debug APK** run under the repo's **Actions** tab.
2. Download the `armatura-1565-debug-apk` artifact (a zip), unzip it, and copy `app-debug.apk`
   to the phone.
3. Open it on the phone and allow installing apps from that source when asked.

## Google Play (needs a Google Play Console account, one-off $25)

1. Change `appId` in `apps/game/capacitor.config.ts` if you want a different package name.
   **It can never change after the first upload.**
2. Create an upload keystore (Android Studio → Build → Generate Signed Bundle) and store it and
   its passwords somewhere safe outside the repo.
3. `pnpm --filter @m1565/game cap:android`, then **Build → Generate Signed App Bundle** in Android
   Studio.
4. In Play Console: create the app, complete the content rating (IARC), set up the data-safety
   form (the game collects no data today), add a privacy policy URL, screenshots (phone + 7"
   and 10" tablet, landscape), feature graphic and store listing text, then upload the `.aab` to an
   internal testing track first.

## App Store (needs an Apple Developer account, $99/year, and a Mac with Xcode)

1. `pnpm --filter @m1565/game cap:ios` opens the project in Xcode.
2. Set the Team and Bundle Identifier under **Signing & Capabilities**.
3. **Product → Archive**, then **Distribute App → App Store Connect**.
4. In App Store Connect: age rating, privacy "nutrition label" (no data collected today),
   screenshots for 6.7" and 6.5" iPhones and 12.9" iPad (landscape), then TestFlight before review.

## Steam (needs Steamworks, $100 per app)

1. Create the app in Steamworks and note its **App ID**.
2. Create achievements with these API names: `ACH_FIRST_STAND`, `ACH_OTHER_SHORE`,
   `ACH_ST_ELMO`, `ACH_ENDING_CROSS`, `ACH_ENDING_ISLAND`, `ACH_ENDING_CRESCENT`.
3. Run **Actions → Desktop builds (Steam) → Run workflow**, download each OS folder, and upload
   them as depots with SteamPipe (`steamcmd` + `app_build` scripts).
4. Set the launch options to the executable in each folder. Enable Steam Cloud for the
   `armatura.save.*` data once cloud saves are wired (see "Next steps").
5. Steam Deck: the game is landscape, 1280×800-friendly and touch/mouse driven. Gamepad input is
   still to do before applying for "Deck Verified".
6. Local test: `cd apps/desktop && node node_modules/electron/install.js && pnpm start`
   (`STEAM_APP_ID=<id>` with Steam running enables achievements).

## Ads (planned, not integrated)

The game calls `ads.maybeShowInterstitial('chapter_end')` style hooks through
`apps/game/src/platform/ads.ts`, which currently does nothing. Before adding an ad SDK:

- Mobile: AdMob via a Capacitor plugin, plus Google UMP consent (EU/UK) and Apple's App Tracking
  Transparency prompt; update the privacy policy and both stores' data forms.
- Web: a games ad network or portal SDK (e.g. CrazyGames/Poki).
- Steam: keep ad-free (Steam's rules restrict advertising); consider an optional paid
  supporter pack instead.

## Next steps before a store launch

- Final art: character sprites (2 facings × idle/walk/attack/hit), portraits, backgrounds,
  a proper icon and store artwork. The renderer takes `Sprite`s and portraits are one component,
  so swapping art needs no rules changes.
- Music and sound recordings to replace the generated placeholders in `platform/audio.ts`.
- Gamepad controls (Steam Deck), Steam Cloud and Play Games / Game Center save sync.
- A historical accuracy pass on dates and events (see PLAN §3.2).
