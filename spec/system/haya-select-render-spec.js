import "velocious/build/src/testing/test.js";
import SystemTest from "system-testing/build/system-test.js";
import timeout from "awaitery/build/timeout.js";

SystemTest.rootPath = "/?systemTest=true";
const systemTestArgs = {debug: true};

beforeAll(async () => {
  console.log("[SystemTest debug] beforeAll starting");
  console.log(`[SystemTest debug] SYSTEM_TEST_HOST=${process.env.SYSTEM_TEST_HOST ?? "unset"}`);
  const systemTest = SystemTest.current(systemTestArgs);
  console.log(`[SystemTest debug] rootPath=${systemTest.getRootPath()}`);
  await timeout({timeout: 90000}, async () => {
    await systemTest.start();
  });
  console.log("[SystemTest debug] beforeAll started");
});

afterAll(async () => {
  console.log("[SystemTest debug] afterAll stopping");
  await timeout({timeout: 30000}, async () => {
    await SystemTest.current().stop();
  });
  console.log("[SystemTest debug] afterAll stopped");
});

describe("HayaSelect", () => {
  it("renders in the example app", async () => {
    await timeout({timeout: 90000}, async () => {
      console.log("[SystemTest debug] test starting run");
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000});
      });
      console.log("[SystemTest debug] test finished run");
    });
  });
});
