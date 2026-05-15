import User from '../models/User.js';

class ThemeService {
  /**
   * Get user theme preferences
   */
  async getUserTheme(userId) {
    const user = await User.findById(userId).select('preferences');
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      theme: user.preferences?.theme || 'light',
      colorScheme: user.preferences?.colorScheme || 'blue',
      fontSize: user.preferences?.fontSize || 'medium',
      language: user.preferences?.language || 'en',
      notifications: user.preferences?.notifications || {
        email: true,
        sms: true,
        push: true
      },
      accessibility: user.preferences?.accessibility || {
        highContrast: false,
        reducedMotion: false,
        screenReader: false
      }
    };
  }

  /**
   * Update user theme preferences
   */
  async updateUserTheme(userId, themeData) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Update preferences
    user.preferences = {
      ...user.preferences,
      ...themeData
    };

    await user.save();

    return {
      theme: user.preferences.theme,
      colorScheme: user.preferences.colorScheme,
      fontSize: user.preferences.fontSize,
      language: user.preferences.language,
      notifications: user.preferences.notifications,
      accessibility: user.preferences.accessibility
    };
  }

  /**
   * Get system theme configuration
   */
  async getSystemTheme(schoolId) {
    // Get school-specific theme configuration
    const Institution = (await import('../models/Institution.js')).default;
    const institution = await Institution.findById(schoolId);

    if (!institution) {
      throw new Error('Institution not found');
    }

    return {
      primaryColor: institution.branding?.primaryColor || '#3b82f6',
      secondaryColor: institution.branding?.secondaryColor || '#64748b',
      logo: institution.branding?.logo || null,
      favicon: institution.branding?.favicon || null,
      customCSS: institution.branding?.customCSS || null,
      fontFamily: institution.branding?.fontFamily || 'Inter'
    };
  }

  /**
   * Update system theme configuration
   */
  async updateSystemTheme(schoolId, themeData) {
    const Institution = (await import('../models/Institution.js')).default;
    const institution = await Institution.findById(schoolId);

    if (!institution) {
      throw new Error('Institution not found');
    }

    institution.branding = {
      ...institution.branding,
      ...themeData
    };

    await institution.save();

    return institution.branding;
  }

  /**
   * Get available themes
   */
  getAvailableThemes() {
    return {
      themes: [
        { id: 'light', name: 'Light', description: 'Clean and bright interface' },
        { id: 'dark', name: 'Dark', description: 'Easy on the eyes' },
        { id: 'auto', name: 'Auto', description: 'Follows system preference' }
      ],
      colorSchemes: [
        { id: 'blue', name: 'Blue', color: '#3b82f6' },
        { id: 'green', name: 'Green', color: '#22c55e' },
        { id: 'purple', name: 'Purple', color: '#a855f7' },
        { id: 'orange', name: 'Orange', color: '#f59e0b' },
        { id: 'red', name: 'Red', color: '#ef4444' }
      ],
      fontSizes: [
        { id: 'small', name: 'Small', size: '14px' },
        { id: 'medium', name: 'Medium', size: '16px' },
        { id: 'large', name: 'Large', size: '18px' },
        { id: 'xlarge', name: 'Extra Large', size: '20px' }
      ],
      languages: [
        { id: 'en', name: 'English', nativeName: 'English' },
        { id: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
        { id: 'mr', name: 'Marathi', nativeName: 'मराठी' },
        { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
        { id: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
        { id: 'bn', name: 'Bengali', nativeName: 'বাংলা' }
      ]
    };
  }

  /**
   * Get design tokens
   */
  getDesignTokens() {
    return {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706'
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626'
        }
      },
      spacing: {
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem'
      },
      borderRadius: {
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }
    };
  }
}

export default new ThemeService();
