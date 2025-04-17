// DTO and Command Model definitions for NPC Profile API

// Define a union type for the complexity levels as specified in the API plan
export type ComplexityLevel = "uproszczony" | "zwykły" | "szczegółowy";
export type OperationType = "INSERT" | "UPDATE" | "DELETE" | "GENERATE" | "OPEN";

// 1. NpcProfileDTO: Represents a full NPC profile as stored in the database
export interface NpcProfileDTO {
  id: string;
  name: string;
  appearance: string;
  profession: string;
  relationship_to_party: string;
  scene_description: string;
  special_traits: string;
  complexity_level: ComplexityLevel;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// 2. CreateNpcProfileCommand: Data required to create a new NPC profile
// We pick only the fields that the API requires in the request body
export type CreateNpcProfileCommand = Pick<
  NpcProfileDTO,
  | "name"
  | "appearance"
  | "profession"
  | "relationship_to_party"
  | "scene_description"
  | "special_traits"
  | "complexity_level"
  | "is_public"
>;

// 3. UpdateNpcProfileCommand: For update requests, fields are optional
export type UpdateNpcProfileCommand = Partial<CreateNpcProfileCommand>;

// 4. GenerateNpcProfileCommand: Data required to generate a profile using an AI service
export interface GenerateNpcProfileCommand {
  initial_prompt: string;
  complexity_level: ComplexityLevel;
  existing_profile_ids?: string[]; // Optional list of existing profile IDs
}

// 5. NpcProfileLogDTO: Represents a log entry for an NPC profile operation
export interface NpcProfileLogDTO {
  id: string;
  npc_profile_id: string | null;
  operation: OperationType;
  operation_timestamp: string;
  duration: number | null; // Duration in appropriate numeric format
  user_id: string;
  user_role: string;
}

// 6. NpcProfileMetricsDTO: Aggregated metrics for an NPC profile
export interface NpcProfileMetricsDTO {
  npc_profile_id: string | null;
  owner_edit_count: number | null;
  other_edit_count: number | null;
  owner_open_count: number | null;
  other_open_count: number | null;
}

// 7. AverageGenerateDurationDTO: Represents the average generation duration grouped by complexity level
export interface AverageGenerateDurationDTO {
  complexity_level: ComplexityLevel;
  average_generate_duration: number | null;
} 