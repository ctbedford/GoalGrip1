/**
 * Dashboard Component Tests
 * 
 * This module provides tests for verifying the functionality of the dashboard components.
 * It tests the rendering and behavior of stats cards, goal cards, action item cards,
 * and other dashboard UI elements.
 */

import { FeatureArea } from '../logger';
import { registerFeatureTest } from '../featureTester';
import { queryClient } from '../queryClient';

/**
 * Test for Dashboard Stats API
 */
registerFeatureTest({
  id: "dashboard-stats-api",
  name: "Dashboard Stats API Test",
  description: "Verifies the dashboard stats API returns correct data",
  area: FeatureArea.DASHBOARD,
  featureName: "dashboard-stats",
  async test(contextId?) {
    try {
      // Fetch dashboard stats
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        console.error('Dashboard stats API failed:', await response.text());
        return false;
      }
      
      const stats = await response.json();
      
      // Verify the stats have the required fields
      if (typeof stats.activeGoals !== 'number' ||
          typeof stats.completedGoals !== 'number' ||
          typeof stats.pointsEarned !== 'number') {
        console.error('Dashboard stats missing required fields:', stats);
        return false;
      }
      
      console.log('Dashboard stats API test passed:', stats);
      return true;
    } catch (error) {
      console.error('Error in dashboard stats API test:', error);
      return false;
    }
  }
});

/**
 * Test for Goals API with Categories
 */
registerFeatureTest({
  id: "dashboard-goals-api",
  name: "Dashboard Goals API Test",
  description: "Verifies the goals API returns goals with their categories",
  area: FeatureArea.DASHBOARD,
  featureName: "dashboard-stats",
  async test(contextId?) {
    try {
      // Fetch goals
      const response = await fetch('/api/goals');
      
      if (!response.ok) {
        console.error('Goals API failed:', await response.text());
        return false;
      }
      
      const goals = await response.json();
      
      // Verify that goals is an array
      if (!Array.isArray(goals)) {
        console.error('Goals API did not return an array:', goals);
        return false;
      }
      
      // If there are goals, check that they have the correct structure
      if (goals.length > 0) {
        const firstGoal = goals[0];
        
        // Verify goal has required fields
        if (typeof firstGoal.id !== 'number' ||
            typeof firstGoal.description !== 'string' ||
            typeof firstGoal.targetValue !== 'number' ||
            typeof firstGoal.currentValue !== 'number' ||
            typeof firstGoal.categoryId !== 'number') {
          console.error('Goal missing required fields:', firstGoal);
          return false;
        }
        
        // Verify goal has a category attached
        if (!firstGoal.category || 
            typeof firstGoal.category.id !== 'number' ||
            typeof firstGoal.category.name !== 'string' ||
            typeof firstGoal.category.color !== 'string') {
          console.error('Goal missing category information:', firstGoal);
          return false;
        }
      }
      
      console.log('Goals API test passed:', goals);
      return true;
    } catch (error) {
      console.error('Error in goals API test:', error);
      return false;
    }
  }
});

/**
 * Test for Action Items API
 */
registerFeatureTest({
  id: "dashboard-action-items-api",
  name: "Dashboard Action Items API Test",
  description: "Verifies the action items API returns correctly formatted data",
  area: FeatureArea.DASHBOARD,
  featureName: "dashboard-stats",
  async test(contextId?) {
    try {
      // Fetch action items
      const response = await fetch('/api/action-items');
      
      if (!response.ok) {
        console.error('Action items API failed:', await response.text());
        return false;
      }
      
      const actionItems = await response.json();
      
      // Verify that action items is an array
      if (!Array.isArray(actionItems)) {
        console.error('Action items API did not return an array:', actionItems);
        return false;
      }
      
      // If there are action items, check that they have the correct structure
      if (actionItems.length > 0) {
        const firstItem = actionItems[0];
        
        // Verify action item has required fields
        if (typeof firstItem.id !== 'number' ||
            typeof firstItem.goalId !== 'number' ||
            typeof firstItem.description !== 'string' ||
            typeof firstItem.completed !== 'boolean') {
          console.error('Action item missing required fields:', firstItem);
          return false;
        }
        
        // Verify action item has goal description
        if (typeof firstItem.goalDescription !== 'string') {
          console.error('Action item missing goal description:', firstItem);
          return false;
        }
      }
      
      console.log('Action items API test passed:', actionItems);
      return true;
    } catch (error) {
      console.error('Error in action items API test:', error);
      return false;
    }
  }
});

/**
 * Test for Dashboard Data Integration
 */
registerFeatureTest({
  id: "dashboard-data-integration",
  name: "Dashboard Data Integration Test",
  description: "Verifies the dashboard correctly integrates data from multiple API endpoints",
  area: FeatureArea.DASHBOARD,
  featureName: "dashboard-stats",
  async test(contextId?) {
    try {
      // Invalidate all queries to ensure fresh data
      await queryClient.invalidateQueries();
      
      // Fetch all dashboard-related data
      const [statsResponse, goalsResponse, actionItemsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/goals'),
        fetch('/api/action-items')
      ]);
      
      if (!statsResponse.ok || !goalsResponse.ok || !actionItemsResponse.ok) {
        console.error('One or more dashboard APIs failed');
        return false;
      }
      
      const stats = await statsResponse.json();
      const goals = await goalsResponse.json();
      const actionItems = await actionItemsResponse.json();
      
      // Verify that active goals count matches the number of active goals in the goals array
      const activeGoalsInArray = Array.isArray(goals) 
        ? goals.filter(goal => !goal.completed).length 
        : 0;
      
      if (stats.activeGoals !== activeGoalsInArray) {
        console.error(
          'Active goals count mismatch:',
          `Stats API: ${stats.activeGoals}, Goals array: ${activeGoalsInArray}`
        );
        return false;
      }
      
      // Verify that completed goals count matches the number of completed goals in the goals array
      const completedGoalsInArray = Array.isArray(goals)
        ? goals.filter(goal => goal.completed).length
        : 0;
      
      if (stats.completedGoals !== completedGoalsInArray) {
        console.error(
          'Completed goals count mismatch:',
          `Stats API: ${stats.completedGoals}, Goals array: ${completedGoalsInArray}`
        );
        return false;
      }
      
      console.log('Dashboard data integration test passed');
      return true;
    } catch (error) {
      console.error('Error in dashboard data integration test:', error);
      return false;
    }
  }
});

/**
 * Register all dashboard tests
 */
export function registerDashboardTests() {
  console.log('Dashboard component tests registered');
}

registerDashboardTests();