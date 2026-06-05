import "reflect-metadata";
import { createApp } from "./app.js";
import { appDataSource } from "./data-source.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

async function main() {
  await appDataSource.initialize();

  const app = createApp();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
