import { getFeatureVerificationStatus } from './logger';
import { getTestResults, getRegisteredTests, TestStatus, FeatureTest, FeatureTestResult } from './featureTester';
import { FeatureArea } from './logger';
import { 
  EnhancedFeatureStatus,
  FeatureTestInfo,
  FeatureTestMapping, 
  determineFeatureTestStatus, 
  enhanceFeatureStatus
} from './types/featureTypes';

/**
 * Service for integrating feature tests with feature status
 */
export class FeatureTestService {
  private featureTestMap: FeatureTestMapping = {};
  private testFeatureMap: Map<string, string> = new Map();
  private listeners: Array<() => void> = [];
  
  constructor() {
    this.initializeMapping();
  }
  
  /**
   * Initialize mappings between features and tests
   */
  private initializeMapping(): void {
    const tests = getRegisteredTests();
    const features = getFeatureVerificationStatus();
    
    // Reset mappings
    this.featureTestMap = {};
    this.testFeatureMap.clear();
    
    // First, use explicit feature names from tests
    tests.forEach(test => {
      if (test.featureName) {
        // Initialize array if it doesn't exist
        this.featureTestMap[test.featureName] = this.featureTestMap[test.featureName] || [];
        this.featureTestMap[test.featureName].push(test.id);
        this.testFeatureMap.set(test.id, test.featureName);
      }
    });
    
    // Next, apply explicit mappings for core features (only for tests that don't already have a mapping)
    const explicitMappings: Record<string, string[]> = {
      'Dashboard': ['dashboard-stats', 'dashboard-ui', 'dashboard-api'],
      'Goal Creation': ['goal-creation', 'create-goal-modal'],
      'Goal Tracking': ['goal-progress', 'goal-tracking-ui'],
      'Progress Logging': ['progress-log', 'log-progress-modal'],
      'Analytics': ['analytics-chart', 'analytics-data'],
      'Achievements': ['achievement-badges', 'achievement-ui'],
      'Action Items': ['action-items-creation', 'action-items-completion'],
      'User Settings': ['settings-update', 'settings-ui'],
      'Category Management': ['category-creation', 'category-list'],
      'Performance Metrics': ['performance-metrics', 'memory-usage'],
      // Debug infrastructure specific mappings
      'Debug Infrastructure': ['debug-infrastructure', 'enhanced-logger', 'api-tester', 'feature-tester'],
      'Log Viewer': ['log-viewer'],
      'API Dashboard': ['api-dashboard'],
      'Feature Dashboard': ['feature-dashboard']
    };
    
    // Apply explicit mappings
    Object.entries(explicitMappings).forEach(([featureName, testIds]) => {
      // Initialize or get the existing array
      this.featureTestMap[featureName] = this.featureTestMap[featureName] || [];
      
      // Add all the test IDs to this feature
      testIds.forEach(testId => {
        // Only add if the test exists and isn't already mapped
        if (tests.some(test => test.id === testId) && !this.testFeatureMap.has(testId)) {
          this.featureTestMap[featureName].push(testId);
          this.testFeatureMap.set(testId, featureName);
        }
      });
    });
    
    // Then apply automatic mappings for any remaining features/tests
    Object.entries(features).forEach(([featureName, feature]) => {
      // Initialize array if it doesn't exist
      this.featureTestMap[featureName] = this.featureTestMap[featureName] || [];
      
      // Find tests that match this feature but aren't already mapped
      tests.forEach(test => {
        // Skip if this test is already mapped to a feature
        if (this.testFeatureMap.has(test.id)) return;
        
        // Match by area if available
        const featureArea = (feature as any).area;
        if (featureArea && test.area === featureArea) {
          this.featureTestMap[featureName].push(test.id);
          this.testFeatureMap.set(test.id, featureName);
          return;
        }
        
        // Match by name similarity (simple check)
        const testNameLower = test.name.toLowerCase();
        const testIdLower = test.id.toLowerCase();
        const featureNameLower = featureName.toLowerCase();
        
        if (
          testNameLower.includes(featureNameLower) || 
          featureNameLower.includes(testNameLower) ||
          testIdLower.includes(featureNameLower) ||
          featureNameLower.includes(testIdLower)
        ) {
          this.featureTestMap[featureName].push(test.id);
          this.testFeatureMap.set(test.id, featureName);
        }
      });
    });
    
    // Ensure all tests have a feature mapping
    tests.forEach(test => {
      if (!this.testFeatureMap.has(test.id)) {
        // Default to mapping by area
        const defaultFeature = Object.entries(features).find(
          ([_, feature]) => (feature as any).area === test.area
        );
        
        if (defaultFeature) {
          this.featureTestMap[defaultFeature[0]].push(test.id);
          this.testFeatureMap.set(test.id, defaultFeature[0]);
        } else {
          // Last resort: map to a generic "Other Features" category
          const otherFeature = "Other Features";
          this.featureTestMap[otherFeature] = this.featureTestMap[otherFeature] || [];
          this.featureTestMap[otherFeature].push(test.id);
          this.testFeatureMap.set(test.id, otherFeature);
        }
      }
    });
    
    // Log mapping results for debugging
    console.log('Feature test mapping completed:', {
      featureCount: Object.keys(this.featureTestMap).length,
      testCount: this.testFeatureMap.size,
      unmappedTests: tests.filter(t => !this.testFeatureMap.has(t.id)).map(t => t.id)
    });
  }
  
  /**
   * Public method to force a refresh of the mapping
   */
  public refreshMapping(): void {
    this.initializeMapping();
    this.notifyListeners();
  }
  
  /**
   * Get all feature test info
   */
  public getFeatureTests(): FeatureTestInfo[] {
    const registeredTests = getRegisteredTests();
    const testResults = getTestResults();
    
    return registeredTests.map(test => {
      const result = testResults[test.id];
      
      return {
        id: test.id,
        name: test.name,
        description: test.description,
        featureName: this.testFeatureMap.get(test.id) || '',
        area: test.area,
        status: result ? result.status : TestStatus.NOT_STARTED,
        lastRun: result?.timestamp ? new Date(result.timestamp) : undefined,
        duration: result?.duration,
        error: result?.error,
        dependencies: test.dependencies
      };
    });
  }
  
  /**
   * Get tests for a specific feature
   */
  public getTestsForFeature(featureName: string): FeatureTestInfo[] {
    const allTests = this.getFeatureTests();
    const testIds = this.featureTestMap[featureName] || [];
    
    return allTests.filter(test => testIds.includes(test.id));
  }
  
  /**
   * Get enhanced feature status with test information
   */
  public getEnhancedFeatures(): EnhancedFeatureStatus[] {
    const features = getFeatureVerificationStatus();
    return Object.entries(features).map(([name, feature]) => {
      const tests = this.getTestsForFeature(name);
      return enhanceFeatureStatus({ ...feature, name }, tests);
    });
  }
  
  /**
   * Get enhanced feature by name
   */
  public getEnhancedFeature(featureName: string): EnhancedFeatureStatus | undefined {
    const features = getFeatureVerificationStatus();
    const feature = features[featureName];
    
    if (!feature) {
      return undefined;
    }
    
    const tests = this.getTestsForFeature(featureName);
    return enhanceFeatureStatus({ ...feature, name: featureName }, tests);
  }
  
  /**
   * Update feature test status after a test run
   */
  public updateFeatureTestStatus(testIds: string[]): void {
    // Refresh the test results
    const testResults = getTestResults();
    
    // Update features associated with these tests
    const updatedFeatures = new Set<string>();
    
    testIds.forEach(testId => {
      const featureName = this.testFeatureMap.get(testId);
      if (featureName) {
        updatedFeatures.add(featureName);
        
        // Get the test result for this test
        const testResult = testResults[testId];
        if (testResult && testResult.status === TestStatus.PASSED) {
          // Mark the feature as tested in the logger
          import('./logger').then(loggerModule => {
            loggerModule.markFeatureTested(featureName, true, `Test passed: ${testResult.name}`);
          });
        }
      }
    });
    
    // Force a remapping after test runs to ensure everything is up to date
    this.initializeMapping();
    
    // Notify listeners about updates
    this.notifyListeners();
  }
  
  /**
   * Subscribe to test status changes
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in feature test service listener:', error);
      }
    });
  }
}

// Create a singleton instance
export const featureTestService = new FeatureTestService();