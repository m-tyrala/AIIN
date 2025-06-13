import { useReducer, useCallback, useEffect } from 'react';
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

      // Validate and prepare query parameters
      const validatedFilters = DashboardFiltersSchema.partial().parse(filters || state.filters);
      const validatedPagination = PaginationStateSchema.partial().parse(pagination || state.pagination);

      const query: ListNpcProfilesQuery = {
        page: validatedPagination.currentPage || state.pagination.currentPage,
        limit: validatedPagination.limit || state.pagination.limit,
        sort: validatedFilters.sort || state.filters.sort,
        is_public: validatedFilters.isPublic,
        // TODO: Add search parameter to API when backend supports it
      };

      // TODO: Replace with actual API call
      // const response = await NpcProfileApiService.getProfiles(query);
      
      // Mock API response for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResponse: PaginatedResponse<NpcProfileDTO> = {
        data: [],
        pagination: {
          page: query.page || 1,
          limit: query.limit || 12,
          total: 0,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        }
      };

      dispatch({ type: 'SET_PROFILES', payload: mockResponse.data });
      dispatch({ 
        type: 'SET_PAGINATION', 
        payload: {
          currentPage: mockResponse.pagination.page,
          totalPages: mockResponse.pagination.total_pages,
          totalCount: mockResponse.pagination.total,
          hasNext: mockResponse.pagination.has_next,
          hasPrev: mockResponse.pagination.has_prev,
          limit: mockResponse.pagination.limit,
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas ładowania profili';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.filters, state.pagination]);

  // Delete profile
  const deleteProfile = useCallback(async (profileId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Replace with actual API call
      // await NpcProfileApiService.deleteProfile(profileId);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove profile from local state
      const updatedProfiles = state.profiles.filter(profile => profile.id !== profileId);
      dispatch({ type: 'SET_PROFILES', payload: updatedProfiles });
      
      return { success: true, message: 'Profil został usunięty pomyślnie' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania profilu';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [state.profiles]);

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

  // Load initial data
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Refetch when filters or pagination change
  useEffect(() => {
    fetchProfiles();
  }, [state.filters, state.pagination.currentPage, state.pagination.limit]);

  return {
    state,
    actions: {
      fetchProfiles,
      deleteProfile,
      updateFilters,
      updatePagination,
      resetState,
    },
  };
}; 