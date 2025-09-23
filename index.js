(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue')) :
    typeof define === 'function' && define.amd ? define(['exports', 'vue'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.VueGettext = {}, global.Vue));
})(this, (function (exports, vue) { 'use strict';

    const EVALUATION_RE = /[[\].]{1,2}/g;
    /* Interpolation RegExp.
     *
     * Because interpolation inside attributes are deprecated in Vue 2 we have to
     * use another set of delimiters to be able to use `translate-plural` etc.
     * We use %{ } delimiters.
     *
     * /
     *   %\{                => Starting delimiter: `%{`
     *     (                => Start capture
     *       (?:.|\n)       => Non-capturing group: any character or newline
     *       +?             => One or more times (ungreedy)
     *     )                => End capture
     *   \}                 => Ending delimiter: `}`
     * /g                   => Global: don't return after first match
     */
    const INTERPOLATION_RE = /%\{((?:.|\n)+?)\}/g;
    const MUSTACHE_SYNTAX_RE = /\{\{((?:.|\n)+?)\}\}/g;
    /**
     * Evaluate a piece of template string containing %{ } placeholders.
     * E.g.: 'Hi %{ user.name }' => 'Hi Bob'
     *
     * This is a vm.$interpolate alternative for Vue 2.
     * https://vuejs.org/v2/guide/migration.html#vm-interpolate-removed
     *
     * @param {String} msgid - The translation key containing %{ } placeholders
     * @param {Object} context - An object whose elements are put in their corresponding placeholders
     *
     * @return {String} The interpolated string
     */
    const interpolate = (plugin) => (msgid, context = {}, parent) => {
        const silent = plugin.silent;
        if (!silent && MUSTACHE_SYNTAX_RE.test(msgid)) {
            console.warn(`Mustache syntax cannot be used with vue-gettext. Please use "%{}" instead of "{{}}" in: ${msgid}`);
        }
        const result = msgid.replace(INTERPOLATION_RE, (_match, token) => {
            const expression = token.trim();
            let evaluated;
            // Avoid eval() by splitting `expression` and looping through its different properties if any, see #55.
            function getProps(obj, expression) {
                const arr = expression.split(EVALUATION_RE).filter((x) => x);
                while (arr.length) {
                    obj = obj[arr.shift()];
                }
                return obj;
            }
            function evalInContext(context, expression, parent) {
                try {
                    evaluated = getProps(context, expression);
                }
                catch (e) {
                    // Ignore errors, because this function may be called recursively later.
                }
                if (evaluated === undefined || evaluated === null) {
                    if (parent) {
                        // Recursively climb the parent chain to allow evaluation inside nested components, see #23 and #24.
                        return evalInContext(parent.ctx, expression, parent.parent);
                    }
                    else {
                        console.warn(`Cannot evaluate expression: ${expression}`);
                        evaluated = expression;
                    }
                }
                const result = evaluated.toString();
                return result;
            }
            return evalInContext(context, expression, parent);
        });
        return result;
    };
    // Store this values as function attributes for easy access elsewhere to bypass a Rollup
    // weak point with `export`:
    // https://github.com/rollup/rollup/blob/fca14d/src/utils/getExportMode.js#L27
    interpolate.INTERPOLATION_RE = INTERPOLATION_RE;
    interpolate.INTERPOLATION_PREFIX = "%{";

    /**
     * Plural Forms
     *
     * This is a list of the plural forms, as used by Gettext PO, that are appropriate to each language.
     * http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html
     *
     * This is a replica of angular-gettext's plural.js
     * https://github.com/rubenv/angular-gettext/blob/master/src/plural.js
     */
    var plurals = {
        getTranslationIndex: function (languageCode, n) {
            n = Number(n);
            n = typeof n === "number" && isNaN(n) ? 1 : n; // Fallback to singular.
            // Extract the ISO 639 language code. The ISO 639 standard defines
            // two-letter codes for many languages, and three-letter codes for
            // more rarely used languages.
            // https://www.gnu.org/software/gettext/manual/html_node/Language-Codes.html#Language-Codes
            if (languageCode.length > 2 && languageCode !== "pt_BR") {
                languageCode = languageCode.split("_")[0];
            }
            switch (languageCode) {
                case "ay": // Aymará
                case "bo": // Tibetan
                case "cgg": // Chiga
                case "dz": // Dzongkha
                case "fa": // Persian
                case "id": // Indonesian
                case "ja": // Japanese
                case "jbo": // Lojban
                case "ka": // Georgian
                case "kk": // Kazakh
                case "km": // Khmer
                case "ko": // Korean
                case "ky": // Kyrgyz
                case "lo": // Lao
                case "ms": // Malay
                case "my": // Burmese
                case "sah": // Yakut
                case "su": // Sundanese
                case "th": // Thai
                case "tt": // Tatar
                case "ug": // Uyghur
                case "vi": // Vietnamese
                case "wo": // Wolof
                case "zh": // Chinese
                    // 1 form
                    return 0;
                case "is": // Icelandic
                    // 2 forms
                    return n % 10 !== 1 || n % 100 === 11 ? 1 : 0;
                case "jv": // Javanese
                    // 2 forms
                    return n !== 0 ? 1 : 0;
                case "mk": // Macedonian
                    // 2 forms
                    return n === 1 || n % 10 === 1 ? 0 : 1;
                case "ach": // Acholi
                case "ak": // Akan
                case "am": // Amharic
                case "arn": // Mapudungun
                case "br": // Breton
                case "fil": // Filipino
                case "fr": // French
                case "gun": // Gun
                case "ln": // Lingala
                case "mfe": // Mauritian Creole
                case "mg": // Malagasy
                case "mi": // Maori
                case "oc": // Occitan
                case "pt_BR": // Brazilian Portuguese
                case "tg": // Tajik
                case "ti": // Tigrinya
                case "tr": // Turkish
                case "uz": // Uzbek
                case "wa": // Walloon
                    // 2 forms
                    return n > 1 ? 1 : 0;
                case "lv": // Latvian
                    // 3 forms
                    return n % 10 === 1 && n % 100 !== 11 ? 0 : n !== 0 ? 1 : 2;
                case "lt": // Lithuanian
                    // 3 forms
                    return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
                case "be": // Belarusian
                case "bs": // Bosnian
                case "hr": // Croatian
                case "ru": // Russian
                case "sr": // Serbian
                case "uk": // Ukrainian
                    // 3 forms
                    return n % 10 === 1 && n % 100 !== 11
                        ? 0
                        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
                            ? 1
                            : 2;
                case "mnk": // Mandinka
                    // 3 forms
                    return n === 0 ? 0 : n === 1 ? 1 : 2;
                case "ro": // Romanian
                    // 3 forms
                    return n === 1 ? 0 : n === 0 || (n % 100 > 0 && n % 100 < 20) ? 1 : 2;
                case "pl": // Polish
                    // 3 forms
                    return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
                case "cs": // Czech
                case "sk": // Slovak
                    // 3 forms
                    return n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
                case "csb": // Kashubian
                    // 3 forms
                    return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
                case "sl": // Slovenian
                    // 4 forms
                    return n % 100 === 1 ? 0 : n % 100 === 2 ? 1 : n % 100 === 3 || n % 100 === 4 ? 2 : 3;
                case "mt": // Maltese
                    // 4 forms
                    return n === 1 ? 0 : n === 0 || (n % 100 > 1 && n % 100 < 11) ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3;
                case "gd": // Scottish Gaelic
                    // 4 forms
                    return n === 1 || n === 11 ? 0 : n === 2 || n === 12 ? 1 : n > 2 && n < 20 ? 2 : 3;
                case "cy": // Welsh
                    // 4 forms
                    return n === 1 ? 0 : n === 2 ? 1 : n !== 8 && n !== 11 ? 2 : 3;
                case "kw": // Cornish
                    // 4 forms
                    return n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : 3;
                case "ga": // Irish
                    // 5 forms
                    return n === 1 ? 0 : n === 2 ? 1 : n > 2 && n < 7 ? 2 : n > 6 && n < 11 ? 3 : 4;
                case "ar": // Arabic
                    // 6 forms
                    return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
                default:
                    // Everything else
                    return n !== 1 ? 1 : 0;
            }
        },
    };

    const GetTextSymbol = Symbol("GETTEXT");

    function normalizeMsgId(key) {
        return key.replaceAll(/\r?\n/g, "\n");
    }
    function normalizeTranslations(translations) {
        const newTranslations = {};
        Object.keys(translations).forEach((lang) => {
            const langData = translations[lang];
            const newLangData = {};
            Object.keys(langData).forEach((key) => {
                newLangData[normalizeMsgId(key)] = langData[key];
            });
            newTranslations[lang] = newLangData;
        });
        return newTranslations;
    }
    const useGettext = () => {
        const gettext = vue.inject(GetTextSymbol, null);
        if (!gettext) {
            throw new Error("Failed to inject gettext. Make sure vue3-gettext is set up properly.");
        }
        return gettext;
    };

    const translate = (language) => ({
        /*
         * Get the translated string from the translation.json file.
         *
         * @param {String} msgid - The translation key
         * @param {Number} n - The number to switch between singular and plural
         * @param {String} context - The translation key context
         * @param {String} defaultPlural - The default plural value (optional)
         * @param {String} languageKey - The language ID (e.g. 'fr_FR' or 'en_US')
         * @param {Object} args - Values to be used when strings are interpolated
         *
         * @return {String} The translated string
         */
        getTranslation: function (msgid, n = 1, context = null, defaultPlural = null, languageKey, args) {
            if (languageKey === undefined) {
                languageKey = language.current;
            }
            const interp = (message, parameters) => parameters ? language.interpolate(message, parameters) : message;
            msgid = normalizeMsgId(msgid);
            defaultPlural = defaultPlural ? normalizeMsgId(defaultPlural) : null;
            if (!msgid) {
                // Ignore empty message ids.
                return "";
            }
            const silent = languageKey ? language.silent || language.muted.indexOf(languageKey) !== -1 : false;
            // Default untranslated string, singular or plural.
            let noTransLangKey = "en";
            if (language.sourceCodeLanguage) {
                noTransLangKey = language.sourceCodeLanguage;
            }
            const untranslated = defaultPlural && plurals.getTranslationIndex(noTransLangKey, n) > 0 ? defaultPlural : msgid;
            // In this field, `ll_CC` combinations denoting a language’s main dialect are abbreviated as `ll`,
            // for example `de` is equivalent to `de_DE` (German as spoken in Germany).
            // See the `Language` section in https://www.gnu.org/software/gettext/manual/html_node/Header-Entry.html
            // So try `ll_CC` first, or the `ll` abbreviation which can be three-letter sometimes:
            // https://www.gnu.org/software/gettext/manual/html_node/Language-Codes.html#Language-Codes
            const pluginTranslations = language.translations;
            const translations = pluginTranslations[languageKey] || pluginTranslations[languageKey.split("_")[0]];
            if (!translations) {
                if (!silent) {
                    console.warn(`No translations found for ${languageKey}`);
                }
                return interp(untranslated, args);
            }
            const getTranslationFromArray = (arr) => {
                let translationIndex = plurals.getTranslationIndex(languageKey, n);
                // Do not assume that the default value of n is 1 for the singular form of all languages. E.g. Arabic
                if (arr.length === 1 && n === 1) {
                    translationIndex = 0;
                }
                const str = arr[translationIndex];
                if (!str) {
                    // If the translation is empty, use the untranslated string.
                    if (str === "") {
                        return interp(untranslated, args);
                    }
                    throw new Error(msgid + " " + translationIndex + " " + language.current + " " + n);
                }
                return interp(str, args);
            };
            const getUntranslatedMsg = () => {
                if (!silent) {
                    let msg = `Untranslated ${languageKey} key found: ${msgid}`;
                    if (context) {
                        msg += ` (with context: ${context})`;
                    }
                    console.warn(msg);
                }
                return interp(untranslated, args);
            };
            const translateMsg = (msg, context = null) => {
                if (msg instanceof Object) {
                    if (Array.isArray(msg)) {
                        return getTranslationFromArray(msg);
                    }
                    const msgContext = context !== null && context !== void 0 ? context : "";
                    const ctxVal = msg[msgContext];
                    return translateMsg(ctxVal);
                }
                if (context) {
                    return getUntranslatedMsg();
                }
                if (!msg) {
                    return getUntranslatedMsg();
                }
                return interp(msg, args);
            };
            const translated = translations[msgid];
            return translateMsg(translated, context);
        },
        /*
         * Returns a string of the translation of the message.
         * Also makes the string discoverable by gettext-extract.
         *
         * @param {String} msgid - The translation key
         * @param {Object} parameters - The interpolation parameters
         *
         * @return {String} The translated string
         */
        gettext: function (msgid, parameters) {
            return this.getTranslation(msgid, undefined, undefined, undefined, undefined, parameters);
        },
        /*
         * Returns a string of the translation for the given context.
         * Also makes the string discoverable by gettext-extract.
         *
         * @param {String} context - The context of the string to translate
         * @param {String} msgid - The translation key
         * @param {Object} parameters - The interpolation parameters
         *
         * @return {String} The translated string
         */
        pgettext: function (context, msgid, parameters) {
            return this.getTranslation(msgid, 1, context, undefined, undefined, parameters);
        },
        /*
         * Returns a string of the translation of either the singular or plural,
         * based on the number.
         * Also makes the string discoverable by gettext-extract.
         *
         * @param {String} msgid - The translation key
         * @param {String} plural - The plural form of the translation key
         * @param {Number} n - The number to switch between singular and plural
         * @param {Object} parameters - The interpolation parameters
         *
         * @return {String} The translated string
         */
        ngettext: function (msgid, plural, n, parameters) {
            return this.getTranslation(msgid, n, null, plural, undefined, parameters);
        },
        /*
         * Returns a string of the translation of either the singular or plural,
         * based on the number, for the given context.
         * Also makes the string discoverable by gettext-extract.
         *
         * @param {String} context - The context of the string to translate
         * @param {String} msgid - The translation key
         * @param {String} plural - The plural form of the translation key
         * @param {Number} n - The number to switch between singular and plural
         * @param {Object} parameters - The interpolation parameters
         *
         * @return {String} The translated string
         */
        npgettext: function (context, msgid, plural, n, parameters) {
            return this.getTranslation(msgid, n, context, plural, undefined, parameters);
        },
    });

    const defaultOptions = {
        /** all the available languages of your application. Keys must match locale names */
        availableLanguages: { en: "English" },
        defaultLanguage: "en",
        sourceCodeLanguage: undefined,
        mutedLanguages: [],
        silent: false,
        translations: {},
        setGlobalProperties: true,
        globalProperties: {
            language: ["$language"],
            gettext: ["$gettext"],
            pgettext: ["$pgettext"],
            ngettext: ["$ngettext"],
            npgettext: ["$npgettext"],
            interpolate: ["$gettextInterpolate"],
        },
    };
    function createGettext(options = {}) {
        Object.keys(options).forEach((key) => {
            if (Object.keys(defaultOptions).indexOf(key) === -1) {
                throw new Error(`${key} is an invalid option for the translate plugin.`);
            }
        });
        const mergedOptions = {
            ...defaultOptions,
            ...options,
        };
        const translations = vue.ref(normalizeTranslations(mergedOptions.translations));
        const gettext = vue.reactive({
            available: mergedOptions.availableLanguages,
            muted: mergedOptions.mutedLanguages,
            silent: mergedOptions.silent,
            translations: vue.computed({
                get: () => {
                    return translations.value;
                },
                set: (val) => {
                    translations.value = normalizeTranslations(val);
                },
            }),
            current: mergedOptions.defaultLanguage,
            sourceCodeLanguage: mergedOptions.sourceCodeLanguage,
            install(app) {
                // TODO: is this needed?
                app[GetTextSymbol] = gettext;
                app.provide(GetTextSymbol, gettext);
                if (mergedOptions.setGlobalProperties) {
                    const globalProperties = app.config.globalProperties;
                    let properties = mergedOptions.globalProperties.gettext || ["$gettext"];
                    properties.forEach((p) => {
                        globalProperties[p] = gettext.$gettext;
                    });
                    properties = mergedOptions.globalProperties.pgettext || ["$pgettext"];
                    properties.forEach((p) => {
                        globalProperties[p] = gettext.$pgettext;
                    });
                    properties = mergedOptions.globalProperties.ngettext || ["$ngettext"];
                    properties.forEach((p) => {
                        globalProperties[p] = gettext.$ngettext;
                    });
                    properties = mergedOptions.globalProperties.npgettext || ["$npgettext"];
                    properties.forEach((p) => {
                        globalProperties[p] = gettext.$npgettext;
                    });
                    properties = mergedOptions.globalProperties.language || ["$language"];
                    properties.forEach((p) => {
                        globalProperties[p] = gettext;
                    });
                }
            },
        });
        const translate$1 = translate(gettext);
        const interpolate$1 = interpolate(gettext);
        gettext.$gettext = translate$1.gettext.bind(translate$1);
        gettext.$pgettext = translate$1.pgettext.bind(translate$1);
        gettext.$ngettext = translate$1.ngettext.bind(translate$1);
        gettext.$npgettext = translate$1.npgettext.bind(translate$1);
        gettext.interpolate = interpolate$1.bind(interpolate$1);
        return gettext;
    }
    const defineGettextConfig = (config) => {
        return config;
    };

    exports.createGettext = createGettext;
    exports.defineGettextConfig = defineGettextConfig;
    exports.useGettext = useGettext;

}));
