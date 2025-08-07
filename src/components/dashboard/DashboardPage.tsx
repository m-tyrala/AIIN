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
  const { user } = useAuth();
  const { state, actions } = useDashboard();

  // Handle create new NPC
  const handleCreateNew = useCallback(() => {
    window.location.href = '/generate';
  }, []);



  // Handle edit NPC
  const handleEditNpc = useCallback((id: string) => {
    window.location.href = `/${id}`;
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
  }, []); // actions jest teraz memoizowany w useDashboard

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: Partial<DashboardFilters>) => {
    actions.updateFilters(newFilters);
  }, []); // actions jest teraz memoizowany w useDashboard

  // Handle pagination change
  const handlePageChange = useCallback((page: number) => {
    actions.updatePagination({ currentPage: page });
  }, []); // actions jest teraz memoizowany w useDashboard

  const handleLimitChange = useCallback((limit: number) => {
    actions.updatePagination({ limit });
  }, []); // actions jest teraz memoizowany w useDashboard

  // Handle retry
  const handleRetry = useCallback(() => {
    actions.fetchProfiles();
  }, []); // actions jest teraz memoizowany w useDashboard

  // Dashboard is now accessible to all users (authenticated and anonymous)
  // User-specific features will be conditionally rendered based on user state

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <DashboardHeader 
            onCreateNew={handleCreateNew}
          />
          
          <FilterSection 
            filters={state.filters}
            onFiltersChange={handleFiltersChange}
            disabled={state.loading}
            currentUser={user}
          />
          
          <NpcListSection 
            profiles={state.profiles}
            currentUserId={user?.id || ''}
            loading={state.loading}
            error={state.error}
            totalCount={state.pagination.totalCount}
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