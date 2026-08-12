// أنواع الردود / Submission types

export interface LocationAnswer {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  field_id: string;
  value_json: unknown;
  location_lat?: number | null;
  location_lng?: number | null;
  location_accuracy?: number | null;
}

export interface Submission {
  id: string;
  form_version_id: string;
  form_id: string;
  submitted_at: string;
  answers: SubmissionAnswer[];
}

export interface FileUpload {
  id: string;
  submission_answer_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}
