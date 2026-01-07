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
        await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']");

        const searchInput = await systemTest.find("[data-testid='hayaSelectRoot'] [data-class='search-text-input']");
        await systemTest.interact(searchInput, "sendKeys", "tw");

        await waitFor({timeout: 5000}, async () => {
          const options = await systemTest.all("[data-class='select-option']", {useBaseSelector: false});
          const texts = await Promise.all(options.map(async (option) => (await option.getText()).trim()));

          if (texts.length !== 1 || texts[0] !== "Two") {
            throw new Error(`Unexpected options: ${texts.join(", ")}`);
          }
        });

        await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']");
        await waitFor({timeout: 5000}, async () => {
          const searchInputs = await systemTest.all(
            "[data-testid='hayaSelectRoot'] [data-class='search-text-input']",
            {timeout: 0, visible: false}
          );

          if (searchInputs.length > 0) {
            throw new Error("Search input is still visible");
          }
        });
      });
    });
  });

  it("highlights selected options in multiple select", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectMultipleRoot", {timeout: 60000});
        await systemTest.click("[data-testid='hayaSelectMultipleRoot'] [data-class='select-container']");

        const optionOne = await systemTest.find("[data-class='select-option'][data-value='one']", {useBaseSelector: false});
        await systemTest.click(optionOne);

        const optionTwo = await systemTest.find("[data-class='select-option'][data-value='two']", {useBaseSelector: false});
        await systemTest.click(optionTwo);

        const scoundrel = await systemTest.getScoundrelClient();
        const colors = await scoundrel.evalResult(`
          (() => {
            const toRgb = (color) => {
              const element = document.createElement("div");
              element.style.backgroundColor = color;
              document.body.appendChild(element);
              const rgb = window.getComputedStyle(element).backgroundColor;
              element.remove();
              return rgb;
            };

            const selected = Array.from(document.querySelectorAll("[data-class='select-option'][data-selected='true']"))
              .map((element) => window.getComputedStyle(element).backgroundColor);

            return {
              allowed: [toRgb("#cfe1ff"), toRgb("#9bbcfb")],
              selected
            };
          })()
        `);

        expect(colors.selected.length).toBeGreaterThan(0);
        colors.selected.forEach((color) => {
          expect(colors.allowed.includes(color)).toBe(true);
        });

        await systemTest.click("[data-testid='hayaSelectMultipleRoot'] [data-class='select-container']");
        await waitFor({timeout: 5000}, async () => {
          const searchInputs = await systemTest.all(
            "[data-testid='hayaSelectMultipleRoot'] [data-class='search-text-input']",
            {timeout: 0, visible: false}
          );

          if (searchInputs.length > 0) {
            throw new Error("Search input is still visible");
          }
        });
      });
    });
  });

  it("keeps rounded corners after opening and closing", async () => {
    await timeout({timeout: 90000}, async () => {
      await SystemTest.run(systemTestArgs, async (systemTest) => {
        await systemTest.findByTestID("hayaSelectRoot", {timeout: 60000});

        const scoundrel = await systemTest.getScoundrelClient();
        const getBorderRadii = async () => await scoundrel.evalResult(`
          (() => {
            const element = document.querySelector("[data-testid='hayaSelectRoot'] [data-class='select-container']");
            if (!element) return null;
            const style = window.getComputedStyle(element);
            return {
              topLeft: style.borderTopLeftRadius,
              topRight: style.borderTopRightRadius,
              bottomLeft: style.borderBottomLeftRadius,
              bottomRight: style.borderBottomRightRadius
            };
          })()
        `);

        const isOpen = await scoundrel.evalResult(`
          Boolean(document.querySelector("[data-testid='hayaSelectRoot'] [data-class='search-text-input']"))
        `);

        if (isOpen) {
          await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']");
          await waitFor({timeout: 5000}, async () => {
            const searchInputs = await systemTest.all(
              "[data-testid='hayaSelectRoot'] [data-class='search-text-input']",
              {timeout: 0, visible: false}
            );

            if (searchInputs.length > 0) {
              throw new Error("Search input is still visible");
            }
          });
        }

        const initialRadii = await getBorderRadii();
        expect(initialRadii).not.toBeNull();

        await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']");
        await systemTest.find("[data-testid='hayaSelectRoot'] [data-class='search-text-input']");
        await systemTest.click("[data-testid='hayaSelectRoot'] [data-class='select-container']");

        await waitFor({timeout: 5000}, async () => {
          const searchInputs = await systemTest.all(
            "[data-testid='hayaSelectRoot'] [data-class='search-text-input']",
            {timeout: 0, visible: false}
          );

          if (searchInputs.length > 0) {
            throw new Error("Search input is still visible");
          }
        });

        const finalRadii = await getBorderRadii();

        expect(finalRadii).toEqual(initialRadii);
        expect(finalRadii.topLeft).not.toBe("0px");
        expect(finalRadii.topRight).not.toBe("0px");
        expect(finalRadii.bottomLeft).not.toBe("0px");
        expect(finalRadii.bottomRight).not.toBe("0px");
      });
    });
  });
});
