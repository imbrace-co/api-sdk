/**
 * The iMBrace environments a client can target:
 * - `cloud`: the production cloud (`cloud.imbrace.co`), the default
 * - `sandbox`: for trying things out
 * - `develop`: the development environment
 *
 * `stable` and `prodv2` are older names for `cloud`: same gateway, kept so
 * existing code keeps working. Use `cloud` in new code.
 */
export type Environment = 'cloud' | 'sandbox' | 'develop' | 'stable' | 'prodv2'

export interface EnvironmentPreset {
  gateway: string

  serviceHosts?: {
    ips?: string
    dataBoard?: string
  }
}

const CLOUD: EnvironmentPreset = { gateway: 'https://app-gatewayv2.imbrace.co' }

export const ENVIRONMENTS: Record<Environment, EnvironmentPreset> = {
  cloud: CLOUD,
  sandbox: {
    gateway: 'https://app-gateway.sandbox.imbrace.co',
  },
  develop: {
    gateway: 'https://app-gateway.dev.imbrace.co',
  },
  /** @deprecated Same as `cloud`. */
  stable: CLOUD,
  /** @deprecated Same as `cloud`. */
  prodv2: CLOUD,
}
