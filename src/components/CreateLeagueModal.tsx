import React, { useState } from 'react';
import Modal from './Modal';
import { useCreateLeague } from '../hooks/useLeagues';
import { toast } from 'react-toastify';
import { AlertCircle } from 'lucide-react';

interface CreateLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    state: '',
    country: 'USA',
    sets_per_match: 3,
    games_per_set: 5,
    points_per_win: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createLeagueMutation = useCreateLeague();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sets_per_match' || name === 'games_per_set' || name === 'points_per_win'
        ? parseInt(value) || 0
        : value
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await createLeagueMutation.mutateAsync(formData);
      toast.success('League created successfully!');

      // Reset form
      setFormData({
        name: '',
        description: '',
        city: '',
        state: '',
        country: 'USA',
        sets_per_match: 3,
        games_per_set: 5,
        points_per_win: 1,
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        'Something went wrong while creating your league. Please try again in 15 minutes or email contact@leaguegenius.app for assistance.',
        { autoClose: 8000 }
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New League" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* League Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">League Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input ${errors.name ? 'border-red-500' : ''}`}
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Downtown Pool League"
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
            className="form-input"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description of your league"
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
              className={`form-input ${errors.city ? 'border-red-500' : ''}`}
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g., Portland"
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
              className={`form-input ${errors.state ? 'border-red-500' : ''}`}
              value={formData.state}
              onChange={handleChange}
              placeholder="e.g., OR"
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
            className={`form-input ${errors.country ? 'border-red-500' : ''}`}
            value={formData.country}
            onChange={handleChange}
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
                className={`form-input ${errors.sets_per_match ? 'border-red-500' : ''}`}
                value={formData.sets_per_match}
                onChange={handleChange}
                min="1"
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
                className={`form-input ${errors.games_per_set ? 'border-red-500' : ''}`}
                value={formData.games_per_set}
                onChange={handleChange}
                min="1"
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
                className={`form-input ${errors.points_per_win ? 'border-red-500' : ''}`}
                value={formData.points_per_win}
                onChange={handleChange}
                min="1"
              />
              {errors.points_per_win && (
                <p className="text-red-500 text-sm mt-1">{errors.points_per_win}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={createLeagueMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createLeagueMutation.isPending}
          >
            {createLeagueMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Creating League...
              </div>
            ) : (
              'Create League'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateLeagueModal;
