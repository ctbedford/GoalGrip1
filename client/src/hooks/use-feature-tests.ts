import { useState, useEffect, useMemo } from 'react';
import { featureTestService } from '@/lib/featureTestService';
import { EnhancedFeatureStatus, FeatureTestInfo, TestResultSummary, calculateTestResultSummary } from '@/lib/types/featureTypes';

/**
 * Hook for accessing enhanced feature status with test integration
 */
export function useFeatureTests() {
  const [features, setFeatures] = useState<EnhancedFeatureStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get feature test information
  useEffect(() => {
    const loadFeatures = () => {
      try {
        const enhancedFeatures = featureTestService.getEnhancedFeatures();
        setFeatures(enhancedFeatures);
      } catch (error) {
        console.error('Error loading enhanced features:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFeatures();
    
    // Subscribe to changes
    const unsubscribe = featureTestService.subscribe(() => {
      loadFeatures();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  /**
   * Get tests for a specific feature
   */
  const getFeatureTests = (featureName: string) => {
    return featureTestService.getTestsForFeature(featureName);
  };
  
  /**
   * Get test summary for a feature
   */
  const getFeatureTestSummary = (featureName: string): TestResultSummary => {
    const tests = featureTestService.getTestsForFeature(featureName);
    return calculateTestResultSummary(tests);
  };
  
  /**
   * Get a single enhanced feature by name
   */
  const getFeature = (featureName: string): EnhancedFeatureStatus | undefined => {
    return features.find(f => f.name === featureName);
  };
  
  /**
   * Filter features by test status
   */
  const filterFeaturesByTestStatus = (status: 'not_tested' | 'passed' | 'failed' | 'partially_passed' | 'skipped') => {
    return features.filter(feature => feature.testStatus === status);
  };
  
  /**
   * Get overall test statistics
   */
  const overallStats = useMemo(() => {
    const stats = {
      totalFeatures: features.length,
      implemented: features.filter(f => f.implemented).length,
      notImplemented: features.filter(f => !f.implemented).length,
      fullyTested: features.filter(f => f.testStatus === 'passed').length,
      partiallyTested: features.filter(f => f.testStatus === 'partially_passed').length,
      failed: features.filter(f => f.testStatus === 'failed').length,
      skipped: features.filter(f => f.testStatus === 'skipped').length,
      notTested: features.filter(f => f.testStatus === 'not_tested').length
    };
    
    return stats;
  }, [features]);
  
  return {
    features,
    isLoading,
    getFeatureTests,
    getFeatureTestSummary,
    getFeature,
    filterFeaturesByTestStatus,
    overallStats
  };
}