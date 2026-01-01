import "velocious/build/src/testing/test.js";
import SystemTest from "system-testing/build/system-test.js";
import timeout from "awaitery/build/timeout.js";

SystemTest.rootPath = "/?systemTest=true";

describe("HayaSelect", () => {
  it("renders in the example app", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run({debug: true}, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000});
      });
    });
  });
});
