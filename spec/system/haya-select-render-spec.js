import "velocious/build/src/testing/test.js";
import SystemTest from "system-testing/build/system-test.js";

SystemTest.rootPath = "/?systemTest=true";

describe("HayaSelect", () => {
  it("renders in the example app", async () => {
    await SystemTest.run(async (systemTest) => {
      await systemTest.findByTestID("hayaSelectRoot");
    });
  });
});
