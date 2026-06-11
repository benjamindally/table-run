import React from "react";
import { AlertTriangle, X } from "lucide-react";
import type { ScheduleAnomaly } from "./scheduleAnalysis";

interface ScheduleSaveReviewModalProps {
  isOpen: boolean;
  anomalies: ScheduleAnomaly[];
  isSaving?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Pre-save "heads up" dialog. Lists the non-standard things detected in the
 * schedule and lets the operator save anyway. This is friction, never a gate —
 * the operator always has the final say.
 */
const ScheduleSaveReviewModal: React.FC<ScheduleSaveReviewModalProps> = ({
  isOpen,
  anomalies,
  isSaving = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg transform rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </span>
              <h2 className="text-xl font-bold text-dark">Review before saving</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-dark-300 transition-colors hover:text-dark"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="mb-4 text-sm text-dark-400">
              This schedule has a few things worth a look. None of these stop you
              from saving — just confirming it's what you intended.
            </p>
            <ul className="space-y-2">
              {anomalies.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t bg-cream-50 p-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="btn btn-outline disabled:opacity-50"
            >
              Keep Editing
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSaving}
              className="btn btn-primary disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Anyway"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSaveReviewModal;
