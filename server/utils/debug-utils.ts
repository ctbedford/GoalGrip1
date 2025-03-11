import fs from 'fs';
import path from 'path';
import { FeatureArea } from './server-logger';

/**
 * Debug Utilities
 * 
 * This module provides utility functions for the debug infrastructure, 
 * particularly focused on documentation management and feature tracking.
 */

/**
 * Interface for feature documentation
 */
export interface FeatureDocumentation {
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'implemented' | 'tested' | 'complete';
  area: FeatureArea;
  dependencies?: string[];
  apis?: string[];
  components?: string[];
  notes?: string[];
  lastUpdated: Date;
}

/**
 * Create or update a markdown documentation file for a feature
 */
export function updateFeatureDocumentation(feature: FeatureDocumentation): boolean {
  try {
    const filename = `${feature.name.toLowerCase().replace(/\s+/g, '_')}.md`;
    const filePath = path.join('.', filename);
    
    // Generate markdown content
    const content = generateFeatureMarkdown(feature);
    
    // Write to file
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`Updated documentation for ${feature.name} at ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error updating documentation for ${feature.name}:`, error);
    return false;
  }
}

/**
 * Generate markdown content for a feature
 */
function generateFeatureMarkdown(feature: FeatureDocumentation): string {
  const { name, description, status, area, dependencies, apis, components, notes, lastUpdated } = feature;
  
  let markdown = `# ${name}\n\n`;
  markdown += `*Last Updated: ${lastUpdated.toISOString().split('T')[0]}*\n\n`;
  markdown += `**Status:** ${status.charAt(0).toUpperCase() + status.slice(1)}\n`;
  markdown += `**Area:** ${area}\n\n`;
  markdown += `## Description\n\n${description}\n\n`;
  
  // Add dependencies if available
  if (dependencies && dependencies.length > 0) {
    markdown += `## Dependencies\n\n`;
    dependencies.forEach(dep => {
      markdown += `- ${dep}\n`;
    });
    markdown += '\n';
  }
  
  // Add APIs if available
  if (apis && apis.length > 0) {
    markdown += `## API Endpoints\n\n`;
    apis.forEach(api => {
      markdown += `- \`${api}\`\n`;
    });
    markdown += '\n';
  }
  
  // Add components if available
  if (components && components.length > 0) {
    markdown += `## Components\n\n`;
    components.forEach(component => {
      markdown += `- ${component}\n`;
    });
    markdown += '\n';
  }
  
  // Add notes if available
  if (notes && notes.length > 0) {
    markdown += `## Implementation Notes\n\n`;
    notes.forEach(note => {
      markdown += `- ${note}\n`;
    });
    markdown += '\n';
  }
  
  // Add placeholder for test results
  markdown += `## Test Results\n\n`;
  markdown += `*Automated test results will be populated here*\n\n`;
  
  // Add placeholder for performance metrics
  markdown += `## Performance Metrics\n\n`;
  markdown += `*Performance metrics will be populated here*\n\n`;
  
  return markdown;
}

/**
 * Get a list of all markdown documentation files
 */
export function getAllDocumentationFiles(): string[] {
  try {
    return fs.readdirSync('.')
      .filter(file => file.endsWith('.md') && !['README.md'].includes(file));
  } catch (error) {
    console.error('Error getting documentation files:', error);
    return [];
  }
}

/**
 * Parse a markdown file to extract feature documentation
 */
export function parseFeatureDocumentation(filename: string): FeatureDocumentation | null {
  try {
    const filePath = path.join('.', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract information using regex
    const nameMatch = content.match(/^#\s+(.*)/m);
    const descriptionMatch = content.match(/## Description\s+\n\n([\s\S]*?)(?=\n\n##|$)/m);
    const statusMatch = content.match(/\*\*Status:\*\*\s+(.*)/m);
    const areaMatch = content.match(/\*\*Area:\*\*\s+(.*)/m);
    const lastUpdatedMatch = content.match(/\*Last Updated:\s+([\d-]+)\*/m);
    
    // Extract notes
    const notesSection = content.match(/## Implementation Notes\s+\n\n([\s\S]*?)(?=\n\n##|$)/m);
    const notes = notesSection ? 
      notesSection[1].split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.replace('- ', '').trim())
      : [];
    
    // Return parsed feature
    return {
      name: nameMatch ? nameMatch[1].trim() : filename.replace('.md', ''),
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      status: statusMatch ? 
        statusMatch[1].toLowerCase() as 'planned' | 'in-progress' | 'implemented' | 'tested' | 'complete' 
        : 'planned',
      area: areaMatch ? areaMatch[1] as FeatureArea : FeatureArea.UI,
      notes,
      lastUpdated: lastUpdatedMatch ? new Date(lastUpdatedMatch[1]) : new Date()
    };
  } catch (error) {
    console.error(`Error parsing documentation for ${filename}:`, error);
    return null;
  }
}

/**
 * Update the README.md file with a list of all documented features
 */
export function updateReadmeWithFeatureList(): boolean {
  try {
    const readmePath = path.join('.', 'README.md');
    let readmeContent = fs.existsSync(readmePath) ? 
      fs.readFileSync(readmePath, 'utf8') : 
      '# Goal Tracker Application\n\n';
    
    // Get all feature documentation files
    const docFiles = getAllDocumentationFiles();
    const features = docFiles
      .map(file => parseFeatureDocumentation(file))
      .filter(feature => feature !== null);
    
    // Create feature section content
    let featureSection = '## Application Features\n\n';
    
    // Group features by area
    const featuresByArea = features.reduce((acc, feature) => {
      if (!feature) return acc;
      
      const area = feature.area || FeatureArea.UI;
      if (!acc[area]) acc[area] = [];
      acc[area].push(feature);
      return acc;
    }, {} as Record<string, FeatureDocumentation[]>);
    
    // Add features grouped by area
    Object.entries(featuresByArea).forEach(([area, areaFeatures]) => {
      featureSection += `### ${area.charAt(0).toUpperCase() + area.slice(1)}\n\n`;
      
      areaFeatures.forEach(feature => {
        const statusEmoji = getStatusEmoji(feature.status);
        featureSection += `- ${statusEmoji} **${feature.name}** - ${feature.description.split('.')[0]}.\n`;
      });
      
      featureSection += '\n';
    });
    
    // Add legend
    featureSection += '### Status Legend\n\n';
    featureSection += '- 📝 Planned\n';
    featureSection += '- 🚧 In Progress\n';
    featureSection += '- 🔨 Implemented\n';
    featureSection += '- ✅ Tested\n';
    featureSection += '- ⭐ Complete\n\n';
    
    // Update or add features section in README
    const featuresRegex = /## Application Features\s+[\s\S]*?(?=##|$)/m;
    if (featuresRegex.test(readmeContent)) {
      // Replace existing section
      readmeContent = readmeContent.replace(featuresRegex, featureSection);
    } else {
      // Add new section before the first ## that's not the title
      const firstSectionMatch = readmeContent.match(/^# .*\n\n(##[^#])/m);
      if (firstSectionMatch) {
        const pos = readmeContent.indexOf(firstSectionMatch[1]);
        readmeContent = readmeContent.slice(0, pos) + featureSection + readmeContent.slice(pos);
      } else {
        // If no sections found, add to the end
        readmeContent += '\n\n' + featureSection;
      }
    }
    
    // Write updated README
    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    
    console.log('Updated README.md with feature list');
    return true;
  } catch (error) {
    console.error('Error updating README with feature list:', error);
    return false;
  }
}

/**
 * Get emoji for feature status
 */
function getStatusEmoji(status: string): string {
  switch (status.toLowerCase()) {
    case 'planned': return '📝';
    case 'in-progress': return '🚧';
    case 'implemented': return '🔨';
    case 'tested': return '✅';
    case 'complete': return '⭐';
    default: return '❓';
  }
}

/**
 * Create a markdown report for test results
 */
export function createTestResultsReport(results: any[], outputFile: string = 'TEST_RESULTS.md'): boolean {
  try {
    const reportPath = path.join('.', outputFile);
    
    // Generate markdown content
    let content = '# Test Results Report\n\n';
    content += `*Generated on: ${new Date().toISOString().split('T')[0]}*\n\n`;
    
    // Summary statistics
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;
    
    content += `## Summary\n\n`;
    content += `- **Total Tests:** ${totalTests}\n`;
    content += `- **Passed:** ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)\n`;
    content += `- **Failed:** ${failedTests} (${Math.round(failedTests / totalTests * 100)}%)\n`;
    content += `- **Skipped:** ${skippedTests} (${Math.round(skippedTests / totalTests * 100)}%)\n\n`;
    
    // Failed tests (if any)
    if (failedTests > 0) {
      content += `## Failed Tests\n\n`;
      
      results.filter(r => r.status === 'failed').forEach(test => {
        content += `### ${test.name}\n\n`;
        content += `**Description:** ${test.description}\n\n`;
        content += `**Error:** ${test.error || 'Unknown error'}\n\n`;
        
        if (test.details) {
          content += `**Details:**\n\n`;
          content += '```json\n';
          content += JSON.stringify(test.details, null, 2);
          content += '\n```\n\n';
        }
      });
    }
    
    // All test results
    content += `## All Test Results\n\n`;
    content += '| Test | Description | Status | Duration |\n';
    content += '| ---- | ----------- | ------ | -------- |\n';
    
    results.forEach(test => {
      const statusEmoji = test.status === 'passed' ? '✅' : 
                         test.status === 'failed' ? '❌' : 
                         test.status === 'skipped' ? '⏭️' : '❓';
      
      content += `| ${test.name} | ${test.description.slice(0, 50)}${test.description.length > 50 ? '...' : ''} | ${statusEmoji} ${test.status} | ${test.duration || '-'} ms |\n`;
    });
    
    // Write to file
    fs.writeFileSync(reportPath, content, 'utf8');
    
    console.log(`Created test results report at ${reportPath}`);
    return true;
  } catch (error) {
    console.error('Error creating test results report:', error);
    return false;
  }
}

/**
 * Create a markdown report for performance metrics
 */
export function createPerformanceReport(metrics: any, outputFile: string = 'PERFORMANCE_REPORT.md'): boolean {
  try {
    const reportPath = path.join('.', outputFile);
    
    // Generate markdown content
    let content = '# Performance Metrics Report\n\n';
    content += `*Generated on: ${new Date().toISOString().split('T')[0]}*\n\n`;
    
    // API Endpoints section
    if (metrics.apiLatency && metrics.apiLatency.endpoints) {
      content += `## API Endpoint Performance\n\n`;
      content += '| Endpoint | Avg Response Time | Requests |\n';
      content += '| -------- | ---------------- | -------- |\n';
      
      metrics.apiLatency.endpoints.forEach((endpoint: any) => {
        content += `| ${endpoint.path} | ${endpoint.avgResponseTime} ms | ${endpoint.requests} |\n`;
      });
      
      content += '\n';
    }
    
    // Memory usage
    if (metrics.memory && metrics.memory.usage) {
      content += `## Memory Usage\n\n`;
      content += '| Metric | Value |\n';
      content += '| ------ | ----- |\n';
      
      Object.entries(metrics.memory.usage).forEach(([key, value]) => {
        const valueInMB = typeof value === 'number' ? Math.round(value / 1024 / 1024 * 100) / 100 : 0;
        content += `| ${key} | ${valueInMB} MB |\n`;
      });
      
      content += '\n';
    }
    
    // Uptime
    if (typeof metrics.uptime === 'number') {
      const uptime = metrics.uptime;
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      content += `## Server Uptime\n\n`;
      content += `${days}d ${hours}h ${minutes}m ${seconds}s\n\n`;
    }
    
    // Write to file
    fs.writeFileSync(reportPath, content, 'utf8');
    
    console.log(`Created performance report at ${reportPath}`);
    return true;
  } catch (error) {
    console.error('Error creating performance report:', error);
    return false;
  }
}

/**
 * Update or create a development progress report
 */
export function updateDevelopmentProgressReport(outputFile: string = 'DEVELOPMENT_PROGRESS.md'): boolean {
  try {
    const reportPath = path.join('.', outputFile);
    
    // Get all feature documentation files
    const docFiles = getAllDocumentationFiles();
    const features = docFiles
      .map(file => parseFeatureDocumentation(file))
      .filter(feature => feature !== null) as FeatureDocumentation[];
    
    // Generate markdown content
    let content = '# Development Progress Report\n\n';
    content += `*Generated on: ${new Date().toISOString().split('T')[0]}*\n\n`;
    
    // Calculate overall progress
    const totalFeatures = features.length;
    const plannedFeatures = features.filter(f => f.status === 'planned').length;
    const inProgressFeatures = features.filter(f => f.status === 'in-progress').length;
    const implementedFeatures = features.filter(f => f.status === 'implemented').length;
    const testedFeatures = features.filter(f => f.status === 'tested').length;
    const completeFeatures = features.filter(f => f.status === 'complete').length;
    
    // Overall progress section
    content += `## Overall Progress\n\n`;
    content += `- **Total Features:** ${totalFeatures}\n`;
    content += `- **Planned:** ${plannedFeatures} (${Math.round(plannedFeatures / totalFeatures * 100)}%)\n`;
    content += `- **In Progress:** ${inProgressFeatures} (${Math.round(inProgressFeatures / totalFeatures * 100)}%)\n`;
    content += `- **Implemented:** ${implementedFeatures} (${Math.round(implementedFeatures / totalFeatures * 100)}%)\n`;
    content += `- **Tested:** ${testedFeatures} (${Math.round(testedFeatures / totalFeatures * 100)}%)\n`;
    content += `- **Complete:** ${completeFeatures} (${Math.round(completeFeatures / totalFeatures * 100)}%)\n\n`;
    
    // Progress bar visualization
    content += `## Progress Visualization\n\n`;
    content += `\`\`\`\n`;
    content += `[${'#'.repeat(completeFeatures)}${'='.repeat(testedFeatures)}${'*'.repeat(implementedFeatures)}${'+'.repeat(inProgressFeatures)}${'.'.repeat(plannedFeatures)}] ${Math.round((completeFeatures + testedFeatures) / totalFeatures * 100)}% Complete\n`;
    content += `\n`;
    content += `Legend: # = Complete, = = Tested, * = Implemented, + = In Progress, . = Planned\n`;
    content += `\`\`\`\n\n`;
    
    // Feature status by area
    content += `## Feature Status by Area\n\n`;
    
    // Group features by area
    const featuresByArea = features.reduce((acc, feature) => {
      const area = feature.area || FeatureArea.UI;
      if (!acc[area]) acc[area] = [];
      acc[area].push(feature);
      return acc;
    }, {} as Record<string, FeatureDocumentation[]>);
    
    // Add features grouped by area
    Object.entries(featuresByArea).forEach(([area, areaFeatures]) => {
      content += `### ${area.charAt(0).toUpperCase() + area.slice(1)}\n\n`;
      content += '| Feature | Status | Description | Last Updated |\n';
      content += '| ------- | ------ | ----------- | ------------ |\n';
      
      areaFeatures.forEach(feature => {
        const statusEmoji = getStatusEmoji(feature.status);
        const lastUpdated = feature.lastUpdated.toISOString().split('T')[0];
        
        content += `| ${feature.name} | ${statusEmoji} ${feature.status} | ${feature.description.slice(0, 50)}${feature.description.length > 50 ? '...' : ''} | ${lastUpdated} |\n`;
      });
      
      content += '\n';
    });
    
    // Recent updates section
    content += `## Recent Updates\n\n`;
    
    // Sort features by last updated
    const recentFeatures = [...features].sort((a, b) => 
      b.lastUpdated.getTime() - a.lastUpdated.getTime()
    ).slice(0, 5);
    
    recentFeatures.forEach(feature => {
      const lastUpdated = feature.lastUpdated.toISOString().split('T')[0];
      content += `- **${feature.name}** - ${feature.status} (${lastUpdated})\n`;
      if (feature.notes && feature.notes.length > 0) {
        content += `  - ${feature.notes[0]}\n`;
      }
    });
    
    // Write to file
    fs.writeFileSync(reportPath, content, 'utf8');
    
    console.log(`Updated development progress report at ${reportPath}`);
    return true;
  } catch (error) {
    console.error('Error updating development progress report:', error);
    return false;
  }
}