export type MonitoringAutoRefreshState = {
  isCurrentLayer: boolean;
  documentVisible: boolean;
  connectionStatus: string;
  autoRefreshMs: string;
  monitoringLoading: boolean;
  monitoringScopeTransitioning: boolean;
};

export const resolveMonitoringAutoRefreshDelay = ({
  isCurrentLayer,
  documentVisible,
  connectionStatus,
  autoRefreshMs,
  monitoringLoading,
  monitoringScopeTransitioning,
}: MonitoringAutoRefreshState) => {
  const delay = Number(autoRefreshMs);
  if (
    !isCurrentLayer ||
    !documentVisible ||
    connectionStatus !== 'connected' ||
    !Number.isFinite(delay) ||
    delay <= 0 ||
    monitoringLoading ||
    monitoringScopeTransitioning
  ) {
    return null;
  }
  return delay;
};
