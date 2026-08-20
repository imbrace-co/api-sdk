import { ImbraceClient } from '../src/client';
import { ENVIRONMENTS } from '../src/environments';

describe('SDK Environment & ServiceRegistry Deep Test', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  test('Should resolve URLs correctly for DEVELOP environment', () => {
    const client = new ImbraceClient({ env: 'develop' });
    
    // Platform service should use develop gateway
    expect((client.auth as any).base).toBe('https://app-gateway.dev.imbrace.co/platform');
    
    // IPS service routes through gateway on all environments
    expect((client.ips as any).base).toBe('https://app-gateway.dev.imbrace.co/ips/v1');
    
    // AI service should use develop gateway
    expect((client.ai as any).base).toBe('https://app-gateway.dev.imbrace.co/ai');
  });

  test('Should resolve URLs correctly for STABLE (Enterprise) environment', () => {
    const client = new ImbraceClient({ env: 'stable' });
    
    // All services should use stable gateway
    expect((client.auth as any).base).toBe('https://app-gateway.imbrace.co/platform');
    expect((client.ips as any).base).toBe('https://app-gateway.imbrace.co/ips/v1');
  });

  test('Should allow overriding specific service URL via constructor', () => {
    const client = new ImbraceClient({
      services: {
        dataBoard: 'http://localhost:9999/custom-analytics'
      }
    });
    
    expect((client.boards as any).base).toBe('http://localhost:9999/custom-analytics');
    // Other services remain default
    expect((client.auth as any).base).toBe('https://app-gateway.imbrace.co/platform');
  });
});
