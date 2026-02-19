import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Users, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLeagueSeason } from '../../contexts/LeagueSeasonContext';
import { useCreateTeam } from '../../hooks/useTeams';
import { useSeasonVenues, useAddTeamToSeason } from '../../hooks/useSeasons';
import LeagueSeasonCard from '../../components/LeagueSeasonCard';
import LeagueSeasonSelectorModal from '../../components/LeagueSeasonSelectorModal';
import type { Season } from '../../api';

const AdminTeamRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  // Context for league/season selection
  const {
    leagues,
    seasons,
    currentLeague,
    currentSeason,
    currentLeagueId,
    currentSeasonId,
    setLeagueAndSeason,
    isLoading: contextLoading,
  } = useLeagueSeason();

  // Modal state
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  // Fetch venues for the current season
  const { data: venues = [], isLoading: venuesLoading } = useSeasonVenues(
    currentSeasonId || 0
  );

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    venueId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutations
  const createTeamMutation = useCreateTeam();
  const addTeamToSeasonMutation = useAddTeamToSeason();

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }
    if (!formData.venueId) {
      newErrors.venueId = 'Please select a home venue';
    }
    if (!currentLeagueId || !currentSeasonId) {
      newErrors.general = 'Please select a league and season first';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Get the venue name from the selected venue
    const selectedVenue = venues.find(
      (v) => v.id === parseInt(formData.venueId)
    );
    if (!selectedVenue) {
      setErrors((prev) => ({ ...prev, venueId: 'Please select a valid venue' }));
      return;
    }

    try {
      // Step 1: Create the team
      const newTeam = await createTeamMutation.mutateAsync({
        name: formData.name.trim(),
        establishment: selectedVenue.name,
      });

      // Step 2: Add team to the season
      await addTeamToSeasonMutation.mutateAsync({
        seasonId: currentSeasonId!,
        teamId: newTeam.id,
        venueId: selectedVenue.id,
      });

      toast.success('Team created and added to season!');

      // Reset form
      setFormData({ name: '', venueId: '' });

      // Navigate back to where user came from
      navigate(-1);
    } catch (error) {
      toast.error(
        'Something went wrong while creating your team. Please try again.'
      );
    }
  };

  // Map MeSeason to Season type for the modal
  const mappedSeasons: Season[] = seasons.map((s) => ({
    id: s.id,
    league: s.league_id,
    name: s.name,
    start_date: s.start_date,
    end_date: s.end_date,
    is_active: s.is_active,
    is_archived: false,
    invite_code: '',
    created_at: s.start_date,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-dark">
          Register New Team
        </h1>
        <p className="text-sm text-dark-300 mt-1">
          Create a new team for the selected season
        </p>
      </div>

      {/* League/Season Selection Card */}
      <LeagueSeasonCard
        currentLeague={currentLeague}
        currentSeason={currentSeason}
        onEditClick={() => setShowSelectorModal(true)}
        isLoading={contextLoading}
      />

      {/* General Error (no selection) */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
          <span className="text-red-700">{errors.general}</span>
        </div>
      )}

      {/* Registration Form */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-secondary-100 p-2 rounded-lg">
            <Users className="h-5 w-5 text-secondary" />
          </div>
          <h2 className="text-lg font-semibold text-dark">Team Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Team Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Cue Masters"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Home Venue Selection */}
          <div className="form-group">
            <label className="form-label">Home Venue *</label>
            {venuesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {venues.map((venue) => (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        venueId: venue.id.toString(),
                      }));
                      if (errors.venueId) {
                        setErrors((prev) => ({ ...prev, venueId: '' }));
                      }
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.venueId === venue.id.toString()
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-dark text-sm truncate">
                      {venue.name}
                    </p>
                    {venue.address && (
                      <p className="text-xs text-dark-300 truncate mt-1">
                        {venue.address}
                      </p>
                    )}
                  </button>
                ))}
                {/* Create Venue Tile */}
                <Link
                  to="/admin/venues/register"
                  className="p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary-50 transition-all flex flex-col items-center justify-center text-center"
                >
                  <Plus className="h-5 w-5 text-dark-300 mb-1" />
                  <p className="text-sm font-medium text-dark-300">
                    Create Venue
                  </p>
                </Link>
              </div>
            )}
            {errors.venueId && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.venueId}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              disabled={createTeamMutation.isPending || addTeamToSeasonMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                createTeamMutation.isPending ||
                addTeamToSeasonMutation.isPending ||
                !currentLeagueId ||
                !currentSeasonId
              }
            >
              {createTeamMutation.isPending || addTeamToSeasonMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  {createTeamMutation.isPending ? 'Creating Team...' : 'Adding to Season...'}
                </div>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* League/Season Selector Modal */}
      <LeagueSeasonSelectorModal
        isOpen={showSelectorModal}
        onClose={() => setShowSelectorModal(false)}
        leagues={leagues}
        allSeasons={mappedSeasons}
        currentLeagueId={currentLeagueId}
        currentSeasonId={currentSeasonId}
        onSelect={(leagueId, seasonId) => {
          setLeagueAndSeason(leagueId, seasonId);
          setShowSelectorModal(false);
        }}
      />
    </div>
  );
};

export default AdminTeamRegistrationPage;
