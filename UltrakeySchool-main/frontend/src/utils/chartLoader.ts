// Chart Loader Utility for Dynamic Chart Rendering
import { apiClient } from '../api/client';

// ApexCharts type declaration
declare global {
  interface Window {
    ApexCharts?: any;
  }
}

export interface ChartData {
  series: Array<{
    name: string;
    data: number[];
  }>;
  categories?: string[];
  title?: string;
  subtitle?: string;
}

export interface EmptyStateConfig {
  icon?: string;
  title?: string;
  message?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

class ChartLoader {
  /**
   * Show loading state for chart container
   */
  static showLoadingState(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="chart-loading-state d-flex flex-column align-items-center justify-content-center" style="height: 350px;">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <p class="text-muted mb-0">Loading chart data...</p>
      </div>
    `;
  }

  /**
   * Show empty state for chart container
   */
  static showEmptyState(containerId: string, config?: EmptyStateConfig): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const icon = config?.icon || 'fa-chart-line';
    const title = config?.title || 'No Data Available';
    const message = config?.message || 'Data will appear here once available';
    const action = config?.action;

    let actionHtml = '';
    if (action) {
      actionHtml = `
        <button class="btn btn-primary mt-3" onclick="${action.onClick.toString().replace(/function\s*\(\)\s*{/, '').replace(/}$/, '')}">
          ${action.text}
        </button>
      `;
    }

    container.innerHTML = `
      <div class="chart-empty-state d-flex flex-column align-items-center justify-content-center" style="height: 350px;">
        <i class="fas ${icon} fa-3x text-muted mb-3"></i>
        <h5 class="text-muted mb-2">${title}</h5>
        <p class="text-muted text-center mb-4">${message}</p>
        ${actionHtml}
      </div>
    `;
  }

  /**
   * Show error state for chart container
   */
  static showErrorState(containerId: string, error: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="chart-error-state d-flex flex-column align-items-center justify-content-center" style="height: 350px;">
        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
        <h5 class="text-danger mb-2">Error Loading Data</h5>
        <p class="text-muted text-center mb-4">${error}</p>
        <button class="btn btn-outline-primary" onclick="location.reload()">
          Try Again
        </button>
      </div>
    `;
  }

  /**
   * Load dashboard analytics charts
   */
  static async loadDashboardCharts(): Promise<void> {
    try {
      this.showLoadingState('performance_chart');
      this.showLoadingState('student_statistics_chart');
      this.showLoadingState('revenue_chart');

      const [performanceData, studentData, revenueData] = await Promise.all([
        apiClient.get('/analytics/performance?period=monthly'),
        apiClient.get('/analytics/students'),
        apiClient.get('/analytics/revenue?period=monthly')
      ]);

      // Render performance chart
      if (performanceData.data.success && performanceData.data.data) {
        this.renderPerformanceChart(performanceData.data.data);
      } else {
        this.showEmptyState('performance_chart', {
          title: 'No Performance Data',
          message: 'Performance metrics will appear here once exams and attendance data is available'
        });
      }

      // Render student statistics chart
      if (studentData.data.success && studentData.data.data) {
        this.renderStudentStatisticsChart(studentData.data.data);
      } else {
        this.showEmptyState('student_statistics_chart', {
          title: 'No Student Data',
          message: 'Student statistics will appear here once students are enrolled'
        });
      }

      // Render revenue chart
      if (revenueData.data.success && revenueData.data.data) {
        this.renderRevenueChart(revenueData.data.data);
      } else {
        this.showEmptyState('revenue_chart', {
          title: 'No Revenue Data',
          message: 'Revenue analytics will appear here once fee payments are processed'
        });
      }

    } catch (error) {
      console.error('Failed to load dashboard charts:', error);
      this.showErrorState('performance_chart', error instanceof Error ? error.message : 'Failed to load performance data');
      this.showErrorState('student_statistics_chart', error instanceof Error ? error.message : 'Failed to load student data');
      this.showErrorState('revenue_chart', error instanceof Error ? error.message : 'Failed to load revenue data');
    }
  }

  /**
   * Load admin analytics charts
   */
  static async loadAdminAnalytics(): Promise<void> {
    try {
      this.showLoadingState('institution_growth_chart');
      this.showLoadingState('plan_distribution_chart');
      this.showLoadingState('churn_rate_chart');

      const [growthData, planData, churnData] = await Promise.all([
        apiClient.get('/analytics/institution-growth?period=monthly'),
        apiClient.get('/analytics/plan-distribution'),
        apiClient.get('/analytics/churn-rate')
      ]);

      // Render institution growth chart
      if (growthData.data.success && growthData.data.data) {
        this.renderInstitutionGrowthChart(growthData.data.data);
      } else {
        this.showEmptyState('institution_growth_chart', {
          title: 'No Growth Data',
          message: 'Institution growth metrics will appear here once institutions are created'
        });
      }

      // Render plan distribution chart
      if (planData.data.success && planData.data.data) {
        this.renderPlanDistributionChart(planData.data.data);
      } else {
        this.showEmptyState('plan_distribution_chart', {
          title: 'No Plan Data',
          message: 'Plan distribution will appear here once institutions subscribe to plans'
        });
      }

      // Render churn rate chart
      if (churnData.data.success && churnData.data.data) {
        this.renderChurnRateChart(churnData.data.data);
      } else {
        this.showEmptyState('churn_rate_chart', {
          title: 'No Churn Data',
          message: 'Churn rate analytics will appear here once subscription data is available'
        });
      }

    } catch (error) {
      console.error('Failed to load admin analytics:', error);
      this.showErrorState('institution_growth_chart', error instanceof Error ? error.message : 'Failed to load growth data');
      this.showErrorState('plan_distribution_chart', error instanceof Error ? error.message : 'Failed to load plan data');
      this.showErrorState('churn_rate_chart', error instanceof Error ? error.message : 'Failed to load churn data');
    }
  }

  /**
   * Load teacher-specific charts
   */
  static async loadTeacherCharts(): Promise<void> {
    try {
      this.showLoadingState('teacher_performance_chart');
      this.showLoadingState('class_attendance_chart');

      // Get teacher-specific data
      const [performanceData, attendanceData] = await Promise.all([
        apiClient.get('/analytics/performance?period=monthly'),
        apiClient.get('/analytics/attendance')
      ]);

      // Render teacher performance chart
      if (performanceData.data.success && performanceData.data.data) {
        this.renderTeacherPerformanceChart(performanceData.data.data);
      } else {
        this.showEmptyState('teacher_performance_chart', {
          title: 'No Performance Data',
          message: 'Student performance data will appear here once exams are conducted'
        });
      }

      // Render class attendance chart
      if (attendanceData.data.success && attendanceData.data.data) {
        this.renderClassAttendanceChart(attendanceData.data.data);
      } else {
        this.showEmptyState('class_attendance_chart', {
          title: 'No Attendance Data',
          message: 'Class attendance data will appear here once attendance is marked'
        });
      }

    } catch (error) {
      console.error('Failed to load teacher charts:', error);
      this.showErrorState('teacher_performance_chart', error instanceof Error ? error.message : 'Failed to load performance data');
      this.showErrorState('class_attendance_chart', error instanceof Error ? error.message : 'Failed to load attendance data');
    }
  }

  /**
   * Load student-specific charts
   */
  static async loadStudentCharts(): Promise<void> {
    try {
      this.showLoadingState('student_performance_chart');
      this.showLoadingState('student_attendance_chart');

      // Get student-specific data
      const [performanceData, attendanceData] = await Promise.all([
        apiClient.get('/analytics/performance?period=monthly'),
        apiClient.get('/analytics/attendance')
      ]);

      // Render student performance chart
      if (performanceData.data.success && performanceData.data.data) {
        this.renderStudentPerformanceChart(performanceData.data.data);
      } else {
        this.showEmptyState('student_performance_chart', {
          title: 'No Performance Data',
          message: 'Your performance data will appear here once exams are conducted'
        });
      }

      // Render student attendance chart
      if (attendanceData.data.success && attendanceData.data.data) {
        this.renderStudentAttendanceChart(attendanceData.data.data);
      } else {
        this.showEmptyState('student_attendance_chart', {
          title: 'No Attendance Data',
          message: 'Your attendance data will appear here once attendance is marked'
        });
      }

    } catch (error) {
      console.error('Failed to load student charts:', error);
      this.showErrorState('student_performance_chart', error instanceof Error ? error.message : 'Failed to load performance data');
      this.showErrorState('student_attendance_chart', error instanceof Error ? error.message : 'Failed to load attendance data');
    }
  }

  /**
   * Render performance chart
   */
  private static renderPerformanceChart(data: any): void {
    if (!data.examScores || data.examScores.length === 0) {
      this.showEmptyState('performance_chart', {
        title: 'No Performance Data',
        message: 'Performance metrics will appear here once exams are conducted'
      });
      return;
    }

    const options = {
      chart: {
        type: 'area',
        height: 355,
        toolbar: { show: false }
      },
      series: [{
        name: 'Avg. Exam Score',
        data: data.examScores
      }, {
        name: 'Avg. Attendance',
        data: data.attendance || []
      }],
      xaxis: {
        categories: data.categories || ['Q1', 'Q2', 'Q3', 'Q4', 'Final']
      },
      colors: ['#3b82f6', '#10b981'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      stroke: {
        curve: 'smooth'
      },
      markers: {
        size: 4
      },
      tooltip: {
        x: { format: 'dd/MM/yy HH:mm' }
      }
    };

    this.renderApexChart('performance_chart', options);
  }

  /**
   * Render student statistics chart
   */
  private static renderStudentStatisticsChart(data: any): void {
    if (!data.monthlyData || data.monthlyData.length === 0) {
      this.showEmptyState('student_statistics_chart', {
        title: 'No Student Data',
        message: 'Student statistics will appear here once students are enrolled'
      });
      return;
    }

    const options = {
      chart: {
        type: 'bar',
        height: 355,
        toolbar: { show: false }
      },
      series: [{
        name: 'New Students',
        data: data.monthlyData
      }],
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      colors: ['#3b82f6'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
        }
      }
    };

    this.renderApexChart('student_statistics_chart', options);
  }

  /**
   * Render revenue chart
   */
  private static renderRevenueChart(data: any): void {
    if (!data || data.length === 0) {
      this.showEmptyState('revenue_chart', {
        title: 'No Revenue Data',
        message: 'Revenue analytics will appear here once fee payments are processed'
      });
      return;
    }

    const options = {
      chart: {
        type: 'line',
        height: 355,
        toolbar: { show: false }
      },
      series: [{
        name: 'Revenue',
        data: data.map((item: any) => item.revenue || 0)
      }],
      xaxis: {
        categories: data.map((item: any) => item.month || item.year)
      },
      colors: ['#10b981'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      markers: {
        size: 4
      }
    };

    this.renderApexChart('revenue_chart', options);
  }

  /**
   * Render institution growth chart
   */
  private static renderInstitutionGrowthChart(data: any): void {
    if (!data || data.length === 0) {
      this.showEmptyState('institution_growth_chart', {
        title: 'No Growth Data',
        message: 'Institution growth metrics will appear here once institutions are created'
      });
      return;
    }

    const options = {
      chart: {
        type: 'line',
        height: 355,
        toolbar: { show: false }
      },
      series: [{
        name: 'New Institutions',
        data: data.map((item: any) => item.count || 0)
      }],
      xaxis: {
        categories: data.map((item: any) => item.month || item.year)
      },
      colors: ['#3b82f6'],
      stroke: {
        curve: 'smooth',
        width: 3
      }
    };

    this.renderApexChart('institution_growth_chart', options);
  }

  /**
   * Render plan distribution chart
   */
  private static renderPlanDistributionChart(data: any): void {
    if (!data || data.length === 0) {
      this.showEmptyState('plan_distribution_chart', {
        title: 'No Plan Data',
        message: 'Plan distribution will appear here once institutions subscribe to plans'
      });
      return;
    }

    const options = {
      chart: {
        type: 'donut',
        height: 355
      },
      series: data.map((item: any) => item.count || 0),
      labels: data.map((item: any) => item.plan || 'Unknown'),
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' }
        }
      }]
    };

    this.renderApexChart('plan_distribution_chart', options);
  }

  /**
   * Render churn rate chart
   */
  private static renderChurnRateChart(data: any): void {
    if (!data || !data.monthly || data.monthly.length === 0) {
      this.showEmptyState('churn_rate_chart', {
        title: 'No Churn Data',
        message: 'Churn rate analytics will appear here once subscription data is available'
      });
      return;
    }

    const options = {
      chart: {
        type: 'area',
        height: 355,
        toolbar: { show: false }
      },
      series: [{
        name: 'Churn Rate (%)',
        data: data.monthly.map((item: any) => item.rate || 0)
      }],
      xaxis: {
        categories: data.monthly.map((item: any) => item.month)
      },
      colors: ['#ef4444'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      }
    };

    this.renderApexChart('churn_rate_chart', options);
  }

  /**
   * Render teacher performance chart
   */
  private static renderTeacherPerformanceChart(data: any): void {
    if (!data.examScores || data.examScores.length === 0) {
      this.showEmptyState('teacher_performance_chart', {
        title: 'No Performance Data',
        message: 'Student performance data will appear here once exams are conducted'
      });
      return;
    }

    const options = {
      chart: {
        type: 'bar',
        height: 355,
        toolbar: { show: false }
      },
      series: [{
        name: 'Class Average',
        data: data.examScores
      }],
      xaxis: {
        categories: data.categories || ['Q1', 'Q2', 'Q3', 'Q4', 'Final']
      },
      colors: ['#3b82f6'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
        }
      }
    };

    this.renderApexChart('teacher_performance_chart', options);
  }

  /**
   * Render class attendance chart
   */
  private static renderClassAttendanceChart(data: any): void {
    if (!data || !data.attendanceRate) {
      this.showEmptyState('class_attendance_chart', {
        title: 'No Attendance Data',
        message: 'Class attendance data will appear here once attendance is marked'
      });
      return;
    }

    const options = {
      chart: {
        type: 'radialBar',
        height: 355
      },
      series: [data.attendanceRate || 0],
      labels: ['Attendance Rate'],
      colors: ['#10b981'],
      plotOptions: {
        radialBar: {
          hollow: { size: '70%' },
          dataLabels: {
            name: { fontSize: '16px' },
            value: { fontSize: '24px' }
          }
        }
      }
    };

    this.renderApexChart('class_attendance_chart', options);
  }

  /**
   * Render student performance chart
   */
  private static renderStudentPerformanceChart(data: any): void {
    if (!data.examScores || data.examScores.length === 0) {
      this.showEmptyState('student_performance_chart', {
        title: 'No Performance Data',
        message: 'Your performance data will appear here once exams are conducted'
      });
      return;
    }

    const options = {
      chart: {
        type: 'line',
        height: 355,
        toolbar: { show: false }
      },
      series: [{
        name: 'Your Score',
        data: data.examScores
      }],
      xaxis: {
        categories: data.categories || ['Q1', 'Q2', 'Q3', 'Q4', 'Final']
      },
      colors: ['#3b82f6'],
      stroke: {
        curve: 'smooth',
        width: 3
      }
    };

    this.renderApexChart('student_performance_chart', options);
  }

  /**
   * Render student attendance chart
   */
  private static renderStudentAttendanceChart(data: any): void {
    if (!data || !data.attendanceRate) {
      this.showEmptyState('student_attendance_chart', {
        title: 'No Attendance Data',
        message: 'Your attendance data will appear here once attendance is marked'
      });
      return;
    }

    const options = {
      chart: {
        type: 'radialBar',
        height: 355
      },
      series: [data.attendanceRate || 0],
      labels: ['Your Attendance'],
      colors: ['#10b981'],
      plotOptions: {
        radialBar: {
          hollow: { size: '70%' },
          dataLabels: {
            name: { fontSize: '16px' },
            value: { fontSize: '24px' }
          }
        }
      }
    };

    this.renderApexChart('student_attendance_chart', options);
  }

  /**
   * Render ApexCharts chart
   */
  private static renderApexChart(containerId: string, options: any): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Check if ApexCharts is available
    if (typeof window.ApexCharts !== 'undefined') {
      const chart = new window.ApexCharts(container, options);
      chart.render();
    } else {
      console.error('ApexCharts not found. Please ensure it is loaded.');
      this.showErrorState(containerId, 'Chart library not available');
    }
  }

  /**
   * Initialize all chart loaders based on user role
   */
  static async initializeCharts(_p0: { performance_chart: { type: string; endpoint: string; timeRange: string; }; student_statistics_chart: { type: string; endpoint: string; timeRange: string; }; revenue_chart: { type: string; endpoint: string; timeRange: string; }; institution_growth_chart: { type: string; endpoint: string; timeRange: string; }; plan_distribution_chart: { type: string; endpoint: string; }; churn_rate_chart: { type: string; endpoint: string; timeRange: string; }; }): Promise<void> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user || !user.role) {
      console.warn('User role not found, showing default charts');
      await this.loadDashboardCharts();
      return;
    }

    switch (user.role) {
      case 'admin':
      case 'super_admin':
        await this.loadAdminAnalytics();
        break;
      case 'teacher':
        await this.loadTeacherCharts();
        break;
      case 'student':
        await this.loadStudentCharts();
        break;
      default:
        await this.loadDashboardCharts();
        break;
    }
  }
}

export default ChartLoader;