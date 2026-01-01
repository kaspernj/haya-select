import "velocious/build/src/testing/test.js";
import SystemTest from "system-testing/build/system-test.js";
import timeout from "awaitery/build/timeout.js";

SystemTest.rootPath = "/?systemTest=true";
const systemTestArgs = {};

beforeAll(async () => {
  const systemTest = SystemTest.current(systemTestArgs);
  await timeout({timeout: 90000}, async () => {
    await systemTest.start();
  });
  systemTest.setBaseSelector("[data-testid='systemTestingComponent']");
});

afterAll(async () => {
  await timeout({timeout: 30000}, async () => {
    await SystemTest.current().stop();
  });
});

describe("HayaSelect", () => {
  it("renders in the example app", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000});
      });
    });
  });
});
