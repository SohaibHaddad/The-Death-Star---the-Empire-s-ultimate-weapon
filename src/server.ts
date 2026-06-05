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

  try {
    const routeRepository = new RouteRepository(appDataSource);
    const pathEvaluationService = await PathEvaluationService.create(appConfig, routeRepository);
    const app = createApp({ pathEvaluationService });
    const server = await startServer(app);

    const shutdown = async () => {
      server.close(async (closeError) => {
        try {
          await appDataSource.destroy();
        } finally {
          if (closeError) {
            console.error(closeError);
            process.exit(1);
          }

          process.exit(0);
        }
      });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error: unknown) {
    await appDataSource.destroy();
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

async function startServer(app: ReturnType<typeof createApp>) {
  return await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      resolve(server);
    });

    server.once("error", reject);
    server.once("listening", () => {
      server.removeListener("error", reject);
    });
  });
}
