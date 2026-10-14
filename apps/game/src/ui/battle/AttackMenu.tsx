import { attackFpCost } from '@m1565/core';
import { useRef, useState } from 'preact/hooks';
import type { BattleController } from '../../scenes/BattleController';
import { t } from '../../i18n';
import type { AnchorSource } from '../design';
import { Button, Divider, Icon, PHONE_QUERY, useAnchor, useMediaQuery } from '../design';
import { anchorInsets } from './anchoring';
import { ScrollArea } from './ScrollArea';
import { TechniqueEffects, techniqueEffects, TechniqueNumbers } from './TechniqueCard';

/**
 * The active unit's learned techniques (ones the pilot's level still holds back show as locked), in the place
 * the action bar stood: beside the unit on wide screens, docked bottom right on phones. Each row
 * gives the name and every number; the description is one tap away (ⓘ). A technique that can't
 * be used says why.
 */
export function AttackMenu({
  ctl,
  anchor,
}: {
  ctl: BattleController;
  /** Where the active unit is on screen; without it the list docks like on a phone. */
  anchor?: AnchorSource | null;
}) {
  const panel = useRef<HTMLElement>(null);
  const docked = useMediaQuery(PHONE_QUERY) || !anchor;
  useAnchor(panel, anchor ?? null, !docked, anchorInsets, { gap: 48, lift: 28 });
  const [open, setOpen] = useState<string | null>(null);
  const unit = ctl.active();
  if (!unit) return null;
  // Learned techniques are listed, plus those only the pilot's level still holds back (shown
  // locked with the level they open at); ones waiting on attributes stay a surprise.
  const options = ctl.attackOptions().filter((o) => o.unlocked || o.unlockLevel !== undefined);
  return (
    <section
      ref={panel}
      class={`ds-panel ds-elev-2 ds-outlined ov-panel ov-attack${docked ? ' is-docked' : ''}`}
      role="dialog"
      aria-label={t('attackMenu.label')}
    >
      <header class="ov-head">
        <div class="ov-head__text">
          <h2 class="ov-title">{t('overlay.attack.heading')}</h2>
          <span class="ov-sub">
            {t('attackMenu.ap', { ap: unit.ap, weapon: unit.weapon.name })}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon="back"
          label={t('common.back')}
          keyHint="back"
          navBack
          onClick={() => ctl.cancel()}
        />
      </header>
      <Divider class="ov-rule" />
      <ScrollArea class="ov-attack__scroll">
        <ul class="ov-techs">
          {options.map(({ attack, unlocked, unlockLevel, affordable, targets }) => {
            const usable = unlocked && affordable && targets.length > 0;
            const reason = !unlocked
              ? t('tech.unlocksAt', { level: unlockLevel ?? 1 })
              : !affordable
                ? t('attackMenu.noAp')
                : !targets.length
                  ? t('attackMenu.noTarget')
                  : '';
            const expanded = open === attack.id;
            const moreId = `tech-more-${attack.id}`;
            const hasMore = !!attack.description || techniqueEffects(attack).length > 0;
            return (
              <li
                key={attack.id}
                class={`ov-tech${expanded ? ' is-open' : ''}${unlocked ? '' : ' is-locked'}`}
              >
                <div class="ov-tech__row">
                  <button
                    type="button"
                    class="am-item"
                    disabled={!usable}
                    data-nav-default={usable || undefined}
                    onClick={() => ctl.chooseTechnique(attack.id)}
                  >
                    <span class="am-name">{attack.name}</span>
                    <TechniqueNumbers
                      attack={attack}
                      weapon={unit.weapon}
                      fpCost={attackFpCost(ctl.state, unit, attack)}
                      inline
                    />
                    {reason && (
                      <span class="am-reason">
                        <Icon name={unlocked ? 'warning' : 'lock'} class="am-reason__icon" />
                        {reason}
                      </span>
                    )}
                  </button>
                  {hasMore && (
                    <Button
                      class="ov-tech__info"
                      variant="ghost"
                      size="sm"
                      icon="info"
                      iconOnly
                      label={t('overlay.tech.more', { name: attack.name })}
                      aria-expanded={expanded}
                      aria-controls={moreId}
                      onClick={() => setOpen(expanded ? null : attack.id)}
                    />
                  )}
                </div>
                {expanded && (
                  <div class="ov-tech__more" id={moreId}>
                    {attack.description && <p class="ov-tc__desc">{attack.description}</p>}
                    <TechniqueEffects attack={attack} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </section>
  );
}
