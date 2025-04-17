# REST API Plan

## 1. Resources

- **NPC Profiles**: Maps to the `npc_profiles` table. Represents the main NPC entity including details such as name, appearance, profession, relationship to party, scene description, and special traits.
- **NPC Profile Logs**: Maps to the `npc_profile_logs` table. Captures logging information for operations (INSERT, UPDATE, DELETE, GENERATE, OPEN) on NPC profiles.
- **Aggregated Metrics**: Derived from database views (`npc_profile_metrics` and `npc_generate_avg_duration_by_complexity`) used for reporting editing and generation performance metrics.

## 2. Endpoints

### A. NPC Profiles

1. **List Profiles**
   - **Method:** GET
   - **URL:** `/npc_profiles`
   - **Description:** Retrieve a paginated list of NPC profiles with optional filtering (e.g., public profiles, owner-based filtering) and sorting.
   - **Query Parameters:**
     - `page` (number, optional): Page number for pagination.
     - `limit` (number, optional): Number of items per page.
     - `sort` (string, optional): Sorting criteria (e.g., `created_at desc`).
     - Additional filters (e.g., `is_public`, `user_id`).
   - **Response Structure:** JSON array of NPC profile objects.
   - **Success Codes:** 200 OK
   - **Error Codes:** 400 Bad Request, 401 Unauthorized

2. **Retrieve Profile Details**
   - **Method:** GET
   - **URL:** `/npc_profiles/{id}`
   - **Description:** Fetch detailed information for a specific NPC profile identified by its UUID.
   - **URL Parameters:**
     - `id` (UUID): Unique identifier of the profile.
   - **Response Structure:** JSON object representing the NPC profile.
   - **Success Codes:** 200 OK
   - **Error Codes:** 404 Not Found, 403 Forbidden

3. **Create NPC Profile**
   - **Method:** POST
   - **URL:** `/npc_profiles`
   - **Description:** Create a new NPC profile with all required information.
   - **Request Body (JSON):**
     ```json
     {
       "name": "string (max 100 chars)",
       "appearance": "string (max 500 chars)",
       "profession": "string (max 100 chars)",
       "relationship_to_party": "string (max 500 chars)",
       "scene_description": "string (max 500 chars)",
       "special_traits": "string (max 150 chars)",
       "complexity_level": "uproszczony | zwykły | szczegółowy",
       "is_public": "boolean"
     }
     ```
   - **Response Structure:** Created profile object with its unique `id` and timestamps (`created_at`, `updated_at`).
   - **Success Codes:** 201 Created
   - **Error Codes:** 400 Bad Request, 401 Unauthorized

4. **Update NPC Profile**
   - **Method:** PUT
   - **URL:** `/npc_profiles/{id}`
   - **Description:** Update an existing NPC profile. Only the profile owner or an admin is allowed to update.
   - **URL Parameters:**
     - `id` (UUID): Unique identifier of the profile.
   - **Request Body (JSON):** JSON object containing the fields to update (same validations apply as on creation).
   - **Response Structure:** Updated NPC profile object.
   - **Success Codes:** 200 OK
   - **Error Codes:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

5. **Delete NPC Profile**
   - **Method:** DELETE
   - **URL:** `/npc_profiles/{id}`
   - **Description:** Delete an existing NPC profile. Only the owner or an admin can perform deletion.
   - **URL Parameters:**
     - `id` (UUID): Unique identifier of the profile.
   - **Response Structure:** Success confirmation message.
   - **Success Codes:** 200 OK
   - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

6. **Generate NPC Profile**
   - **Method:** POST
   - **URL:** `/npc_profiles/generate`
   - **Description:** Leverage an external AI service to generate a full NPC profile based on minimal input parameters. This endpoint returns a generated profile preview that the user can review and edit before finalizing.
   - **Request Body (JSON):**
     ```json
     {
       "initial_prompt": "string",
       "complexity_level": "uproszczony | zwykły | szczegółowy",
       "existing_profile_ids": ["UUID"] // optional
     }
     ```
   - **Response Structure:** Generated NPC profile object containing all fields required for a complete profile.
   - **Success Codes:** 200 OK (or 202 Accepted if processed asynchronously)
   - **Error Codes:** 400 Bad Request, 429 Too Many Requests

### B. NPC Profile Logs and Metrics

1. **Get Logs for a Profile**
   - **Method:** GET
   - **URL:** `/npc_profiles/{id}/logs`
   - **Description:** Retrieve a list of log entries related to a specific NPC profile.
   - **URL Parameters:**
     - `id` (UUID): Unique identifier of the profile.
   - **Response Structure:** JSON array of log objects (each containing fields like `operation`, `operation_timestamp`, `duration`, etc.).
   - **Success Codes:** 200 OK
   - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

2. **Get Aggregated Metrics for a Profile**
   - **Method:** GET
   - **URL:** `/npc_profiles/{id}/metrics`
   - **Description:** Retrieve aggregated metrics for a specific NPC profile (e.g., edit and open counts) from the `npc_profile_metrics` view.
   - **URL Parameters:**
     - `id` (UUID): Unique identifier of the profile.
   - **Response Structure:** JSON object with keys such as `owner_edit_count`, `other_edit_count`, `owner_open_count`, and `other_open_count`.
   - **Success Codes:** 200 OK
   - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

3. **Get Average Generation Duration Metrics by Complexity**
   - **Method:** GET
   - **URL:** `/metrics/generate-average-duration`
   - **Description:** Retrieve average duration of the NPC profile generation process grouped by complexity level from the `npc_generate_avg_duration_by_complexity` view.
   - **Response Structure:** JSON array of objects with properties: `complexity_level` and `average_generate_duration`.
   - **Success Codes:** 200 OK
   - **Error Codes:** 401 Unauthorized

## 3. Authentication and Authorization

- **Authentication Mechanism:** JWT tokens issued by an external authentication provider (e.g., Supabase with Google OAuth) are used. Endpoints that modify or access private data require a valid JWT token in the request header.
- **Authorization:**
  - Only profile owners or admins (as indicated by the `jwt.claims.role` and `jwt.claims.user_id`) are allowed to update or delete profiles.
  - Public endpoints (like listing public profiles) are accessible without strict authentication but may still require token validation for user-specific data.
  - Row Level Security (RLS) in PostgreSQL further ensures that data access is restricted appropriately.

## 4. Validation and Business Logic

- **Field Validation:** All incoming data is validated against database constraints:
  - `name`: Required, max 100 characters.
  - `appearance`: Required, max 500 characters.
  - `profession`: Required, max 100 characters.
  - `relationship_to_party`: Required, max 500 characters.
  - `scene_description`: Required, max 500 characters.
  - `special_traits`: Required, max 150 characters.
  - `complexity_level`: Must be one of "uproszczony", "zwykły", or "szczegółowy".
  - `is_public`: Boolean value.

- **Business Logic Implementations:**
  - **Profile Generation:** The endpoint `/npc_profiles/generate` uses the provided minimal input and selected complexity level to instruct an external AI service to generate extended profile details. The number of sentences in fields such as `appearance` and `scene_description` may vary based on the chosen complexity.
  - **Editable Preview:** Generated profiles are returned as a preview, allowing users to edit and validate details before saving permanently using the standard creation endpoint.
  - **Integration of Existing Profiles:** Users can include references to existing NPC profiles (via their IDs) to enrich the generated content.
  - **Logging:** Every operation (create, update, delete, generate, open) is logged in the `npc_profile_logs` table with metadata such as user role and operation duration. These logs are aggregated in views for monitoring purposes.
  - **Metrics Calculation:** Aggregated metrics, such as edit counts and generation durations, are computed via database views and exposed via dedicated endpoints.

- **Security & Performance Measures:**
  - **Rate Limiting:** Especially on the profile generation endpoint, to manage external AI API costs and prevent abuse.
  - **Pagination, Filtering & Sorting:** Employed on list endpoints to handle large datasets efficiently.
  - **Data Validation:** Both at the API and database levels to ensure data integrity and adherence to field constraints.