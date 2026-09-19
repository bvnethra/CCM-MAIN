import React from 'react';
import { PerformCalibrationView, PerformCalibrationViewProps } from './PerformCalibrationView';

interface PerformCalibrationPresenterProps extends PerformCalibrationViewProps {
  isLoading: boolean;
}

export const PerformCalibrationPresenter: React.FC<PerformCalibrationPresenterProps> = ({
  isLoading,
  ...viewProps
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <PerformCalibrationView {...viewProps} />;
};
