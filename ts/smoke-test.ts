import { ImbraceClient } from './src/client';

console.log('=== [DEV ENV] TS SDK VALIDATION ===');

const client = new ImbraceClient({
  env: 'develop',
});

const services = {
  auth: (client.auth as any).base,
  platform: (client.platform as any).base,
  channel: (client.channel as any).base,
  ips: (client.ips as any).base,
  dataBoard: (client.boards as any).base,
  ai: (client.ai as any).base,
  marketplace: (client.marketplace as any).base,
};

console.table(services);

const devGateway = 'https://app-gateway.dev.imbrace.co';
const isPassed =
  services.auth.startsWith(`${devGateway}/platform`) &&
  services.ips === `${devGateway}/ips/v1` &&
  services.channel.startsWith(`${devGateway}/channel-service`);

if (isPassed) {
  console.log('✅ TS SDK: Develop Environment Configuration is STABLE.');
} else {
  console.log('❌ TS SDK: Develop Environment Configuration is INVALID.');
  process.exit(1);
}
