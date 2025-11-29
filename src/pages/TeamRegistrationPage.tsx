import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Check, Info, X } from 'lucide-react';

interface PlayerInfo {
  name: string;
  phone: string;
  email?: string;
}

interface TeamFormData {
  establishmentName: string;
  numberOfTables: number;
  sponsorName: string;
  teamName: string;
  captain: PlayerInfo;
  players: PlayerInfo[];
  playerRep: PlayerInfo;
}

const TeamRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TeamFormData>({
    establishmentName: '',
    numberOfTables: 1,
    sponsorName: '',
    teamName: '',
    captain: { name: '', phone: '', email: '' },
    players: Array(7).fill({ name: '', phone: '' }),
    playerRep: { name: '', phone: '' }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateCaptain = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      captain: {
        ...prev.captain,
        [field]: value
      }
    }));
  };

  const updatePlayerRep = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      playerRep: {
        ...prev.playerRep,
        [field]: value
      }
    }));
  };

  const updatePlayer = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedPlayers = [...prev.players];
      updatedPlayers[index] = {
        ...updatedPlayers[index],
        [field]: value
      };
      return {
        ...prev,
        players: updatedPlayers
      };
    });
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.establishmentName) newErrors.establishmentName = 'Establishment name is required';
      if (!formData.sponsorName) newErrors.sponsorName = 'Sponsor name is required';
      if (!formData.teamName) newErrors.teamName = 'Team name is required';
    } else if (step === 2) {
      if (!formData.captain.name) newErrors['captain.name'] = 'Captain name is required';
      if (!formData.captain.phone) newErrors['captain.phone'] = 'Captain phone is required';
      if (formData.captain.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.captain.email)) {
        newErrors['captain.email'] = 'Invalid email format';
      }
      
      // Only validate player rep if fields are filled
      if (formData.playerRep.name && !formData.playerRep.phone) {
        newErrors['playerRep.phone'] = 'Phone is required if name is provided';
      }
      if (!formData.playerRep.name && formData.playerRep.phone) {
        newErrors['playerRep.name'] = 'Name is required if phone is provided';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    const isValid = validateStep(currentStep);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateStep(currentStep);
    
    if (isValid) {
      // In a real app, this would be an API call
      console.log('Submitting team registration:', formData);
      
      // Simulate API call
      setTimeout(() => {
        toast.success('Team registration submitted successfully!');
        navigate('/');
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Team Registration</h1>
        <p className="text-gray-600">
          Register your team for League Genius by completing the form below.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span className="mt-2 text-sm">Team Info</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span className="mt-2 text-sm">Team Captain</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
            <span className="mt-2 text-sm">Players</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Establishment Info */}
          {currentStep === 1 && (
            <div className="space-y-6 slide-in">
              <h2 className="text-xl font-semibold mb-4">Establishment Information</h2>
              
              <div className="form-group">
                <label htmlFor="establishmentName" className="form-label">Establishment Name *</label>
                <input
                  type="text"
                  id="establishmentName"
                  className={`form-input ${errors.establishmentName ? 'border-red-500' : ''}`}
                  value={formData.establishmentName}
                  onChange={(e) => updateFormData('establishmentName', e.target.value)}
                />
                {errors.establishmentName && (
                  <p className="form-error">{errors.establishmentName}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="numberOfTables" className="form-label">Number of Pool Tables *</label>
                <select
                  id="numberOfTables"
                  className="form-input"
                  value={formData.numberOfTables}
                  onChange={(e) => updateFormData('numberOfTables', parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="sponsorName" className="form-label">Sponsor/Owner/Agent Name *</label>
                <input
                  type="text"
                  id="sponsorName"
                  className={`form-input ${errors.sponsorName ? 'border-red-500' : ''}`}
                  value={formData.sponsorName}
                  onChange={(e) => updateFormData('sponsorName', e.target.value)}
                />
                {errors.sponsorName && (
                  <p className="form-error">{errors.sponsorName}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="teamName" className="form-label">Team Name *</label>
                <input
                  type="text"
                  id="teamName"
                  className={`form-input ${errors.teamName ? 'border-red-500' : ''}`}
                  value={formData.teamName}
                  onChange={(e) => updateFormData('teamName', e.target.value)}
                />
                {errors.teamName && (
                  <p className="form-error">{errors.teamName}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Team Captain */}
          {currentStep === 2 && (
            <div className="space-y-6 slide-in">
              <h2 className="text-xl font-semibold mb-4">Team Captain Information</h2>
              
              <div className="form-group">
                <label htmlFor="captainName" className="form-label">Captain Name *</label>
                <input
                  type="text"
                  id="captainName"
                  className={`form-input ${errors['captain.name'] ? 'border-red-500' : ''}`}
                  value={formData.captain.name}
                  onChange={(e) => updateCaptain('name', e.target.value)}
                />
                {errors['captain.name'] && (
                  <p className="form-error">{errors['captain.name']}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="captainPhone" className="form-label">Captain Phone *</label>
                <input
                  type="tel"
                  id="captainPhone"
                  className={`form-input ${errors['captain.phone'] ? 'border-red-500' : ''}`}
                  value={formData.captain.phone}
                  onChange={(e) => updateCaptain('phone', e.target.value)}
                  placeholder="(123) 456-7890"
                />
                {errors['captain.phone'] && (
                  <p className="form-error">{errors['captain.phone']}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="captainEmail" className="form-label">Captain Email</label>
                <input
                  type="email"
                  id="captainEmail"
                  className={`form-input ${errors['captain.email'] ? 'border-red-500' : ''}`}
                  value={formData.captain.email}
                  onChange={(e) => updateCaptain('email', e.target.value)}
                />
                {errors['captain.email'] && (
                  <p className="form-error">{errors['captain.email']}</p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-3">Player Representative (Optional)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  The player representative assists the captain with team management.
                </p>
                
                <div className="form-group">
                  <label htmlFor="playerRepName" className="form-label">Player Rep Name</label>
                  <input
                    type="text"
                    id="playerRepName"
                    className={`form-input ${errors['playerRep.name'] ? 'border-red-500' : ''}`}
                    value={formData.playerRep.name}
                    onChange={(e) => updatePlayerRep('name', e.target.value)}
                  />
                  {errors['playerRep.name'] && (
                    <p className="form-error">{errors['playerRep.name']}</p>
                  )}
                </div>
                
                <div className="form-group mb-0">
                  <label htmlFor="playerRepPhone" className="form-label">Player Rep Phone</label>
                  <input
                    type="tel"
                    id="playerRepPhone"
                    className={`form-input ${errors['playerRep.phone'] ? 'border-red-500' : ''}`}
                    value={formData.playerRep.phone}
                    onChange={(e) => updatePlayerRep('phone', e.target.value)}
                    placeholder="(123) 456-7890"
                  />
                  {errors['playerRep.phone'] && (
                    <p className="form-error">{errors['playerRep.phone']}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Players */}
          {currentStep === 3 && (
            <div className="space-y-6 slide-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Team Players</h2>
                <div className="flex items-center text-sm text-gray-600">
                  <Info className="h-4 w-4 mr-1" />
                  <span>Players #2-4 required, #5-8 optional</span>
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
                <div className="flex items-start">
                  <div className="mt-1 mr-3 flex-shrink-0">
                    <Check className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Team Captain (Already Added)</h3>
                    <p className="text-sm text-gray-600">{formData.captain.name} • {formData.captain.phone}</p>
                  </div>
                </div>
              </div>
              
              {/* Players 2-8 */}
              <div className="space-y-6">
                {formData.players.map((player, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <h3 className="font-medium mb-3">
                      Player #{index + 2} {index < 3 ? '(Required)' : '(Optional)'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group mb-0">
                        <label htmlFor={`player${index}Name`} className="form-label">Name</label>
                        <input
                          type="text"
                          id={`player${index}Name`}
                          className="form-input"
                          value={player.name}
                          onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="form-group mb-0">
                        <label htmlFor={`player${index}Phone`} className="form-label">Phone</label>
                        <input
                          type="tel"
                          id={`player${index}Phone`}
                          className="form-input"
                          value={player.phone}
                          onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                          placeholder="(123) 456-7890"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn btn-outline"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
              >
                Submit Registration
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Information section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium mb-2">Registration Information</h3>
            <p className="text-sm text-gray-600 mb-3">
              Team registration is subject to approval by league administrators. Once submitted, 
              you will receive a confirmation email with further instructions for payment and orientation.
            </p>
            <p className="text-sm text-gray-600">
              For questions or assistance with registration, please contact us at 
              <a href="mailto:info@leaguegenius.com" className="text-primary ml-1">info@leaguegenius.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRegistrationPage;