export interface UserData {
  department: string;
  semester: string;
  currentCGPA: string;
  careerGoal: string;
  studyConsistency: number; // 0-100
  classAttendance: number;
  campusLife: number; // 0 (Ghost) to 100 (Politics/Tong Legend)
  skillBuilding: number;
  dailyScreenTime: number;
  sleepSchedule: number;
}

export interface ProjectionResult {
  career: {
    title: string;
    description: string;
    incomeRange: string;
    satisfaction: string;
  };
  skills: {
    depth: string;
    confidence: string;
  };
  dailyLife: {
    living: string;
    routine: string;
    relationshipWithTime: string;
  };
  internalState: {
    stress: string;
    regret: string;
    momentum: string;
  };
}

export enum AppState {
  LANDING,
  INPUT,
  PROCESSING,
  RESULTS,
}

export interface QuestionConfig {
  id: keyof UserData;
  label: string;
  subLabel?: string;
  type: 'select' | 'slider';
  options?: string[]; // For select
  marks?: { label: string; value: number }[]; // For slider
}