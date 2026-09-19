import React from 'react';
import { CollectionView, CollectionViewProps } from './CollectionView';

interface CollectionPresenterProps extends CollectionViewProps {
  isLoading: boolean;
}

export const CollectionPresenter: React.FC<CollectionPresenterProps> = ({
  isLoading,
  ...viewProps
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Loading collection workspace...</p>
        </div>
      </div>
    );
  }

  return <CollectionView {...viewProps} />;
};
