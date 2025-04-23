import { useQuery } from '@tanstack/react-query';
import { Setting } from '@shared/schema';

// Default ROI parameters to use as fallbacks
const DEFAULT_ROI_PARAMS = {
  agent_hourly_cost: 25,
  implementation_cost_min: 15000,
  implementation_cost_max: 100000,
  maintenance_pct: 15,
  automation_rate_base: 5,
  automation_rate_scale: 25,
  csat_improvement_base: 5,
  csat_improvement_scale: 20,
};

export interface ROIParameters {
  agent_hourly_cost: number;
  implementation_cost_min: number;
  implementation_cost_max: number;
  maintenance_pct: number;
  automation_rate_base: number; 
  automation_rate_scale: number;
  csat_improvement_base: number;
  csat_improvement_scale: number;
}

/**
 * Hook to get ROI calculation parameters
 * @returns ROI parameters from settings or defaults if not found
 */
export function useROIParameters(): { 
  data: ROIParameters; 
  isLoading: boolean; 
  error: Error | null 
} {
  const { 
    data: settings = [], 
    isLoading, 
    error 
  } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
  });

  // Convert settings to ROI parameters
  const getSettingValue = (key: string, defaultValue: number): number => {
    const setting = settings.find(s => s.key === `roi_${key}`);
    if (!setting?.value) return defaultValue;
    return parseFloat(setting.value) || defaultValue;
  };

  const roiParams: ROIParameters = {
    agent_hourly_cost: getSettingValue('agent_hourly_cost', DEFAULT_ROI_PARAMS.agent_hourly_cost),
    implementation_cost_min: getSettingValue('implementation_cost_min', DEFAULT_ROI_PARAMS.implementation_cost_min),
    implementation_cost_max: getSettingValue('implementation_cost_max', DEFAULT_ROI_PARAMS.implementation_cost_max),
    maintenance_pct: getSettingValue('maintenance_pct', DEFAULT_ROI_PARAMS.maintenance_pct),
    automation_rate_base: getSettingValue('automation_rate_base', DEFAULT_ROI_PARAMS.automation_rate_base),
    automation_rate_scale: getSettingValue('automation_rate_scale', DEFAULT_ROI_PARAMS.automation_rate_scale),
    csat_improvement_base: getSettingValue('csat_improvement_base', DEFAULT_ROI_PARAMS.csat_improvement_base),
    csat_improvement_scale: getSettingValue('csat_improvement_scale', DEFAULT_ROI_PARAMS.csat_improvement_scale),
  };

  return {
    data: roiParams,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Calculate time saved per month based on interaction volume
 */
export function calculateTimeSaved(
  interactionVolume: string,
  aiGoalsCount: number,
  roiParams: ROIParameters
): { min: number; max: number } {
  // Base hours saved per month based on interaction volume
  let baseHoursSaved = {
    '0-1000': { min: 40, max: 80 },
    '1000-5000': { min: 80, max: 200 },
    '5000-10000': { min: 200, max: 500 },
    '10000-50000': { min: 500, max: 1000 },
    '50000+': { min: 1000, max: 2000 },
  }[interactionVolume] || { min: 40, max: 80 };

  // Scale based on number of AI goals (use cases)
  const goalMultiplier = 1 + ((aiGoalsCount - 1) * 0.2); // Each additional goal adds 20%
  
  return {
    min: Math.round(baseHoursSaved.min * goalMultiplier),
    max: Math.round(baseHoursSaved.max * goalMultiplier)
  };
}

/**
 * Calculate agent replacement cost savings
 */
export function calculateCostSavings(
  hoursSaved: { min: number; max: number },
  roiParams: ROIParameters
): { min: number; max: number } {
  // Annual hours saved (monthly × 12)
  const annualHoursSaved = {
    min: hoursSaved.min * 12,
    max: hoursSaved.max * 12
  };
  
  return {
    min: Math.round(annualHoursSaved.min * roiParams.agent_hourly_cost),
    max: Math.round(annualHoursSaved.max * roiParams.agent_hourly_cost)
  };
}

/**
 * Calculate implementation costs based on AI goals
 */
export function calculateImplementationCost(
  aiGoalsCount: number,
  roiParams: ROIParameters
): { min: number; max: number } {
  // Base costs adjusted for complexity (number of goals)
  const complexityFactor = aiGoalsCount / 3; // Normalize by 3 use cases
  
  return {
    min: Math.round(roiParams.implementation_cost_min * Math.max(0.5, Math.min(1.5, complexityFactor))),
    max: Math.round(roiParams.implementation_cost_max * Math.max(0.5, Math.min(1.5, complexityFactor)))
  };
}

/**
 * Calculate maintenance costs
 */
export function calculateMaintenanceCost(
  implementationCost: { min: number; max: number },
  roiParams: ROIParameters
): { min: number; max: number } {
  return {
    min: Math.round(implementationCost.min * (roiParams.maintenance_pct / 100)),
    max: Math.round(implementationCost.max * (roiParams.maintenance_pct / 100))
  };
}

/**
 * Calculate customer satisfaction improvement
 */
export function calculateCSATImprovement(
  successMetrics: string[],
  roiParams: ROIParameters
): { min: number; max: number } {
  let baseCsat = {
    min: roiParams.csat_improvement_base,
    max: roiParams.csat_improvement_scale
  };
  
  // Adjust based on specific metrics
  if (successMetrics.includes('csat-improvement')) {
    baseCsat.min += 10;
    baseCsat.max += 5;
  }
  
  if (successMetrics.includes('faster-resolutions')) {
    baseCsat.min += 5;
    baseCsat.max += 3;
  }
  
  if (successMetrics.includes('24-7-coverage')) {
    baseCsat.min += 3;
    baseCsat.max += 2;
  }
  
  return baseCsat;
}

/**
 * Calculate payback period in months
 */
export function calculatePaybackPeriod(
  implementationCost: { min: number; max: number },
  costSavings: { min: number; max: number }
): { min: number; max: number } {
  // Monthly cost savings
  const monthlySavings = {
    min: costSavings.min / 12,
    max: costSavings.max / 12
  };
  
  return {
    // Min payback period uses max savings and min cost
    min: Math.ceil(implementationCost.min / monthlySavings.max),
    // Max payback period uses min savings and max cost
    max: Math.ceil(implementationCost.max / monthlySavings.min)
  };
}

/**
 * Format currency values
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a range of values
 */
export function formatRange(min: number, max: number, suffix: string = ''): string {
  if (min === max) return `${min}${suffix}`;
  return `${min}-${max}${suffix}`;
}