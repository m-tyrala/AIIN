import { useReducer, useCallback, useEffect, useMemo } from 'react';
import type { 
  DashboardViewState, 
  DashboardFilters, 
  PaginationState, 
  NpcProfileDTO,
  ListNpcProfilesQuery,
  PaginatedResponse 
} from '../types';
import { DashboardFiltersSchema, PaginationStateSchema } from '../lib/schemas/dashboard.schema';

// Action types for the reducer
type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROFILES'; payload: NpcProfileDTO[] }
  | { type: 'SET_FILTERS'; payload: Partial<DashboardFilters> }
  | { type: 'SET_PAGINATION'; payload: Partial<PaginationState> }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: DashboardViewState = {
  profiles: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    isPublic: undefined,
    sort: 'created_at desc',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 12,
  },
  user: null,
};

// Reducer function
const dashboardReducer = (state: DashboardViewState, action: DashboardAction): DashboardViewState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload, loading: false, error: null };
    case 'SET_FILTERS':
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 } // Reset to first page on filter change
      };
    case 'SET_PAGINATION':
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

/**
 * Custom hook for dashboard state management
 */
export const useDashboard = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // API call to fetch profiles
  const fetchProfiles = useCallback(async (filters?: Partial<DashboardFilters>, pagination?: Partial<PaginationState>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Use current state values as defaults
      const currentFilters = filters || state.filters;
      const currentPagination = pagination || state.pagination;

      // Validate and prepare query parameters
      const validatedFilters = DashboardFiltersSchema.partial().parse(currentFilters);
      const validatedPagination = PaginationStateSchema.partial().parse(currentPagination);

      const query: ListNpcProfilesQuery = {
        page: validatedPagination.currentPage || currentPagination.currentPage,
        limit: validatedPagination.limit || currentPagination.limit,
        sort: validatedFilters.sort || currentFilters.sort,
        is_public: validatedFilters.isPublic,
        search: validatedFilters.search
      };

      // Prepare query parameters for API call
      const searchParams = new URLSearchParams();
      if (query.page) searchParams.set('page', query.page.toString());
      if (query.limit) searchParams.set('limit', query.limit.toString());
      if (query.sort) searchParams.set('sort', query.sort);
      if (query.is_public !== undefined) searchParams.set('is_public', query.is_public.toString());
      if (query.user_id) searchParams.set('user_id', query.user_id);
      if (query.search && query.search.trim().length > 0) searchParams.set('search', query.search.trim());

      // Make actual API call
      const response = await fetch(`/api/npc_profiles?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profiles: ${response.status} ${response.statusText}`);
      }

      const apiResponse = await response.json();

      dispatch({ type: 'SET_PROFILES', payload: apiResponse.data });
      dispatch({ 
        type: 'SET_PAGINATION', 
        payload: {
          currentPage: apiResponse.pagination.page,
          totalPages: apiResponse.pagination.total_pages,
          totalCount: apiResponse.pagination.total,
          hasNext: apiResponse.pagination.has_next,
          hasPrev: apiResponse.pagination.has_prev,
          limit: apiResponse.pagination.limit,
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas ładowania profili';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.filters, state.pagination]);

  // Delete profile
  const deleteProfile = useCallback(async (profileId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Make actual API call to delete profile
      const response = await fetch(`/api/npc_profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to delete profile: ${response.status} ${response.statusText}`);
      }
      
      // Remove profile from local state and refresh the list
      await fetchProfiles();
      
      return { success: true, message: 'Profil został usunięty pomyślnie' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania profilu';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [fetchProfiles]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    try {
      const validatedFilters = DashboardFiltersSchema.partial().parse(newFilters);
      dispatch({ type: 'SET_FILTERS', payload: validatedFilters });
    } catch (error) {
      console.error('Invalid filters:', error);
    }
  }, []);

  // Update pagination
  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    try {
      const validatedPagination = PaginationStateSchema.partial().parse(newPagination);
      dispatch({ type: 'SET_PAGINATION', payload: validatedPagination });
    } catch (error) {
      console.error('Invalid pagination:', error);
    }
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Fetch profiles when filters or pagination change (includes initial load)
  useEffect(() => {
    fetchProfiles();
  }, [state.filters.search, state.filters.isPublic, state.filters.sort, state.pagination.currentPage, state.pagination.limit]);

  // Memoize actions to prevent unnecessary re-renders
  const actions = useMemo(() => ({
    fetchProfiles,
    deleteProfile,
    updateFilters,
    updatePagination,
    resetState,
  }), [fetchProfiles, deleteProfile, updateFilters, updatePagination, resetState]);

  return {
    state,
    actions,
  };
}; 