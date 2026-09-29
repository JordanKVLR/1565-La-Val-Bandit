/**
 * Ads are planned but not integrated yet (see docs/PLAN.md §6.1). Game code calls these hooks at
 * agreed break points; the no-op adapter keeps the build SDK-free and tracking-free until then.
 */
export type AdPlacement = 'chapter_end' | 'retry_reward' | 'bonus_scudi';

export interface AdsAdapter {
  maybeShowInterstitial(placement: AdPlacement): Promise<void>;
  showRewarded(placement: AdPlacement): Promise<boolean>;
}

export const noopAds: AdsAdapter = {
  maybeShowInterstitial: async () => {},
  showRewarded: async () => false,
};
