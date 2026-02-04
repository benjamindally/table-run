import React, { useState } from 'react';
import Modal from './Modal';
import { announcementsApi, type CreateAnnouncementData } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { AlertCircle, Megaphone } from 'lucide-react';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  leagueId: number;
  leagueName: string;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leagueId,
  leagueName,
}) => {
  const { accessToken } = useAuth();
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    league: leagueId,
    title: '',
    message: '',
    priority: 'normal',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await announcementsApi.create(formData, accessToken || undefined);
      toast.success('Announcement sent successfully!');

      // Reset form
      setFormData({
        league: leagueId,
        title: '',
        message: '',
        priority: 'normal',
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to send announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Announcement" maxWidth="lg">
      <div className="mb-4 p-3 bg-primary-50 rounded-lg flex items-start">
        <Megaphone className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-dark">
            This announcement will be sent to all users in <strong>{leagueName}</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className={`form-input ${errors.title ? 'border-red-500' : ''}`}
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Match Schedule Update"
            maxLength={200}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="form-group">
          <label htmlFor="priority" className="form-label">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            className="form-input"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <p className="text-xs text-dark-300 mt-1">
            Higher priority announcements will be displayed more prominently
          </p>
        </div>

        {/* Message */}
        <div className="form-group">
          <label htmlFor="message" className="form-label">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            className={`form-input ${errors.message ? 'border-red-500' : ''}`}
            rows={6}
            value={formData.message}
            onChange={handleChange}
            placeholder="Enter your announcement message here..."
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              <>
                <Megaphone className="h-4 w-4 mr-2" />
                Send Announcement
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAnnouncementModal;
