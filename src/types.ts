export interface RestorationState {
  originalUrl: string;
  processedUrl: string | null;
  intensity: number;
  colorCorrection: number;
  status: "idle" | "analyzing" | "restoring" | "completed";
  analysis: string | null;
}

export type ProcessingStage = "levels" | "fungal-mapping" | "reconstruction" | "archival-final";

export interface StageProgress {
  id: ProcessingStage;
  label: string;
  progress: number;
  status: "pending" | "active" | "completed" | "error";
}
