import React from 'react';
import { ScoringConfig, ScoringPreset, GameFormat, StandingsFormat } from '../api';

interface ScoringConfigSectionProps {
  config: Partial<ScoringConfig>;
  onChange: (updates: Partial<ScoringConfig>) => void;
  /** When provided, called on preset click to hit the API live (edit flow).
   *  When undefined, preset selection only updates local state (create flow). */
  onPresetApply?: (preset: ScoringPreset) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const PRESETS: { value: ScoringPreset; label: string; description: string }[] = [
  { value: 'simple_win_loss', label: 'Simple Win/Loss', description: 'Track wins and losses only' },
  { value: 'bca_8ball', label: 'BCA 8-Ball', description: 'Ball points, BCA rules' },
  { value: 'vnea', label: 'VNEA / 10-Point', description: '10-point system, handicap-friendly' },
  { value: 'nine_ball', label: '9-Ball Points', description: 'Ball points for 9-ball format' },
  { value: 'race_to_wins', label: 'Race to Wins', description: 'First to N wins the match' },
  { value: 'custom', label: 'Custom', description: 'Fine-tune individual scoring values' },
];

const GAME_FORMATS: { value: GameFormat; label: string; description: string }[] = [
  { value: 'win_loss', label: 'Win/Loss', description: 'Track match wins only' },
  { value: 'ball_points_8ball', label: 'Ball Points (8-Ball)', description: '8-ball rack scoring' },
  { value: 'ball_points_9ball', label: 'Ball Points (9-Ball)', description: '9-ball rack scoring' },
  { value: 'race_to_wins', label: 'Race to Wins', description: 'First to reach win count' },
];

const STANDINGS_FORMATS: { value: StandingsFormat; label: string; description: string }[] = [
  { value: 'win_loss_pct', label: 'Win/Loss %', description: 'Rank by win percentage' },
  { value: 'match_points', label: 'Match Points', description: 'Points awarded per result (W/T/L)' },
  { value: 'cumulative_points', label: 'Cumulative Points', description: 'Total ball points earned' },
];

function buildPreviewLine(config: Partial<ScoringConfig>): string {
  if (!config.game_format) return '';
  if (config.game_format === 'race_to_wins') {
    return config.race_to
      ? `First to ${config.race_to} game wins the match`
      : 'Race to wins format';
  }
  if (config.game_format === 'win_loss') {
    return 'Win/Loss standings — no ball points tracked';
  }
  if (config.max_points_per_game != null) {
    return `A winning player scores up to ${config.max_points_per_game} pts/rack  ·  Shutout: ${config.max_points_per_game}–0  ·  Close game: ${config.max_points_per_game}–${config.max_points_per_game - (config.ball_value ?? 1)}`;
  }
  return '';
}

const ScoringConfigSection: React.FC<ScoringConfigSectionProps> = ({
  config,
  onChange,
  onPresetApply,
  isLoading = false,
  readOnly = false,
}) => {
  const isCustom = config.preset === 'custom';
  const isBallPoints = config.game_format === 'ball_points_8ball' || config.game_format === 'ball_points_9ball';
  const isRaceTo = config.game_format === 'race_to_wins';
  const isMatchPoints = config.standings_format === 'match_points';
  const previewLine = buildPreviewLine(config);

  const handlePresetClick = async (preset: ScoringPreset) => {
    if (readOnly || isLoading) return;
    if (onPresetApply) {
      await onPresetApply(preset);
    } else {
      onChange({ preset });
    }
  };

  const handleFieldChange = (field: keyof ScoringConfig, value: unknown) => {
    if (readOnly) return;
    onChange({ [field]: value, preset: 'custom' });
  };

  const tileClass = (isActive: boolean, disabled: boolean) =>
    `text-left p-3 rounded-lg border-2 transition-all ${
      isActive
        ? 'border-primary-500 bg-primary-50'
        : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
    } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`;

  return (
    <div className="space-y-6">
      {/* Scoring Preset */}
      <div>
        <label className="form-label mb-3 block">Scoring Preset</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRESETS.map((p) => {
            const isActive = config.preset === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePresetClick(p.value)}
                disabled={readOnly || isLoading}
                className={tileClass(isActive, readOnly || isLoading)}
              >
                <div className={`font-semibold text-sm ${isActive ? 'text-primary-700' : 'text-dark'}`}>
                  {p.label}
                </div>
                <div className="text-xs text-dark-300 mt-1">{p.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Match Structure — always visible */}
      <div>
        <label className="form-label mb-3 block">Sets per Match</label>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const isActive = config.sets_per_match === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleFieldChange('sets_per_match', n)}
                disabled={readOnly || isLoading}
                className={tileClass(isActive, readOnly || isLoading)}
              >
                <div className={`font-semibold text-sm text-center ${isActive ? 'text-primary-700' : 'text-dark'}`}>
                  {n}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="form-label mb-3 block">Games per Set</label>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const isActive = config.games_per_set === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleFieldChange('games_per_set', n)}
                disabled={readOnly || isLoading}
                className={tileClass(isActive, readOnly || isLoading)}
              >
                <div className={`font-semibold text-sm text-center ${isActive ? 'text-primary-700' : 'text-dark'}`}>
                  {n}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Game Format — only shown when Custom is selected */}
      {isCustom && (
        <div>
          <label className="form-label mb-3 block">Game Format</label>
          <div className="grid grid-cols-2 gap-2">
            {GAME_FORMATS.map((f) => {
              const isActive = config.game_format === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleFieldChange('game_format', f.value)}
                  disabled={readOnly}
                  className={tileClass(isActive, readOnly)}
                >
                  <div className={`font-semibold text-sm ${isActive ? 'text-primary-700' : 'text-dark'}`}>
                    {f.label}
                  </div>
                  <div className="text-xs text-dark-300 mt-1">{f.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conditional: Ball value fields */}
      {isBallPoints && (
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Ball Value (pts)</label>
            <input
              type="number"
              className={`form-input ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={config.ball_value ?? ''}
              onChange={(e) => handleFieldChange('ball_value', parseInt(e.target.value) || 0)}
              min="1"
              disabled={readOnly}
            />
          </div>
          <div className="form-group">
            <label className="form-label">8/9-Ball Value (pts)</label>
            <input
              type="number"
              className={`form-input ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={config.object_ball_value ?? ''}
              onChange={(e) => handleFieldChange('object_ball_value', parseInt(e.target.value) || 0)}
              min="1"
              disabled={readOnly}
            />
          </div>
        </div>
      )}

      {/* Conditional: Race to */}
      {isRaceTo && (
        <div className="form-group">
          <label className="form-label">Race To (games) *</label>
          <input
            type="number"
            className={`form-input ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            value={config.race_to ?? ''}
            onChange={(e) => handleFieldChange('race_to', parseInt(e.target.value) || null)}
            min="1"
            disabled={readOnly}
          />
        </div>
      )}

      {/* Standings Format */}
      <div>
        <label className="form-label mb-3 block">Standings Format</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STANDINGS_FORMATS.map((f) => {
            const isActive = config.standings_format === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFieldChange('standings_format', f.value)}
                disabled={readOnly || isLoading}
                className={tileClass(isActive, readOnly || isLoading)}
              >
                <div className={`font-semibold text-sm ${isActive ? 'text-primary-700' : 'text-dark'}`}>
                  {f.label}
                </div>
                <div className="text-xs text-dark-300 mt-1">{f.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional: Match points W/T/L */}
      {isMatchPoints && (
        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Win Points</label>
            <input
              type="number"
              className={`form-input ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={config.match_win_points ?? ''}
              onChange={(e) => handleFieldChange('match_win_points', parseInt(e.target.value) || 0)}
              min="0"
              disabled={readOnly}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tie Points</label>
            <input
              type="number"
              className={`form-input ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={config.match_tie_points ?? ''}
              onChange={(e) => handleFieldChange('match_tie_points', parseInt(e.target.value) || 0)}
              min="0"
              disabled={readOnly}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Loss Points</label>
            <input
              type="number"
              className={`form-input ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={config.match_loss_points ?? ''}
              onChange={(e) => handleFieldChange('match_loss_points', parseInt(e.target.value) || 0)}
              min="0"
              disabled={readOnly}
            />
          </div>
        </div>
      )}

      {/* Allow Ties */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="allow_ties"
          className="h-4 w-4 text-primary-600 rounded border-gray-300"
          checked={config.allow_ties ?? false}
          onChange={(e) => handleFieldChange('allow_ties', e.target.checked)}
          disabled={readOnly}
        />
        <label htmlFor="allow_ties" className="text-sm font-medium text-dark select-none">
          Allow match ties
        </label>
      </div>

      {/* Live preview */}
      {previewLine && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <p className="text-sm text-primary-700">{previewLine}</p>
        </div>
      )}
    </div>
  );
};

export default ScoringConfigSection;
