export type Environment = 'develop' | 'sandbox' | 'stable' | 'prodv2'

export interface EnvironmentPreset {
  gateway: string

  serviceHosts?: {
    ips?: string
    dataBoard?: string
  }
}

export const ENVIRONMENTS: Record<Environment, EnvironmentPreset> = {
  develop: {
    gateway: 'https://app-gateway.dev.imbrace.co',
  },
  sandbox: {
    gateway: 'https://app-gateway.sandbox.imbrace.co',
  },
  stable: {
    gateway: 'https://app-gatewayv2.imbrace.co',
  },
  prodv2: {
    gateway: 'https://app-gatewayv2.imbrace.co',
  },
}
