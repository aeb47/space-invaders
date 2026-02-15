import { CONFIG } from '../config';

function getRankTier(wave: number): string {
  const tiers = CONFIG.difficultyTiers;
  if (wave >= tiers.admiral.minWave) return 'Admiral';
  if (wave >= tiers.commander.minWave) return 'Commander';
  if (wave >= tiers.veteran.minWave) return 'Veteran';
  if (wave >= tiers.soldier.minWave) return 'Soldier';
  return 'Recruit';
}

export function getStarRating(wave: number): number {
  const thresholds = CONFIG.share.starThresholds; // [3, 6, 9, 14]
  let stars = 1;
  for (const threshold of thresholds) {
    if (wave > threshold) {
      stars++;
    }
  }
  return stars;
}

function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}

function renderStars(count: number): string {
  const filled = '\u2605'; // black star
  const empty = '\u2606';  // white star
  return filled.repeat(count) + empty.repeat(5 - count);
}

export function generateShareText(
  score: number,
  wave: number,
  accuracy: number,
  _shipName: string,
): string {
  const stars = getStarRating(wave);
  const rank = getRankTier(wave);
  const formattedScore = formatScore(score);

  return [
    `SPACE INVADERS \u{1F579}\uFE0F`,
    `Score: ${formattedScore} \u2502 Wave: ${wave} \u2502 Rank: ${rank} \u2502 Accuracy: ${accuracy}%`,
    renderStars(stars),
  ].join('\n');
}
