import { FeatureArea } from "@/lib/logger";
import { TestStatus } from "@/lib/featureTester";

/**
 * Extended feature status interface that includes test result information
 */
export interface EnhancedFeatureStatus {
  // Core feature metadata
  name: string;
  area?: FeatureArea;
  
  // Implementation status
  implemented: boolean;
  implementedAt?: Date;
  
  // Test status
  testStatus: 'not_tested' | 'passed' | 'failed' | 'partially_passed' | 'skipped';
  lastTested?: Date;
  
  // Documentation
  notes: string[];
}

/**
 * Feature test information with dependency information
 */
export interface FeatureTestInfo {
  id: string;
  name: string;
  description: string;
  featureName: string;  // Associated feature name
  area?: FeatureArea;
  status: TestStatus;
  lastRun?: Date;
  duration?: number;
  error?: string;
  dependencies?: string[];
}

/**
 * Mapping between features and their associated tests
 */
export interface FeatureTestMapping {
  [featureName: string]: string[]; // Feature name to array of test IDs
}

/**
 * Feature test result summary
 */
export interface TestResultSummary {
  passed: number;
  failed: number;
  skipped: number;
  notRun: number;
  total: number;
  lastRun?: Date;
}

/**
 * Helper functions to work with feature test data
 */

/**
 * Calculate test result summary for a feature
 */
export function calculateTestResultSummary(tests: FeatureTestInfo[]): TestResultSummary {
  const summary: TestResultSummary = {
    passed: 0,
    failed: 0,
    skipped: 0,
    notRun: 0,
    total: tests.length
  };
  
  let latestRun: Date | undefined;
  
  tests.forEach(test => {
    switch (test.status) {
      case TestStatus.PASSED:
        summary.passed++;
        break;
      case TestStatus.FAILED:
        summary.failed++;
        break;
      case TestStatus.SKIPPED:
        summary.skipped++;
        break;
      case TestStatus.NOT_STARTED:
      default:
        summary.notRun++;
        break;
    }
    
    // Update latest run time
    if (test.lastRun) {
      if (!latestRun || test.lastRun > latestRun) {
        latestRun = test.lastRun;
      }
    }
  });
  
  summary.lastRun = latestRun;
  return summary;
}

/**
 * Determine overall test status for a feature based on its tests
 */
export function determineFeatureTestStatus(tests: FeatureTestInfo[]): 'not_tested' | 'passed' | 'failed' | 'partially_passed' | 'skipped' {
  if (tests.length === 0) {
    return 'not_tested';
  }
  
  const summary = calculateTestResultSummary(tests);
  
  // If all tests were run and passed
  if (summary.total === summary.passed && summary.total > 0) {
    return 'passed';
  }
  
  // If at least one test has been run
  const testsRun = summary.passed + summary.failed + summary.skipped;
  
  // If no tests have been run yet
  if (testsRun === 0) {
    return 'not_tested';
  }
  
  // If any test failed, the feature test status is failed
  if (summary.failed > 0) {
    return 'failed';
  }
  
  // If some tests passed and others were skipped
  if (summary.passed > 0 && summary.skipped > 0) {
    return 'partially_passed';
  }
  
  // If all tests were skipped
  if (summary.skipped > 0 && summary.skipped === testsRun) {
    return 'skipped';
  }
  
  // If some tests passed and others not run
  if (summary.passed > 0) {
    return 'partially_passed';
  }
  
  return 'not_tested';
}

/**
 * Convert original feature status to enhanced feature status
 */
export function enhanceFeatureStatus(
  feature: { name: string; implemented: boolean; tested: boolean; lastVerified: Date | null; notes: string[]; area?: FeatureArea },
  tests: FeatureTestInfo[]
): EnhancedFeatureStatus {
  // Calculate test status based on the available tests
  const testStatus = determineFeatureTestStatus(tests);
  
  // Calculate last tested date from test runs
  const summary = calculateTestResultSummary(tests);
  const lastTested = summary.lastRun;
  
  // Enhanced implementation status determination
  // If feature is explicitly marked as implemented, keep that status
  // Otherwise, derive it from test results
  let implemented = feature.implemented;
  
  // A feature with passing tests is definitely implemented
  if (summary.passed > 0) {
    implemented = true;
  }
  
  // Features with partial results might be implemented
  if (!implemented && testStatus === 'partially_passed') {
    implemented = true;
  }
  
  // Important: If there are no tests, respect the manual implementation flag
  
  return {
    name: feature.name,
    area: feature.area,
    implemented,
    implementedAt: feature.lastVerified || (implemented && lastTested ? lastTested : undefined),
    testStatus,
    lastTested,
    notes: feature.notes
  };
}