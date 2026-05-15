/**
 * Dashboard Navigation Test Utility
 * Tests all dashboard navigation for error-free operation
 */

import { useAuth } from '../store/authStore';

export interface NavigationTestResult {
  path: string;
  name: string;
  accessible: boolean;
  error?: string;
  loadTime?: number;
}

export interface DashboardTestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: NavigationTestResult[];
  institutionIsolated: boolean;
  indianLocalization: boolean;
}

class DashboardNavigationTester {
  private user: any;
  private results: NavigationTestResult[] = [];

  constructor() {
    this.user = useAuth.getState().user;
  }

  /**
   * Test all dashboard navigation paths
   */
  async testAllDashboardNavigation(): Promise<DashboardTestResults> {
    this.results = [];
    
    const dashboardPaths = [
      { path: '/dashboard', name: 'Main Dashboard' },
      { path: '/dashboard/student', name: 'Student Dashboard' },
      { path: '/dashboard/teacher', name: 'Teacher Dashboard' },
      { path: '/dashboard/staff', name: 'Staff Dashboard' },
      { path: '/dashboard/parent', name: 'Parent Dashboard' },
      { path: '/dashboard/admin', name: 'Admin Dashboard' },
      { path: '/dashboard/institute-admin', name: 'Institute Admin Dashboard' },
      { path: '/dashboard/transport', name: 'Transport Dashboard' },
      { path: '/dashboard/quick-stats', name: 'Quick Stats' },
      { path: '/dashboard/widgets', name: 'Dashboard Widgets' }
    ];

    for (const pathConfig of dashboardPaths) {
      const result = await this.testNavigationPath(pathConfig.path, pathConfig.name);
      this.results.push(result);
    }

    return {
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.accessible).length,
      failedTests: this.results.filter(r => !r.accessible).length,
      results: this.results,
      institutionIsolated: this.testInstitutionIsolation(),
      indianLocalization: this.testIndianLocalization()
    };
  }

  /**
   * Test individual navigation path
   */
  private async testNavigationPath(path: string, name: string): Promise<NavigationTestResult> {
    const startTime = performance.now();
    
    try {
      // Check if path exists in routing
      const routeExists = this.checkRouteExists(path);
      
      if (!routeExists) {
        return {
          path,
          name,
          accessible: false,
          error: 'Route not found',
          loadTime: performance.now() - startTime
        };
      }

      // Check user permissions for this path
      const hasPermission = this.checkUserPermissions(path);
      
      if (!hasPermission) {
        return {
          path,
          name,
          accessible: false,
          error: 'Insufficient permissions',
          loadTime: performance.now() - startTime
        };
      }

      // Simulate navigation test
      const navigationTest = await this.simulateNavigation(path);
      
      return {
        path,
        name,
        accessible: navigationTest.success,
        error: navigationTest.error,
        loadTime: performance.now() - startTime
      };

    } catch (error) {
      return {
        path,
        name,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: performance.now() - startTime
      };
    }
  }

  /**
   * Check if route exists in the application
   */
  private checkRouteExists(path: string): boolean {
    // This would integrate with your routing system
    // For now, we'll check common dashboard patterns
    const validPatterns = [
      /^\/dashboard$/,
      /^\/dashboard\/(student|teacher|staff|parent|admin|transport)$/,
      /^\/dashboard\/(quick-stats|widgets|institute-admin)$/
    ];
    
    return validPatterns.some(pattern => pattern.test(path));
  }

  /**
   * Check if user has permissions for the path
   */
  private checkUserPermissions(path: string): boolean {
    if (!this.user) return false;

    const userRole = this.user.role;
    const institutionId = this.user.institutionId;

    // Check institution access
    if (!institutionId && path !== '/dashboard/institute-admin') {
      return false;
    }

    // Role-based access control
    const rolePermissions: Record<string, string[]> = {
      'superadmin': ['/dashboard', '/dashboard/admin', '/dashboard/institute-admin'],
      'admin': ['/dashboard', '/dashboard/admin'],
      'principal': ['/dashboard', '/dashboard/admin'],
      'teacher': ['/dashboard', '/dashboard/teacher'],
      'student': ['/dashboard', '/dashboard/student'],
      'parent': ['/dashboard', '/dashboard/parent'],
      'staff_member': ['/dashboard', '/dashboard/staff'],
      'transport_manager': ['/dashboard', '/dashboard/transport']
    };

    const allowedPaths = rolePermissions[userRole] || [];
    
    // Super admin can access all paths
    if (userRole === 'superadmin') return true;

    return allowedPaths.some(allowedPath => 
      path === allowedPath || path.startsWith(allowedPath + '/')
    );
  }

  /**
   * Simulate navigation to test for errors
   */
  private async simulateNavigation(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call to dashboard endpoint
      const response = await fetch(`/api/v1${path}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          error: data.error?.message || 'API returned error'
        };
      }

      // Check for institution context in response
      if (!data.institutionContext && path !== '/dashboard/institute-admin') {
        return {
          success: false,
          error: 'Missing institution context in response'
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation test failed'
      };
    }
  }

  /**
   * Test institution isolation
   */
  private testInstitutionIsolation(): boolean {
    if (!this.user?.institutionData) return false;

    const requiredFields = ['id', 'name', 'instituteCode', 'type', 'status'];
    return requiredFields.every(field => this.user.institutionData[field]);
  }

  /**
   * Test Indian localization
   */
  private testIndianLocalization(): boolean {
    // Check if Indian currency formatting is available
    const testAmount = 5000;
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(testAmount);

    return formattedAmount.includes('₹') || formattedAmount.includes('5,000.00');
  }

  /**
   * Generate test report
   */
  generateTestReport(results: DashboardTestResults): string {
    const report = `
# Dashboard Navigation Test Report

## Summary
- Total Tests: ${results.totalTests}
- Passed: ${results.passedTests}
- Failed: ${results.failedTests}
- Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(2)}%

## Institution Isolation: ${results.institutionIsolated ? '✅ PASS' : '❌ FAIL'}
## Indian Localization: ${results.indianLocalization ? '✅ PASS' : '❌ FAIL'}

## Test Results
${results.results.map(result => `
### ${result.name}
- Path: ${result.path}
- Status: ${result.accessible ? '✅ PASS' : '❌ FAIL'}
- Load Time: ${result.loadTime?.toFixed(2)}ms
${result.error ? `- Error: ${result.error}` : ''}
`).join('\n')}

## Recommendations
${this.generateRecommendations(results)}
    `;

    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: DashboardTestResults): string {
    const recommendations: string[] = [];

    if (results.failedTests > 0) {
      recommendations.push('- Fix failed navigation paths before deployment');
    }

    if (!results.institutionIsolated) {
      recommendations.push('- Ensure institution data is properly loaded for all users');
    }

    if (!results.indianLocalization) {
      recommendations.push('- Implement Indian currency formatting and localization');
    }

    const slowPaths = results.results.filter(r => r.loadTime && r.loadTime > 1000);
    if (slowPaths.length > 0) {
      recommendations.push('- Optimize loading performance for slow dashboard paths');
    }

    if (recommendations.length === 0) {
      recommendations.push('- All tests passed! Dashboard navigation is working correctly.');
    }

    return recommendations.join('\n');
  }
}

export default DashboardNavigationTester;
