/* @flow */

const { compile } = require("./utils");
const I18nRuntimePlugin = require("../lib/index");

afterEach(() => {
  delete window.testData;
});

test("ESM with javascript/auto works", async () => {
  const pluginConfig = {
    fullTranslations: {
      en: { europe: "Europe" },
      fi: { europe: "Eurooppa" }
    },
    functionNames: ["I18n.t"],
    translationPlaceholderConstantName: "I18N_RUNTIME_TRANSLATIONS"
  };

  await compile({
    plugin: new I18nRuntimePlugin(pluginConfig),

    modules: {
      "nonStrictEsm.js": `
        export const en = I18n.t("europe", { locale: "en" });
        export const fi = I18n.t("europe", { locale: "fi" });
      `
    },

    entryCode: `
      const I18n = require("i18n-js");

      window.I18n = I18n;
      I18n.locale = 'en';
      I18n.translations = I18N_RUNTIME_TRANSLATIONS;

      const data = require('./nonStrictEsm');
      window.testData = { fi: data.fi, en: data.en };
    `
  });

  expect(window.testData).toEqual({
    fi: "Eurooppa",
    en: "Europe"
  });
});

test("with ESM in entry point works", async () => {
  const pluginConfig = {
    fullTranslations: {
      en: { europe: "Europe" },
      fi: { europe: "Eurooppa" }
    },
    functionNames: ["I18n.t"],
    translationPlaceholderConstantName: "I18N_RUNTIME_TRANSLATIONS"
  };

  await compile({
    plugin: new I18nRuntimePlugin(pluginConfig),

    modules: {
      "nonStrictEsm.js": `
        export const en = I18n.t("europe", { locale: "en" });
        export const fi = I18n.t("europe", { locale: "fi" });
      `
    },

    entryCode: `
      import I18n from "i18n-js";
      import * as data from './nonStrictEsm';

      window.I18n = I18n;
      I18n.locale = 'en';
      I18n.translations = I18N_RUNTIME_TRANSLATIONS;

      window.testData = { fi: data.fi, en: data.en };
    `
  });

  expect(window.testData).toEqual({
    fi: "Eurooppa",
    en: "Europe"
  });
});

// FIXME: Make it work with .mjs somehow. Help wanted!
test("importing .mjs modules does not work", async () => {
  const pluginConfig = {
    fullTranslations: {
      en: { europe: "Europe" },
      fi: { europe: "Eurooppa" }
    },
    functionNames: ["I18n.t"],
    translationPlaceholderConstantName: "I18N_RUNTIME_TRANSLATIONS"
  };

  try {
    await compile({
      plugin: new I18nRuntimePlugin(pluginConfig),

      modules: {
        "strictEsm.mjs": `
          export const en = I18n.t("europe", { locale: "en" });
          export const fi = I18n.t("europe", { locale: "fi" });
        `
      },

      entryCode: `
        import I18n from "i18n-js";
        import * as data from './strictEsm';

        window.I18n = I18n;
        I18n.locale = 'en';
        I18n.translations = I18N_RUNTIME_TRANSLATIONS;

        window.testData = { fi: data.fi, en: data.en };
      `
    });
    throw new Error("Expected compilation to fail but it did not");
  } catch (err) {
    if (err.message && err.message.match(/Expected compilation to fail/)) {
      throw err;
    }
    // We expected this error, just log it for debugging purposes
    console.warn("This compilation failure was expected:\n\n" + err);
  }
});
