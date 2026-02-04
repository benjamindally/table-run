import React, { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, LayoutGrid, Plus } from "lucide-react";
import type { Venue } from "../../api/types";

interface SeasonVenuesProps {
  venues?: Venue[];
  editable?: boolean;
  onAddVenue?: () => void;
  onEditVenue?: (venue: Venue) => void;
  initialLimit?: number;
}

const SeasonVenues: React.FC<SeasonVenuesProps> = ({
  venues,
  editable = false,
  onAddVenue,
  onEditVenue,
  initialLimit = 5,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Filter to only show active venues
  const activeVenues = venues?.filter((v) => v.is_active !== false) || [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-dark">Venues</h2>
          {activeVenues.length > 0 && (
            <span className="text-xs sm:text-sm text-dark-300">({activeVenues.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editable && onAddVenue && (
            <button
              onClick={onAddVenue}
              className="btn btn-primary btn-sm flex items-center"
            >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Add Venue</span>
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-dark-300 hover:text-dark transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {activeVenues.length > 0 ? (
            <>
              <div className="space-y-2">
                {(expanded ? activeVenues : activeVenues.slice(0, initialLimit)).map(
                  (venue) => (
                    <div
                      key={venue.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border border-cream-400 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-cream-100 rounded-lg flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-dark text-sm sm:text-base">
                            {venue.name}
                          </h3>
                          {venue.address && (
                            <p className="text-xs sm:text-sm text-dark-300">
                              {venue.address}
                              {venue.city && `, ${venue.city}`}
                              {venue.state && `, ${venue.state}`}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1 text-xs sm:text-sm text-dark-400">
                            <LayoutGrid className="h-4 w-4" />
                            <span>
                              {venue.table_count} {venue.table_count === 1 ? "table" : "tables"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {editable && onEditVenue && (
                        <button
                          onClick={() => onEditVenue(venue)}
                          className="btn btn-outline btn-sm w-full sm:w-auto"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>

              {!expanded && activeVenues.length > initialLimit && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View More ({activeVenues.length - initialLimit} more)
                  </button>
                </div>
              )}

              {expanded && activeVenues.length > initialLimit && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setExpanded(false)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Show Less
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-dark-300">
              No venues yet. Add venues to enable match scheduling.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeasonVenues;
