import "velocious/build/src/testing/test.js";
import SystemTest from "system-testing/build/system-test.js";
import timeout from "awaitery/build/timeout.js";
import waitFor from "awaitery/build/wait-for.js";

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

  it("filters options when searching", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000});
        await systemTest.click("[data-class='select-container']");

        const searchInput = await systemTest.find("[data-class='search-text-input']");
        await systemTest.interact(searchInput, "sendKeys", "tw");

        await waitFor({timeout: 5000}, async () => {
          const options = await systemTest.all("[data-class='select-option']", {useBaseSelector: false});
          const texts = await Promise.all(options.map(async (option) => (await option.getText()).trim()));

          if (texts.length !== 1 || texts[0] !== "Two") {
            throw new Error(`Unexpected options: ${texts.join(", ")}`);
          }
        });
      });
    });
  });
});
