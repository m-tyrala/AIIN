import React, { useCallback } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import DashboardHeader from './DashboardHeader';
import FilterSection from './FilterSection';
import NpcListSection from './NpcListSection';
import PaginationControls from './PaginationControls';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import type { DashboardFilters, PaginationState } from '@/types';

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading, error: authError, logout } = useAuth();
  const { state, actions } = useDashboard();

  // Handle create new NPC
  const handleCreateNew = useCallback(() => {
    // TODO: Navigate to create page
    console.log('Navigate to create NPC page');
    // window.location.href = '/npc/create';
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // TODO: Navigate to login page
      console.log('Navigate to login page');
      // window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

  // Handle view NPC
  const handleViewNpc = useCallback((id: string) => {
    // TODO: Navigate to view page
    console.log('Navigate to view NPC:', id);
    // window.location.href = `/npc/${id}`;
  }, []);

  // Handle edit NPC
  const handleEditNpc = useCallback((id: string) => {
    // TODO: Navigate to edit page
    console.log('Navigate to edit NPC:', id);
    // window.location.href = `/npc/${id}/edit`;
  }, []);

  // Handle delete NPC
  const handleDeleteNpc = useCallback(async (id: string) => {
    const result = await actions.deleteProfile(id);
    if (result.success) {
      console.log('Profile deleted successfully');
      // Optionally show success toast
    } else {
      console.error('Failed to delete profile:', result.error);
      // Error is already handled by the hook and displayed in UI
    }
  }, [actions]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: Partial<DashboardFilters>) => {
    actions.updateFilters(newFilters);
  }, [actions]);

  // Handle pagination change
  const handlePageChange = useCallback((page: number) => {
    actions.updatePagination({ currentPage: page });
  }, [actions]);

  const handleLimitChange = useCallback((limit: number) => {
    actions.updatePagination({ limit });
  }, [actions]);

  // Handle retry
  const handleRetry = useCallback(() => {
    actions.fetchProfiles();
  }, [actions]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Sprawdzanie autoryzacji..." />
      </div>
    );
  }

  // Auth error state
  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ErrorMessage
          title="Błąd autoryzacji"
          message={authError}
          onRetry={handleRetry}
          retryText="Spróbuj ponownie"
        />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Wymagana autoryzacja</h1>
          <p className="text-muted-foreground">
            Musisz być zalogowany, aby uzyskać dostęp do tej strony.
          </p>
          {/* TODO: Add login button */}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <DashboardHeader 
            onCreateNew={handleCreateNew}
            onLogout={handleLogout}
          />
          
          <FilterSection 
            filters={state.filters}
            onFiltersChange={handleFiltersChange}
            disabled={state.loading}
          />
          
          <NpcListSection 
            profiles={state.profiles}
            currentUserId={user.id}
            loading={state.loading}
            error={state.error}
            totalCount={state.pagination.totalCount}
            onView={handleViewNpc}
            onEdit={handleEditNpc}
            onDelete={handleDeleteNpc}
            onRetry={handleRetry}
          />
          
          {state.pagination.totalCount > 0 && (
            <PaginationControls 
              pagination={state.pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              disabled={state.loading}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage; 