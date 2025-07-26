import api from './api';

export interface UsageStatsSummary {
  apiCalls: number;
  downloads: number;
  storageUsed: number;
  activeProjects: number;
  apiCallsChange: number;
  downloadsChange: number;
}

export interface DailyStat {
  date: string;
  apiCalls: number;
  downloads: number;
  dataTransferred: number;
}

export interface ActivityEntry {
  id: string;
  type: 'api_call' | 'download' | 'upload' | 'project_created';
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface UsageStatsResponse {
  summary: UsageStatsSummary;
  dailyStats: DailyStat[];
  recentActivity: ActivityEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UsageStatsParams {
  period?: '7d' | '30d' | '90d';
  page?: number;
  limit?: number;
}

const UsageService = {
  // Get usage statistics for current developer
  getUsageStats: async (params: UsageStatsParams = {}): Promise<UsageStatsResponse> => {
    const { period = '30d', page = 1, limit = 20 } = params;
    const response = await api.get('/developer/usage-stats', {
      params: { period, page, limit }
    });
    return response.data.data;
  },
};

export default UsageService;