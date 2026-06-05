import "reflect-metadata";
import { createApp } from "./app.js";
import { loadAppConfig } from "./config/loadAppConfig.js";
import { createAppDataSource } from "./data-source.js";
import { RouteRepository } from "./repositories/RouteRepository.js";
import { PathEvaluationService } from "./services/PathEvaluationService.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const configFilePath = process.env.FALCON_CONFIG ?? "example/millennium-falcon.json";

async function main() {
  const appConfig = await loadAppConfig(configFilePath);
  const appDataSource = createAppDataSource(appConfig);

  await appDataSource.initialize();

  const routeRepository = new RouteRepository(appDataSource);
  const pathEvaluationService = new PathEvaluationService(appConfig, routeRepository);
  const app = createApp({ pathEvaluationService });

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
