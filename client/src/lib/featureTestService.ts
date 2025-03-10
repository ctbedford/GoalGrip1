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
    
    // Create mapping based on area and name matching
    Object.entries(features).forEach(([featureName, feature]) => {
      // Initialize empty array for each feature
      this.featureTestMap[featureName] = [];
      
      // Find tests that match this feature
      tests.forEach(test => {
        // Match by area if available
        if (feature.area && test.area === feature.area) {
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
      }
    });
    
    // Notify listeners if features were updated
    if (updatedFeatures.size > 0) {
      this.notifyListeners();
    }
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