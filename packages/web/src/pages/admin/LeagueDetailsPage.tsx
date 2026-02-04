import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { useLeague, useUpdateLeague, useDeleteLeague, useMyLeagues } from '../../hooks/useLeagues';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';

const LeagueDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const leagueId = parseInt(id || '0');

  const { data: league, isLoading, error } = useLeague(leagueId);
  const { data: myLeaguesData } = useMyLeagues();
  const updateLeagueMutation = useUpdateLeague();
  const deleteLeagueMutation = useDeleteLeague();

  // Check if user is a league operator for this specific league
  const isOperator = myLeaguesData?.results?.some(l => l.id === leagueId) ?? false;

  const [formData, setFormData] = useState({
    name: league?.name || '',
    description: league?.description || '',
    city: league?.city || '',
    state: league?.state || '',
    country: league?.country || '',
    sets_per_match: league?.sets_per_match || 3,
    games_per_set: league?.games_per_set || 5,
    points_per_win: league?.points_per_win || 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when league data loads
  React.useEffect(() => {
    if (league) {
      setFormData({
        name: league.name,
        description: league.description || '',
        city: league.city,
        state: league.state,
        country: league.country,
        sets_per_match: league.sets_per_match,
        games_per_set: league.games_per_set,
        points_per_win: league.points_per_win,
      });
    }
  }, [league]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sets_per_match' || name === 'games_per_set' || name === 'points_per_win'
        ? parseInt(value) || 0
        : value
    }));
    setHasChanges(true);
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'League name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (formData.sets_per_match < 1) newErrors.sets_per_match = 'Must be at least 1';
    if (formData.games_per_set < 1) newErrors.games_per_set = 'Must be at least 1';
    if (formData.points_per_win < 1) newErrors.points_per_win = 'Must be at least 1';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await updateLeagueMutation.mutateAsync({
        id: leagueId,
        data: formData,
      });
      toast.success('League updated successfully!');
      setHasChanges(false);
    } catch (error) {
      toast.error(
        'Something went wrong while updating your league. Please try again in 15 minutes or email contact@leaguegenius.app for assistance.',
        { autoClose: 8000 }
      );
    }
  };

  const handleArchive = async () => {
    try {
      await updateLeagueMutation.mutateAsync({
        id: leagueId,
        data: { is_active: false },
      });
      toast.success('League archived successfully!');
      navigate('/admin/leagues');
    } catch (error) {
      toast.error(
        'Something went wrong while archiving your league. Please try again in 15 minutes or email contact@leaguegenius.app for assistance.',
        { autoClose: 8000 }
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLeagueMutation.mutateAsync(leagueId);
      toast.success('League deleted successfully!');
      navigate('/admin/leagues');
    } catch (error) {
      toast.error(
        'Something went wrong while deleting your league. Please try again in 15 minutes or email contact@leaguegenius.app for assistance.',
        { autoClose: 8000 }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading league details...</div>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load league details. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/leagues')}
            className="btn btn-outline btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Leagues
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-dark">League Details</h1>
            <p className="text-sm text-dark-300 mt-1">
              {isOperator ? 'Edit league information' : 'View league information'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form className="space-y-6">
          {/* League Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">League Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'border-red-500' : ''} ${!isOperator ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Downtown Pool League"
              disabled={!isOperator}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className={`form-input ${!isOperator ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description of your league"
              disabled={!isOperator}
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="city" className="form-label">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                className={`form-input ${errors.city ? 'border-red-500' : ''} ${!isOperator ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Portland"
                disabled={!isOperator}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.city}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">State *</label>
              <input
                type="text"
                id="state"
                name="state"
                className={`form-input ${errors.state ? 'border-red-500' : ''} ${!isOperator ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g., OR"
                disabled={!isOperator}
              />
              {errors.state && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.state}
                </p>
              )}
            </div>
          </div>

          {/* Country */}
          <div className="form-group">
            <label htmlFor="country" className="form-label">Country *</label>
            <select
              id="country"
              name="country"
              className={`form-input ${errors.country ? 'border-red-500' : ''} ${!isOperator ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={formData.country}
              onChange={handleChange}
              disabled={!isOperator}
            >
              <option value="USA">United States</option>
              <option value="Canada">Canada</option>
              <option value="Mexico">Mexico</option>
              <option value="UK">United Kingdom</option>
              <option value="Other">Other</option>
            </select>
            {errors.country && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.country}
              </p>
            )}
          </div>

          {/* Match Settings */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-dark mb-4">Match Settings</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="sets_per_match" className="form-label">Sets per Match *</label>
                <input
                  type="number"
                  id="sets_per_match"
                  name="sets_per_match"
                  className={`form-input ${errors.sets_per_match ? 'border-red-500' : ''} ${!isOperator ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={formData.sets_per_match}
                  onChange={handleChange}
                  min="1"
                  disabled={!isOperator}
                />
                {errors.sets_per_match && (
                  <p className="text-red-500 text-sm mt-1">{errors.sets_per_match}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="games_per_set" className="form-label">Games per Set *</label>
                <input
                  type="number"
                  id="games_per_set"
                  name="games_per_set"
                  className={`form-input ${errors.games_per_set ? 'border-red-500' : ''} ${!isOperator ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={formData.games_per_set}
                  onChange={handleChange}
                  min="1"
                  disabled={!isOperator}
                />
                {errors.games_per_set && (
                  <p className="text-red-500 text-sm mt-1">{errors.games_per_set}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="points_per_win" className="form-label">Points per Win *</label>
                <input
                  type="number"
                  id="points_per_win"
                  name="points_per_win"
                  className={`form-input ${errors.points_per_win ? 'border-red-500' : ''} ${!isOperator ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={formData.points_per_win}
                  onChange={handleChange}
                  min="1"
                  disabled={!isOperator}
                />
                {errors.points_per_win && (
                  <p className="text-red-500 text-sm mt-1">{errors.points_per_win}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions - Only visible to league operators */}
          {isOperator ? (
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete league"
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleArchive}
                  className="btn btn-outline"
                  disabled={updateLeagueMutation.isPending || deleteLeagueMutation.isPending}
                >
                  {updateLeagueMutation.isPending ? 'Archiving...' : 'Archive'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={!hasChanges || updateLeagueMutation.isPending || deleteLeagueMutation.isPending}
                >
                  {updateLeagueMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                You are viewing this league in read-only mode. Only league operators can edit league details.
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete League"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-dark">
            Are you sure you want to delete this league? This action is <strong>irreversible</strong> and will permanently delete all associated data including seasons, matches, and statistics.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This cannot be undone!
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-outline"
              disabled={deleteLeagueMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteLeagueMutation.isPending}
            >
              {deleteLeagueMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                'Yes, Delete League'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeagueDetailsPage;
