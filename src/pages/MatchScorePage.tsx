import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Info,
  Calendar,
  Users,
  TrendingUp,
  Save,
  School as PoolBall,
  X,
} from "lucide-react";

interface MatchPlayer {
  name: string;
  present: boolean;
}

interface MatchResult {
  playerIndex: number;
  result: "WIN" | "LOSS" | null;
  eightBall: boolean;
  tableRun: boolean;
}

interface MatchFormData {
  date: string;
  location: string;
  homeTeam: string;
  visitingTeam: string;
  homePlayers: MatchPlayer[];
  visitingPlayers: MatchPlayer[];
  homeResults: MatchResult[];
  visitingResults: MatchResult[];
  newMembers: {
    name: string;
    team: "home" | "visiting";
    fee: boolean;
  }[];
}

const MatchScorePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MatchFormData>({
    date: new Date().toISOString().split("T")[0],
    location: "",
    homeTeam: "",
    visitingTeam: "",
    homePlayers: Array(8).fill({ name: "", present: false }),
    visitingPlayers: Array(8).fill({ name: "", present: false }),
    homeResults: Array(16).fill({
      playerIndex: -1,
      result: null,
      eightBall: false,
      tableRun: false,
    }),
    visitingResults: Array(16).fill({
      playerIndex: -1,
      result: null,
      eightBall: false,
      tableRun: false,
    }),
    newMembers: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentTeam, setCurrentTeam] = useState<"home" | "visiting" | null>(
    null
  );
  const [newMemberName, setNewMemberName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For demo - teams and venues
  const availableTeams = [
    "Cue Masters",
    "Chalk & Awe",
    "Break Point",
    "Straight Shooters",
    "8-Ball Wizards",
    "Corner Pocket",
    "Ball Busters",
    "Rack 'em Up",
  ];

  const availableVenues = [
    `Corner Pocket Bar & Grill`,
    `The Billiards Club`,
    `Shark's Pool Hall`,
    `Sully's Pub`,
    `Rack & Roll`,
    `The 8-Ball Lounge`,
    `Shooter's Place`,
  ];

  return <div>{/* Component implementation */}</div>;
};

export default MatchScorePage;
