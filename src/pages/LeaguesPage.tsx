import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { toast } from 'react-toastify';

interface League {
  id: number;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
  created_at: string;
}

export default function LeaguesPage() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeagues = async () => {
      try {
        const response = await api.get<{ results: League[] }>('/leagues/');
        const activeLeagues = response.results.filter(l => l.is_active);
        setLeagues(activeLeagues);
      } catch (error) {
        console.error('Failed to load leagues:', error);
        toast.error('Failed to load leagues');
      } finally {
        setLoading(false);
      }
    };

    loadLeagues();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary text-5xl">counter_8</span>
          <h1 className="text-3xl font-bold text-gray-900">Pool Leagues</h1>
        </div>
        <p className="text-gray-600">Select a league to view standings and statistics</p>
      </div>

      {/* Leagues Grid */}
      {leagues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">counter_8</span>
          <p className="text-gray-600">No active leagues found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <div
              key={league.id}
              onClick={() => navigate(`/leagues/${league.id}/standings`)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {league.name}
                  </h2>
                  {league.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {league.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400 flex-shrink-0 ml-2" />
              </div>

              <div className="space-y-2">
                {(league.city || league.state) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[league.city, league.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Active League</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full text-center text-sm font-medium text-primary hover:text-primary-600">
                  View Standings →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
