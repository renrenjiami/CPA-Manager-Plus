import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUsageData } from './useUsageData';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  prices: vi.fn(async () => ({ prices: {} })),
  aliases: vi.fn(async () => ({ items: [] })),
}));

vi.mock('@/stores', () => ({
  useAuthStore: (selector: (state: { managementKey: string }) => unknown) =>
    selector({ managementKey: 'fixture-key' }),
}));
vi.mock('@/hooks/usePanelFeatureAvailability', () => ({
  usePanelFeatureAvailability: () => ({
    managerServiceAvailable: true,
    modelPricesAvailable: true,
    requestMonitoringAvailable: true,
    managerServiceBase: 'http://fixture.local',
  }),
}));
vi.mock('@/services/api/usageService', () => ({
  usageServiceApi: { getModelPrices: mocks.prices, getApiKeyAliases: mocks.aliases },
}));
vi.mock('@/utils/usage', () => ({
  loadModelPrices: () => ({}),
  clearModelPrices: vi.fn(),
  saveModelPrices: vi.fn(),
}));

let renderer: ReactTestRenderer | undefined;
function Probe({ load }: { load?: boolean }) {
  useUsageData({ loadUsageEvents: false, loadModelPriceBook: load });
  return null;
}
beforeEach(() => vi.clearAllMocks());
afterEach(async () => {
  if (renderer) await act(async () => renderer?.unmount());
  renderer = undefined;
});

describe('optional model price book', () => {
  it('keeps analytics metadata loading without downloading the price book', async () => {
    await act(async () => { renderer = create(<Probe load={false} />); });
    expect(mocks.prices).not.toHaveBeenCalled();
    expect(mocks.aliases).toHaveBeenCalledOnce();
  });
  it('preserves loading for the price editor and realtime callers', async () => {
    await act(async () => { renderer = create(<Probe />); });
    expect(mocks.prices).toHaveBeenCalledOnce();
  });
  it('loads the book when entering realtime after an analytics-only view', async () => {
    await act(async () => { renderer = create(<Probe load={false} />); });
    await act(async () => { renderer?.update(<Probe load />); });
    expect(mocks.prices).toHaveBeenCalledOnce();
  });
});
