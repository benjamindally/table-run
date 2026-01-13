import React from "react";
import { PlayerClaimRequest } from "../../api";
import { Users, CheckCircle, XCircle } from "lucide-react";

interface PendingClaimReviewsProps {
  pendingReviews: PlayerClaimRequest[];
  onApprove: (requestId: number) => void;
  onDeny: (requestId: number) => void;
}

const PendingClaimReviews: React.FC<PendingClaimReviewsProps> = ({
  pendingReviews,
  onApprove,
  onDeny,
}) => {
  if (pendingReviews.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-orange-500" />
        Pending Claim Requests ({pendingReviews.length})
      </h2>
      <div className="space-y-4">
        {pendingReviews.map((request) => (
          <div
            key={request.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">
                  {request.requesting_user_detail.username} wants to claim:{" "}
                  <span className="text-orange-600">
                    {request.player_detail.full_name}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Email: {request.requesting_user_detail.email}
                </p>
                {request.message && (
                  <p className="text-sm text-gray-700 mt-2 italic">
                    "{request.message}"
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Requested{" "}
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(request.id)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => onDeny(request.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingClaimReviews;
