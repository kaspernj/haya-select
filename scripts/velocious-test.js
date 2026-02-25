import configuration from "../src/config/configuration.node.js";
import TestFilesFinder from "velocious/build/src/testing/test-files-finder.js";
import TestRunner from "velocious/build/src/testing/test-runner.js";
import {spawnSync} from "child_process";

const INCLUDE_TAG_FLAGS = new Set(["--tag", "--include-tag", "-t"]);
const EXCLUDE_TAG_FLAGS = new Set(["--exclude-tag", "--skip-tag", "-x"]);

/** @returns {Promise<void>} */
const ensureDistForSystemTests = async () => {
  if (process.env.SYSTEM_TEST_HOST !== "dist") return
  if (process.env.SKIP_TEST_DIST_BUILD === "true") return

  console.log("SYSTEM_TEST_HOST=dist detected, building example dist before tests")

  const buildResult = spawnSync(
    "npm",
    ["run", "build:example:dist"],
    {encoding: "utf8", shell: true, stdio: "inherit"}
  )

  if (buildResult.status !== 0) {
    throw new Error(`Failed to build dist before system tests (exit status: ${buildResult.status})`)
  }
}

const splitTags = (value) => {
  if (!value) return [];

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const parseTagFilters = (processArgs) => {
  const includeTags = [];
  const excludeTags = [];
  const filteredProcessArgs = processArgs.length > 0 ? [processArgs[0]] : [];
  let inRestArgs = false;

  for (let i = 1; i < processArgs.length; i++) {
    const arg = processArgs[i];

    if (arg === "--") {
      inRestArgs = true;
      filteredProcessArgs.push(arg);
      continue;
    }

    if (!inRestArgs) {
      if (INCLUDE_TAG_FLAGS.has(arg)) {
        const nextValue = processArgs[i + 1];

        if (nextValue && !nextValue.startsWith("-")) {
          includeTags.push(...splitTags(nextValue));
          i++;
        }

        continue;
      }

      if (EXCLUDE_TAG_FLAGS.has(arg)) {
        const nextValue = processArgs[i + 1];

        if (nextValue && !nextValue.startsWith("-")) {
          excludeTags.push(...splitTags(nextValue));
          i++;
        }

        continue;
      }

      if (arg.startsWith("--tag=")) {
        includeTags.push(...splitTags(arg.slice("--tag=".length)));
        continue;
      }

      if (arg.startsWith("--include-tag=")) {
        includeTags.push(...splitTags(arg.slice("--include-tag=".length)));
        continue;
      }

      if (arg.startsWith("--exclude-tag=")) {
        excludeTags.push(...splitTags(arg.slice("--exclude-tag=".length)));
        continue;
      }

      if (arg.startsWith("--skip-tag=")) {
        excludeTags.push(...splitTags(arg.slice("--skip-tag=".length)));
        continue;
      }
    }

    filteredProcessArgs.push(arg);
  }

  return {
    includeTags: Array.from(new Set(includeTags)),
    excludeTags: Array.from(new Set(excludeTags)),
    filteredProcessArgs
  };
};

const main = async () => {
  const processArgs = process.argv.slice(2);

  await ensureDistForSystemTests()

  configuration.setEnvironment("test");
  configuration.setCurrent();

  let directory;
  const directories = [];

  if (process.env.VELOCIOUS_TEST_DIR) {
    directory = process.env.VELOCIOUS_TEST_DIR;
    directories.push(process.env.VELOCIOUS_TEST_DIR);
  } else {
    directory = process.cwd();
    directories.push(`${process.cwd()}/__tests__`);
    directories.push(`${process.cwd()}/tests`);
    directories.push(`${process.cwd()}/spec`);
  }

  const {includeTags, excludeTags, filteredProcessArgs} = parseTagFilters(processArgs);
  const testFilesFinder = new TestFilesFinder({
    directory,
    directories,
    processArgs: filteredProcessArgs
  });
  const testFiles = await testFilesFinder.findTestFiles();
  const testRunner = new TestRunner({configuration, excludeTags, includeTags, testFiles});

  let signalHandled = false;
  const handleSignal = async (signal) => {
    if (signalHandled) return;

    signalHandled = true;
    console.error(`\nReceived ${signal}, running afterAll hooks before exit...`);

    try {
      await testRunner.runAfterAllsForActiveScopes();
    } catch (error) {
      console.error("Failed while running afterAll hooks:", error);
    } finally {
      process.exit(130);
    }
  };

  process.once("SIGINT", () => { void handleSignal("SIGINT"); });
  process.once("SIGTERM", () => { void handleSignal("SIGTERM"); });

  await testRunner.prepare();

  if (testRunner.getTestsCount() === 0) {
    throw new Error(`${testRunner.getTestsCount()} tests was found in ${testFiles.length} file(s)`);
  }

  await testRunner.run();

  const executedTests = testRunner.getExecutedTestsCount();

  if ((includeTags.length > 0 || excludeTags.length > 0) && executedTests === 0) {
    console.error("\nNo tests matched the provided tag filters");
    process.exit(1);
  }

  if (testRunner.isFailed()) {
    console.error(
      `\nTest run failed with ${testRunner.getFailedTests()} failed tests and ${testRunner.getSuccessfulTests()} successfull`
    );
    process.exit(1);
  } else if (testRunner.areAnyTestsFocussed()) {
    console.error(
      `\nFocussed run with ${testRunner.getFailedTests()} failed tests and ${testRunner.getSuccessfulTests()} successfull`
    );
    process.exit(1);
  } else {
    console.log(`\nTest run succeeded with ${testRunner.getSuccessfulTests()} successful tests`);
    process.exit(0);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
