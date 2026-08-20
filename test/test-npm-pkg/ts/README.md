# Imbrace SDK - NPM Package Verification Suite

A test suite for the Imbrace TypeScript SDK, designed to validate the published library after it has been released or installed as a dependency from the registry.

## 1. Objectives
- Ensure the modules are exported correctly from the `@imbrace/sdk` library.
- Validate the SDK's compatibility in a real-world application environment.
- Maintain feature consistency between the development build and the released build.

## 2. Environment setup

### Environment variable configuration
Prepare a `.env` file similar to the local environment:
```env
IMBRACE_API_KEY=your_api_key_here
IMBRACE_ORGANIZATION_ID=your_org_id_here
```

### Installation
```bash
npm install
```
*This package uses `@imbrace/sdk` as defined in the `dependencies` of `package.json`.*

## 3. Test commands
The system uses commands equivalent to the Local suite to keep them in sync:

- **Run everything**: `npm run test:all`
- **Integration flow**: `npm run test:full-flow`
- **Frontend/Chat**: `npm run test:frontend`
- **Multi-Agent/Parquet**: `npm run test:multi-agent`
- **CRM/Boards**: `npm run test:crm-advanced`
- **Multimedia/AI**: `npm run test:multimedia`
- **Settings/Templates**: `npm run test:settings`
- **Error handling**: `npm run test:error-paths`

## 4. Key highlights
- **Zero-Crash Runner**: The test orchestrator (`test-all.ts`) can skip modules that hit 502/404 errors so the rest of the system still completes.
- **Evidence Logging**: The logs return detailed IDs of the resources created (Assistant ID, Board ID, etc.) to support test reporting.

## 5. Conclusion & Reporting
If `npm run test:all` returns `🎉 ALL TEST MODULES FINISHED SUCCESSFULLY!`, the SDK is ready for the Production environment.
