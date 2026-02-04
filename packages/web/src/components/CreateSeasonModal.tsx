import React, { useState } from 'react';
import Modal from './Modal';
import { useCreateSeason } from '../hooks/useSeasons';
import { toast } from 'react-toastify';
import { AlertCircle } from 'lucide-react';

interface CreateSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: number;
  onSuccess?: () => void;
}

const CreateSeasonModal: React.FC<CreateSeasonModalProps> = ({
  isOpen,
  onClose,
  leagueId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    invite_code: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createSeasonMutation = useCreateSeason();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generateInviteCode = () => {
    // Generate a random 6-character invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, invite_code: code }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Season name is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const seasonData: any = {
        league: leagueId,
        name: formData.name,
        start_date: formData.start_date,
      };

      // Only include optional fields if they have values
      if (formData.end_date) seasonData.end_date = formData.end_date;
      if (formData.invite_code) seasonData.invite_code = formData.invite_code;

      await createSeasonMutation.mutateAsync(seasonData);
      toast.success('Season created successfully!');

      // Reset form
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        invite_code: '',
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        'Something went wrong while creating your season. Please try again in 15 minutes or email contact@leaguegenius.app for assistance.',
        { autoClose: 8000 }
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Season" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Season Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">Season Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input ${errors.name ? 'border-red-500' : ''}`}
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Fall 2024, Spring League"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="start_date" className="form-label">Start Date *</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              className={`form-input ${errors.start_date ? 'border-red-500' : ''}`}
              value={formData.start_date}
              onChange={handleChange}
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.start_date}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="end_date" className="form-label">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              className={`form-input ${errors.end_date ? 'border-red-500' : ''}`}
              value={formData.end_date}
              onChange={handleChange}
            />
            {errors.end_date && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.end_date}
              </p>
            )}
          </div>
        </div>

        {/* Invite Code */}
        <div className="form-group">
          <label htmlFor="invite_code" className="form-label">
            Invite Code
            <span className="text-sm text-dark-300 font-normal ml-2">
              (Teams will use this to join the season)
            </span>
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="invite_code"
              name="invite_code"
              className="form-input"
              value={formData.invite_code}
              onChange={handleChange}
              placeholder="Leave blank to auto-generate"
            />
            <button
              type="button"
              onClick={generateInviteCode}
              className="btn btn-outline whitespace-nowrap"
            >
              Generate
            </button>
          </div>
          <p className="text-sm text-dark-300 mt-1">
            If left blank, a code will be automatically generated
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={createSeasonMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createSeasonMutation.isPending}
          >
            {createSeasonMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Creating Season...
              </div>
            ) : (
              'Create Season'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSeasonModal;
