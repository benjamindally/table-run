import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLeagueSeason } from '../../contexts/LeagueSeasonContext';
import { useCreateVenue } from '../../hooks/useSeasons';
import LeagueSeasonCard from '../../components/LeagueSeasonCard';
import LeagueSeasonSelectorModal from '../../components/LeagueSeasonSelectorModal';
import type { Season } from '../../api';

const AdminVenueRegistrationPage: React.FC = () => {
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    table_count: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutation
  const createVenueMutation = useCreateVenue();

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'table_count' ? parseInt(value) || 1 : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Venue name is required';
    }
    if (formData.table_count < 1) {
      newErrors.table_count = 'At least 1 table is required';
    }
    if (!currentLeagueId) {
      newErrors.general = 'Please select a league first';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await createVenueMutation.mutateAsync({
        league: currentLeagueId!,
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zip_code: formData.zip_code.trim() || undefined,
        table_count: formData.table_count,
      });

      toast.success('Venue created successfully!');

      // Reset form
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        table_count: 1,
      });

      // Navigate back to where user came from
      navigate(-1);
    } catch (error) {
      toast.error(
        'Something went wrong while creating your venue. Please try again.'
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
          Register New Venue
        </h1>
        <p className="text-sm text-dark-300 mt-1">
          Add a new venue to the selected league
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
            <MapPin className="h-5 w-5 text-secondary" />
          </div>
          <h2 className="text-lg font-semibold text-dark">Venue Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Venue Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Venue Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Corner Pocket Bar & Grill"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="form-group">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g., 123 Main Street"
            />
          </div>

          {/* City, State & Zip (responsive grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="form-group col-span-2 sm:col-span-1">
              <label htmlFor="city" className="form-label">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Portland"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                className="form-input"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g., OR"
              />
            </div>

            <div className="form-group">
              <label htmlFor="zip_code" className="form-label">
                Zip Code
              </label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                className="form-input"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="e.g., 97201"
              />
            </div>
          </div>

          {/* Number of Tables */}
          <div className="form-group">
            <label htmlFor="table_count" className="form-label">
              Number of Pool Tables *
            </label>
            <select
              id="table_count"
              name="table_count"
              className={`form-input ${errors.table_count ? 'border-red-500' : ''}`}
              value={formData.table_count}
              onChange={handleChange}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'table' : 'tables'}
                </option>
              ))}
            </select>
            {errors.table_count && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.table_count}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              disabled={createVenueMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createVenueMutation.isPending || !currentLeagueId}
            >
              {createVenueMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating Venue...
                </div>
              ) : (
                'Create Venue'
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

export default AdminVenueRegistrationPage;
