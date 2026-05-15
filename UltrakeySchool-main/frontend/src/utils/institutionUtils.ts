export type InstitutionRouteType = 'schools' | 'inter-colleges' | 'degree-colleges' | 'engineering-colleges';
export type InstitutionAPIType = 'School' | 'Inter College' | 'Degree College' | 'Engineering College';

export interface InstitutionConfig {
  routeType: InstitutionRouteType;
  apiType: InstitutionAPIType;
  name: string;
  singularName: string;
  icon: string;
  basePath: string;
}

/**
 * Institution configuration mapping
 * Maps frontend route types to backend API types and UI configuration
 */
export const INSTITUTION_CONFIGS: Record<InstitutionRouteType, InstitutionConfig> = {
  'schools': {
    routeType: 'schools',
    apiType: 'School',
    name: 'Schools',
    singularName: 'School',
    icon: 'ti ti-school',
    basePath: '/super-admin/institutions/schools'
  },
  'inter-colleges': {
    routeType: 'inter-colleges',
    apiType: 'Inter College',
    name: 'Inter Colleges',
    singularName: 'Inter College',
    icon: 'ti ti-building-community',
    basePath: '/super-admin/institutions/inter-colleges'
  },
  'degree-colleges': {
    routeType: 'degree-colleges',
    apiType: 'Degree College',
    name: 'Degree Colleges',
    singularName: 'Degree College',
    icon: 'ti ti-building',
    basePath: '/super-admin/institutions/degree-colleges'
  },
  'engineering-colleges': {
    routeType: 'engineering-colleges',
    apiType: 'Engineering College',
    name: 'Engineering Colleges',
    singularName: 'Engineering College',
    icon: 'ti ti-tools',
    basePath: '/super-admin/institutions/engineering-colleges'
  }
};

/**
 * Convert frontend route type to backend API type
 * @param routeType - Frontend route type (e.g., 'schools')
 * @returns Backend API type (e.g., 'School')
 */
export const routeTypeToAPIType = (routeType: InstitutionRouteType): InstitutionAPIType => {
  return INSTITUTION_CONFIGS[routeType].apiType;
};

/**
 * Convert backend API type to frontend route type
 * @param apiType - Backend API type (e.g., 'School')
 * @returns Frontend route type (e.g., 'schools')
 */
export const apiTypeToRouteType = (apiType: InstitutionAPIType): InstitutionRouteType => {
  const entry = Object.entries(INSTITUTION_CONFIGS).find(
    ([_, config]) => config.apiType === apiType
  );
  if (!entry) {
    throw new Error(`Unknown API type: ${apiType}`);
  }
  return entry[0] as InstitutionRouteType;
};

/**
 * Extract institution type from URL path
 * @param pathname - URL pathname
 * @returns Institution route type or null
 */
export const getInstitutionTypeFromPath = (pathname: string): InstitutionRouteType | null => {
  if (pathname.includes('/engineering')) return 'engineering-colleges';
  if (pathname.includes('/inter-colleges')) return 'inter-colleges';
  if (pathname.includes('/degree-colleges')) return 'degree-colleges';
  if (pathname.includes('/schools')) return 'schools';
  return null;
};

/**
 * Get institution config from URL path
 * @param pathname - URL pathname
 * @returns Institution configuration or null
 */
export const getInstitutionConfigFromPath = (pathname: string): InstitutionConfig | null => {
  const type = getInstitutionTypeFromPath(pathname);
  return type ? INSTITUTION_CONFIGS[type] : null;
};

/**
 * Get institution config from route type
 * @param routeType - Frontend route type
 * @returns Institution configuration
 */
export const getInstitutionConfig = (routeType: InstitutionRouteType): InstitutionConfig => {
  return INSTITUTION_CONFIGS[routeType];
};

/**
 * Get breadcrumb items for institution pages
 * @param routeType - Frontend route type
 * @param id - Optional institution ID
 * @param action - Optional action (e.g., 'edit', 'view')
 * @returns Array of breadcrumb items
 */
export const getInstitutionBreadcrumbs = (
  routeType: InstitutionRouteType,
  id?: string,
  action?: string
) => {
  const config = INSTITUTION_CONFIGS[routeType];
  const breadcrumbs = [
    { label: 'Dashboard', path: '/super-admin/dashboard' },
    { label: 'Institutions', path: '/super-admin/institutions' },
    { label: config.name, path: config.basePath }
  ];

  if (id) {
    breadcrumbs.push({
      label: `${config.singularName} Details`,
      path: `${config.basePath}/${id}`
    });
  }

  if (action) {
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    breadcrumbs.push({
      label: actionLabel,
      path: `${config.basePath}/${id}/${action}`
    });
  }

  return breadcrumbs;
};

/**
 * Get all institution route types
 * @returns Array of all institution route types
 */
export const getAllInstitutionTypes = (): InstitutionRouteType[] => {
  return Object.keys(INSTITUTION_CONFIGS) as InstitutionRouteType[];
};

/**
 * Get all institution API types
 * @returns Array of all institution API types
 */
export const getAllInstitutionAPITypes = (): InstitutionAPIType[] => {
  return Object.values(INSTITUTION_CONFIGS).map(config => config.apiType);
};

/**
 * Validate if a string is a valid institution route type
 * @param type - String to validate
 * @returns True if valid route type
 */
export const isValidRouteType = (type: string): type is InstitutionRouteType => {
  return ['schools', 'inter-colleges', 'degree-colleges', 'engineering-colleges'].includes(type);
};

/**
 * Validate if a string is a valid institution API type
 * @param type - String to validate
 * @returns True if valid API type
 */
export const isValidAPIType = (type: string): type is InstitutionAPIType => {
  return ['School', 'Inter College', 'Degree College', 'Engineering College'].includes(type);
};

/**
 * Get institution display name from route type
 * @param routeType - Frontend route type
 * @param singular - Whether to return singular form
 * @returns Display name
 */
export const getInstitutionDisplayName = (
  routeType: InstitutionRouteType,
  singular: boolean = false
): string => {
  const config = INSTITUTION_CONFIGS[routeType];
  return singular ? config.singularName : config.name;
};

/**
 * Get institution icon class from route type
 * @param routeType - Frontend route type
 * @returns Icon class name
 */
export const getInstitutionIcon = (routeType: InstitutionRouteType): string => {
  return INSTITUTION_CONFIGS[routeType].icon;
};

/**
 * Build institution detail path
 * @param routeType - Frontend route type
 * @param id - Institution ID
 * @returns Full path to institution detail page
 */
export const buildInstitutionPath = (routeType: InstitutionRouteType, id: string): string => {
  const config = INSTITUTION_CONFIGS[routeType];
  return `${config.basePath}/${id}`;
};

/**
 * Build institution action path
 * @param routeType - Frontend route type
 * @param id - Institution ID
 * @param action - Action name
 * @returns Full path to institution action page
 */
export const buildInstitutionActionPath = (
  routeType: InstitutionRouteType,
  id: string,
  action: string
): string => {
  const config = INSTITUTION_CONFIGS[routeType];
  return `${config.basePath}/${id}/${action}`;
};

export default {
  INSTITUTION_CONFIGS,
  routeTypeToAPIType,
  apiTypeToRouteType,
  getInstitutionTypeFromPath,
  getInstitutionConfigFromPath,
  getInstitutionDisplayName,
  getInstitutionIcon,
  buildInstitutionPath,
  buildInstitutionActionPath
};
