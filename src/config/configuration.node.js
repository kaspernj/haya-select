import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import Configuration from "velocious/build/src/configuration.js";
import EnvironmentHandlerNode from "velocious/build/src/environment-handlers/node.js";
import SqliteDriver from "velocious/build/src/database/drivers/sqlite/index.js";
import AsyncTrackedPool from "velocious/build/src/database/pool/async-tracked-multi-connection.js";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
const dbDir = path.join(rootDir, "db");

fs.mkdirSync(dbDir, {recursive: true});

const databaseConfig = {
  driver: SqliteDriver,
  name: "haya-select-test",
  poolType: AsyncTrackedPool,
  type: "sqlite"
};

const configuration = new Configuration({
  database: {
    development: {
      default: databaseConfig
    },
    test: {
      default: databaseConfig
    }
  },
  directory: rootDir,
  environmentHandler: new EnvironmentHandlerNode()
});

export default configuration;
