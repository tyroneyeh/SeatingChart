const isFunction = (val) => typeof val === "function";

function defineComponent(options, extraOptions) {
  return isFunction(options) ? (
    // #8326: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))()
  ) : options;
}

let trackOpBit = 1;
let activeEffectScope;
let shouldTrack = true;
let effectTrackDepth = 0;
const maxMarkerBits = 30;
let activeEffect;

function recordEffectScope(effect2, scope = activeEffectScope) {
  if (scope && scope.active) {
    scope.effects.push(effect2);
  }
}
const initDepMarkers = ({ deps }) => {
  if (deps.length) {
    for (const element of deps) {
      element.w |= trackOpBit;
    }
  }
};
const finalizeDepMarkers = (effect2) => {
  const { deps } = effect2;
  if (deps.length) {
    let ptr = 0;
    for (const element of deps) {
      const dep = element;
      if (wasTracked(dep) && !newTracked(dep)) {
        dep.delete(effect2);
      } else {
        deps[ptr++] = dep;
      }
      dep.w &= ~trackOpBit;
      dep.n &= ~trackOpBit;
    }
    deps.length = ptr;
  }
};
class ReactiveEffect {
  constructor(fn, scheduler = null, scope) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    this.deps = [];
    this.parent = void 0;
    recordEffectScope(this, scope);
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    let parent = activeEffect;
    let lastShouldTrack = shouldTrack;
    while (parent) {
      if (parent === this) {
        return;
      }
      parent = parent.parent;
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;
      shouldTrack = true;
      trackOpBit = 1 << ++effectTrackDepth;
      if (effectTrackDepth <= maxMarkerBits) {
        initDepMarkers(this);
      } else {
        cleanupEffect(this);
      }
      return this.fn();
    } finally {
      if (effectTrackDepth <= maxMarkerBits) {
        finalizeDepMarkers(this);
      }
      trackOpBit = 1 << --effectTrackDepth;
      activeEffect = this.parent;
      shouldTrack = lastShouldTrack;
      this.parent = void 0;
      if (this.deferStop) {
        this.stop();
      }
    }
  }
  stop() {
    if (activeEffect === this) {
      this.deferStop = true;
    } else if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function toRaw(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? toRaw(raw) : observed;
}
function trackRefValue(ref2) {
  if (shouldTrack && activeEffect) {
    ref2 = toRaw(ref2);
    {
      trackEffects(ref2.dep || (ref2.dep = createDep()));
    }
  }
}

class ComputedRefImpl {
  constructor(getter, _setter, isReadonly2, isSSR) {
    this._setter = _setter;
    this.dep = void 0;
    this.__v_isRef = true;
    this["__v_isReadonly"] = false;
    this._dirty = true;
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });
    this.effect.computed = this;
    this.effect.active = this._cacheable = !isSSR;
    this["__v_isReadonly"] = isReadonly2;
  }
  get value() {
    const self2 = toRaw(this);
    trackRefValue(self2);
    if (self2._dirty || !self2._cacheable) {
      self2._dirty = false;
      self2._value = self2.effect.run();
    }
    return self2._value;
  }
  set value(newValue) {
    this._setter(newValue);
  }
}

function computed$1(getterOrOptions, debugOptions, isSSR = false) {
  let getter;
  let setter;
  const onlyGetter = isFunction(getterOrOptions);
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = NOOP;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter, isSSR);
  return cRef;
}
function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & 4;
}
let isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false) {
  isInSSRComponentSetup = isSSR;
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  initProps(instance, props, isStateful, isSSR);
  initSlots(instance, children);
  const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
  isInSSRComponentSetup = false;
  return setupResult;
}

const computed = (getterOrOptions, debugOptions) => {
  return computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
};

var __assign = function() {
  __assign = Object.assign || function __assign2(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p2 in s)
        if (Object.prototype.hasOwnProperty.call(s, p2))
          t[p2] = s[p2];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var EVALUATION_RE = /[[\].]{1,2}/g;
var INTERPOLATION_RE = /%\{((?:.|\n)+?)\}/g;
var MUSTACHE_SYNTAX_RE = /\{\{((?:.|\n)+?)\}\}/g;
var interpolate = function(plugin) {
  return function(msgid, context, disableHtmlEscaping, parent) {
    if (context === void 0) {
      context = {};
    }
    if (disableHtmlEscaping === void 0) {
      disableHtmlEscaping = false;
    }
    var silent = plugin.silent;
    if (!silent && MUSTACHE_SYNTAX_RE.test(msgid)) {
      console.warn('Mustache syntax cannot be used with vue-gettext. Please use "%{}" instead of "{{}}" in: '.concat(msgid));
    }
    var result = msgid.replace(INTERPOLATION_RE, function(_match, token) {
      var expression = token.trim();
      var evaluated;
      var escapeHtmlMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };
      function getProps(obj, expression2) {
        var arr = expression2.split(EVALUATION_RE).filter(function(x) {
          return x;
        });
        while (arr.length) {
          obj = obj[arr.shift()];
        }
        return obj;
      }
      function evalInContext(context2, expression2, parent2) {
        try {
          evaluated = getProps(context2, expression2);
        } catch (e) {
        }
        if (evaluated === void 0 || evaluated === null) {
          if (parent2) {
            return evalInContext(parent2.ctx, expression2, parent2.parent);
          } else {
            console.warn("Cannot evaluate expression: ".concat(expression2));
            evaluated = expression2;
          }
        }
        var result2 = evaluated.toString();
        if (disableHtmlEscaping) {
          return result2;
        }
        return result2.replace(/[&<>"']/g, function(m) {
          return escapeHtmlMap[m];
        });
      }
      return evalInContext(context, expression, parent);
    });
    return result;
  };
};
interpolate.INTERPOLATION_RE = INTERPOLATION_RE;
interpolate.INTERPOLATION_PREFIX = "%{";
var plurals = {
  getTranslationIndex: function(languageCode, n) {
    n = Number(n);
    n = typeof n === "number" && isNaN(n) ? 1 : n;
    if (languageCode.length > 2 && languageCode !== "pt_BR") {
      languageCode = languageCode.split("_")[0];
    }
    switch (languageCode) {
      case "ay":
      case "bo":
      case "cgg":
      case "dz":
      case "fa":
      case "id":
      case "ja":
      case "jbo":
      case "ka":
      case "kk":
      case "km":
      case "ko":
      case "ky":
      case "lo":
      case "ms":
      case "my":
      case "sah":
      case "su":
      case "th":
      case "tt":
      case "ug":
      case "vi":
      case "wo":
      case "zh":
        return 0;
      case "is":
        return n % 10 !== 1 || n % 100 === 11 ? 1 : 0;
      case "jv":
        return n !== 0 ? 1 : 0;
      case "mk":
        return n === 1 || n % 10 === 1 ? 0 : 1;
      case "ach":
      case "ak":
      case "am":
      case "arn":
      case "br":
      case "fil":
      case "fr":
      case "gun":
      case "ln":
      case "mfe":
      case "mg":
      case "mi":
      case "oc":
      case "pt_BR":
      case "tg":
      case "ti":
      case "tr":
      case "uz":
      case "wa":
        return n > 1 ? 1 : 0;
      case "lv":
        return n % 10 === 1 && n % 100 !== 11 ? 0 : n !== 0 ? 1 : 2;
      case "lt":
        return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
      case "be":
      case "bs":
      case "hr":
      case "ru":
      case "sr":
      case "uk":
        return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
      case "mnk":
        return n === 0 ? 0 : n === 1 ? 1 : 2;
      case "ro":
        return n === 1 ? 0 : n === 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2;
      case "pl":
        return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
      case "cs":
      case "sk":
        return n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
      case "csb":
        return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
      case "sl":
        return n % 100 === 1 ? 0 : n % 100 === 2 ? 1 : n % 100 === 3 || n % 100 === 4 ? 2 : 3;
      case "mt":
        return n === 1 ? 0 : n === 0 || n % 100 > 1 && n % 100 < 11 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3;
      case "gd":
        return n === 1 || n === 11 ? 0 : n === 2 || n === 12 ? 1 : n > 2 && n < 20 ? 2 : 3;
      case "cy":
        return n === 1 ? 0 : n === 2 ? 1 : n !== 8 && n !== 11 ? 2 : 3;
      case "kw":
        return n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : 3;
      case "ga":
        return n === 1 ? 0 : n === 2 ? 1 : n > 2 && n < 7 ? 2 : n > 6 && n < 11 ? 3 : 4;
      case "ar":
        return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
      default:
        return n !== 1 ? 1 : 0;
    }
  }
};
var translate = function(language) {
  return {
    /*
     * Get the translated string from the translation.json file generated by easygettext.
     *
     * @param {String} msgid - The translation key
     * @param {Number} n - The number to switch between singular and plural
     * @param {String} context - The translation key context
     * @param {String} defaultPlural - The default plural value (optional)
     * @param {String} language - The language ID (e.g. 'fr_FR' or 'en_US')
     *
     * @return {String} The translated string
     */
    getTranslation: function(msgid, n, context, defaultPlural, languageKey, parameters, disableHtmlEscaping) {
      if (n === void 0) {
        n = 1;
      }
      if (context === void 0) {
        context = null;
      }
      if (defaultPlural === void 0) {
        defaultPlural = null;
      }
      if (disableHtmlEscaping === void 0) {
        disableHtmlEscaping = false;
      }
      if (languageKey === void 0) {
        languageKey = language.current;
      }
      var interp = function(message, parameters2) {
        return parameters2 ? language.interpolate(message, parameters2, disableHtmlEscaping) : message;
      };
      msgid = msgid.trim();
      if (!msgid) {
        return "";
      }
      var silent = languageKey ? language.silent || language.muted.indexOf(languageKey) !== -1 : false;
      var noTransLangKey = languageKey;
      if (language.sourceCodeLanguage) {
        noTransLangKey = language.sourceCodeLanguage;
      }
      var untranslated = defaultPlural && plurals.getTranslationIndex(noTransLangKey, n) > 0 ? defaultPlural : msgid;
      var pluginTranslations = language.translations;
      var translations = pluginTranslations[languageKey] || pluginTranslations[languageKey.split("_")[0]];
      if (!translations) {
        if (!silent) {
          console.warn("No translations found for ".concat(languageKey));
        }
        return interp(untranslated, parameters);
      }
      var getTranslationFromArray = function(arr) {
        var translationIndex = plurals.getTranslationIndex(languageKey, n);
        if (arr.length === 1 && n === 1) {
          translationIndex = 0;
        }
        if (!arr[translationIndex]) {
          throw new Error(msgid + " " + translationIndex + " " + language.current + " " + n);
        }
        return interp(arr[translationIndex], parameters);
      };
      var getUntranslatedMsg = function() {
        if (!silent) {
          var msg = "Untranslated ".concat(languageKey, " key found: ").concat(msgid);
          if (context) {
            msg += " (with context: ".concat(context, ")");
          }
          console.warn(msg);
        }
        return interp(untranslated, parameters);
      };
      var translateMsg = function(msg, context2) {
        if (context2 === void 0) {
          context2 = null;
        }
        if (msg instanceof Object) {
          if (Array.isArray(msg)) {
            return getTranslationFromArray(msg);
          }
          var msgContext = context2 !== null && context2 !== void 0 ? context2 : "";
          var ctxVal = msg[msgContext];
          return translateMsg(ctxVal);
        }
        if (context2) {
          return getUntranslatedMsg();
        }
        if (!msg) {
          return getUntranslatedMsg();
        }
        return interp(msg, parameters);
      };
      var translated = translations[msgid];
      return translateMsg(translated, context);
    },
    /*
     * Returns a string of the translation of the message.
     * Also makes the string discoverable by gettext-extract.
     *
     * @param {String} msgid - The translation key
     * @param {Object} parameters - The interpolation parameters
     * @param {Boolean} disableHtmlEscaping - Disable html escaping
     *
     * @return {String} The translated string
     */
    gettext: function(msgid, parameters, disableHtmlEscaping) {
      if (disableHtmlEscaping === void 0) {
        disableHtmlEscaping = false;
      }
      return this.getTranslation(msgid, void 0, void 0, void 0, void 0, parameters, disableHtmlEscaping);
    },
    /*
     * Returns a string of the translation for the given context.
     * Also makes the string discoverable by gettext-extract.
     *
     * @param {String} context - The context of the string to translate
     * @param {String} msgid - The translation key
     * @param {Object} parameters - The interpolation parameters
     * @param {Boolean} disableHtmlEscaping - Disable html escaping
     *
     * @return {String} The translated string
     */
    pgettext: function(context, msgid, parameters, disableHtmlEscaping) {
      if (disableHtmlEscaping === void 0) {
        disableHtmlEscaping = false;
      }
      return this.getTranslation(msgid, 1, context, void 0, void 0, parameters, disableHtmlEscaping);
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
     * @param {Boolean} disableHtmlEscaping - Disable html escaping
     *
     * @return {String} The translated string
     */
    ngettext: function(msgid, plural, n, parameters, disableHtmlEscaping) {
      if (disableHtmlEscaping === void 0) {
        disableHtmlEscaping = false;
      }
      return this.getTranslation(msgid, n, null, plural, void 0, parameters, disableHtmlEscaping);
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
     * @param {Boolean} disableHtmlEscaping - Disable html escaping
     *
     * @return {String} The translated string
     */
    npgettext: function(context, msgid, plural, n, parameters, disableHtmlEscaping) {
      if (disableHtmlEscaping === void 0) {
        disableHtmlEscaping = false;
      }
      return this.getTranslation(msgid, n, context, plural, void 0, parameters, disableHtmlEscaping);
    }
  };
};
var GetTextSymbol = Symbol("GETTEXT");
function normalizeTranslationKey(key) {
  return key.replace(/\r?\n|\r/, "").replace(/\s\s+/g, " ").trim();
}
function normalizeTranslations(translations) {
  var newTranslations = {};
  Object.keys(translations).forEach(function(lang) {
    var langData = translations[lang];
    var newLangData = {};
    Object.keys(langData).forEach(function(key) {
      newLangData[normalizeTranslationKey(key)] = langData[key];
    });
    newTranslations[lang] = newLangData;
  });
  return newTranslations;
}
var useGettext = function() {
  var gettext = inject(GetTextSymbol, null);
  if (!gettext) {
    throw new Error("Failed to inject gettext. Make sure vue3-gettext is set up properly.");
  }
  return gettext;
};
var Component = defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names, vue/component-definition-name-casing
  name: "translate",
  props: {
    tag: {
      type: String,
      default: "span"
    },
    // Always use v-bind for dynamically binding the `translateN` prop to data on the parent,
    // i.e.: `:translate-n`.
    translateN: {
      type: Number,
      default: null
    },
    translatePlural: {
      type: String,
      default: null
    },
    translateContext: {
      type: String,
      default: null
    },
    translateParams: {
      type: Object,
      default: null
    },
    translateComment: {
      type: String,
      default: null
    }
  },
  setup: function(props, context) {
    var _a, _b, _c;
    var isPlural = props.translateN !== void 0 && props.translatePlural !== void 0;
    if (!isPlural && (props.translateN || props.translatePlural)) {
      throw new Error("`translate-n` and `translate-plural` attributes must be used together: ".concat((_c = (_b = (_a = context.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)[0]) === null || _c === void 0 ? void 0 : _c.children, "."));
    }
    var root = ref();
    var plugin = useGettext();
    var msgid = ref(null);
    onMounted(function() {
      if (!msgid.value && root.value) {
        msgid.value = root.value.innerHTML.trim();
      }
    });
    var translation = computed(function() {
      var _a2;
      var translatedMsg = translate(plugin).getTranslation(msgid.value, props.translateN, props.translateContext, isPlural ? props.translatePlural : null, plugin.current);
      return interpolate(plugin)(translatedMsg, props.translateParams, void 0, (_a2 = getCurrentInstance()) === null || _a2 === void 0 ? void 0 : _a2.parent);
    });
    return function() {
      if (!msgid.value) {
        return h(props.tag, { ref: root }, context.slots.default ? context.slots.default() : "");
      }
      return h(props.tag, { ref: root, innerHTML: translation.value });
    };
  }
});
var updateTranslation = function(language, el, binding, vnode) {
  var _a;
  var attrs = vnode.props || {};
  var msgid = el.dataset.msgid;
  var translateContext = attrs["translate-context"];
  var translateN = attrs["translate-n"];
  var translatePlural = attrs["translate-plural"];
  var isPlural = translateN !== void 0 && translatePlural !== void 0;
  var disableHtmlEscaping = attrs["render-html"] === "true";
  if (!isPlural && (translateN || translatePlural)) {
    throw new Error("`translate-n` and `translate-plural` attributes must be used together:" + msgid + ".");
  }
  if (!language.silent && attrs["translate-params"]) {
    console.warn("`translate-params` is required as an expression for v-translate directive. Please change to `v-translate='params'`: ".concat(msgid));
  }
  var translation = translate(language).getTranslation(msgid, translateN, translateContext, isPlural ? translatePlural : null, language.current);
  var context = Object.assign((_a = binding.instance) !== null && _a !== void 0 ? _a : {}, binding.value);
  var msg = interpolate(language)(translation, context, disableHtmlEscaping, null);
  el.innerHTML = msg;
};
function directive(language) {
  var update = function(el, binding, vnode) {
    el.dataset.currentLanguage = language.current;
    updateTranslation(language, el, binding, vnode);
  };
  return {
    beforeMount: function(el, binding, vnode) {
      if (!el.dataset.msgid) {
        el.dataset.msgid = el.innerHTML;
      }
      watch(language, function() {
        update(el, binding, vnode);
      });
      update(el, binding, vnode);
    },
    updated: function(el, binding, vnode) {
      update(el, binding, vnode);
    }
  };
}
var defaultOptions = {
  /** all the available languages of your application. Keys must match locale names */
  availableLanguages: { en: "English" },
  defaultLanguage: "en",
  sourceCodeLanguage: void 0,
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
    interpolate: ["$gettextInterpolate"]
  },
  provideDirective: true,
  provideComponent: true
};
function createGettext(options) {
  if (options === void 0) {
    options = {};
  }
  Object.keys(options).forEach(function(key) {
    if (Object.keys(defaultOptions).indexOf(key) === -1) {
      throw new Error("".concat(key, " is an invalid option for the translate plugin."));
    }
  });
  var mergedOptions = __assign(__assign({}, defaultOptions), options);
  var translations = ref(normalizeTranslations(mergedOptions.translations));
  var gettext = reactive({
    available: mergedOptions.availableLanguages,
    muted: mergedOptions.mutedLanguages,
    silent: mergedOptions.silent,
    translations: computed({
      get: function() {
        return translations.value;
      },
      set: function(val) {
        translations.value = normalizeTranslations(val);
      }
    }),
    current: mergedOptions.defaultLanguage,
    sourceCodeLanguage: mergedOptions.sourceCodeLanguage,
    install: function(app2) {
      app2[GetTextSymbol] = gettext;
      app2.provide(GetTextSymbol, gettext);
      if (mergedOptions.setGlobalProperties) {
        var globalProperties_1 = app2.config.globalProperties;
        var properties = mergedOptions.globalProperties.gettext || ["$gettext"];
        properties.forEach(function(p2) {
          globalProperties_1[p2] = gettext.$gettext;
        });
        properties = mergedOptions.globalProperties.pgettext || ["$pgettext"];
        properties.forEach(function(p2) {
          globalProperties_1[p2] = gettext.$pgettext;
        });
        properties = mergedOptions.globalProperties.ngettext || ["$ngettext"];
        properties.forEach(function(p2) {
          globalProperties_1[p2] = gettext.$ngettext;
        });
        properties = mergedOptions.globalProperties.npgettext || ["$npgettext"];
        properties.forEach(function(p2) {
          globalProperties_1[p2] = gettext.$npgettext;
        });
        properties = mergedOptions.globalProperties.interpolate || ["$gettextInterpolate"];
        properties.forEach(function(p2) {
          globalProperties_1[p2] = gettext.interpolate;
        });
        properties = mergedOptions.globalProperties.language || ["$language"];
        properties.forEach(function(p2) {
          globalProperties_1[p2] = gettext;
        });
      }
      if (mergedOptions.provideDirective) {
        app2.directive("translate", directive(gettext));
      }
      if (mergedOptions.provideComponent) {
        app2.component("translate", Component);
      }
    }
  });
  var translate$1 = translate(gettext);
  var interpolate$1 = interpolate(gettext);
  gettext.$gettext = translate$1.gettext.bind(translate$1);
  gettext.$pgettext = translate$1.pgettext.bind(translate$1);
  gettext.$ngettext = translate$1.ngettext.bind(translate$1);
  gettext.$npgettext = translate$1.npgettext.bind(translate$1);
  gettext.interpolate = interpolate$1.bind(interpolate$1);
  gettext.directive = directive(gettext);
  gettext.component = Component;
  return gettext;
}
