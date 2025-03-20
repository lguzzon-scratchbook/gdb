var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __toCommonJS = (from) => {
  const moduleCache = __toCommonJS.moduleCache ??= new WeakMap;
  var cached = moduleCache.get(from);
  if (cached)
    return cached;
  var to = __defProp({}, "__esModule", { value: true });
  var desc = { enumerable: false };
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
  }
  moduleCache.set(from, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// node_modules/ms/index.js
var require_ms = __commonJS((exports, module) => {
  var parse = function(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return;
    }
  };
  var fmtShort = function(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return Math.round(ms / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms / s) + "s";
    }
    return ms + "ms";
  };
  var fmtLong = function(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return plural(ms, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms, msAbs, s, "second");
    }
    return ms + " ms";
  };
  var plural = function(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  };
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  module.exports = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
});

// node_modules/debug/src/common.js
var require_common = __commonJS((exports, module) => {
  var setup = function(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = require_ms();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0;i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug(...args) {
        if (!debug.enabled) {
          return;
        }
        const self2 = debug;
        const curr = Number(new Date);
        const ms = curr - (prevTime || curr);
        self2.diff = ms;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self2, args);
        const logFn = self2.log || createDebug.log;
        logFn.apply(self2, args);
      }
      debug.namespace = namespace;
      debug.useColors = createDebug.useColors();
      debug.color = createDebug.selectColor(namespace);
      debug.extend = extend;
      debug.destroy = createDebug.destroy;
      Object.defineProperty(debug, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug);
      }
      return debug;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(" ", ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  };
  module.exports = setup;
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS((exports, module) => {
  var useColors = function() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    let m;
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  };
  var formatArgs = function(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match) => {
      if (match === "%%") {
        return;
      }
      index++;
      if (match === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  };
  var save = function(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {
    }
  };
  var load = function() {
    let r;
    try {
      r = exports.storage.getItem("debug");
    } catch (error) {
    }
    if (!r && typeof process !== "undefined" && ("env" in process)) {
      r = process.env.DEBUG;
    }
    return r;
  };
  var localstorage = function() {
    try {
      return localStorage;
    } catch (error) {
    }
  };
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  exports.log = console.debug || console.log || (() => {
  });
  module.exports = require_common()(exports);
  var { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
});

// node:events
var exports_events = {};
__export(exports_events, {
  prototype: () => {
    {
      return P;
    }
  },
  once: () => {
    {
      return M;
    }
  },
  default: () => {
    {
      return A;
    }
  },
  EventEmitter: () => {
    {
      return o;
    }
  }
});
var x, o, v, m, y, C, g, _, w, b, j, R, M, N, E, a, d, l, L, h, A, P;
var init_events = __esm(() => {
  x = function(t) {
    console && console.warn && console.warn(t);
  };
  o = function() {
    o.init.call(this);
  };
  v = function(t) {
    if (typeof t != "function")
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof t);
  };
  m = function(t) {
    return t._maxListeners === undefined ? o.defaultMaxListeners : t._maxListeners;
  };
  y = function(t, e, n, r) {
    var i, f, s;
    if (v(n), f = t._events, f === undefined ? (f = t._events = Object.create(null), t._eventsCount = 0) : (f.newListener !== undefined && (t.emit("newListener", e, n.listener ? n.listener : n), f = t._events), s = f[e]), s === undefined)
      s = f[e] = n, ++t._eventsCount;
    else if (typeof s == "function" ? s = f[e] = r ? [n, s] : [s, n] : r ? s.unshift(n) : s.push(n), i = m(t), i > 0 && s.length > i && !s.warned) {
      s.warned = true;
      var u = new Error("Possible EventEmitter memory leak detected. " + s.length + " " + String(e) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      u.name = "MaxListenersExceededWarning", u.emitter = t, u.type = e, u.count = s.length, x(u);
    }
    return t;
  };
  C = function() {
    if (!this.fired)
      return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  };
  g = function(t, e, n) {
    var r = { fired: false, wrapFn: undefined, target: t, type: e, listener: n }, i = C.bind(r);
    return i.listener = n, r.wrapFn = i, i;
  };
  _ = function(t, e, n) {
    var r = t._events;
    if (r === undefined)
      return [];
    var i = r[e];
    return i === undefined ? [] : typeof i == "function" ? n ? [i.listener || i] : [i] : n ? R(i) : b(i, i.length);
  };
  w = function(t) {
    var e = this._events;
    if (e !== undefined) {
      var n = e[t];
      if (typeof n == "function")
        return 1;
      if (n !== undefined)
        return n.length;
    }
    return 0;
  };
  b = function(t, e) {
    for (var n = new Array(e), r = 0;r < e; ++r)
      n[r] = t[r];
    return n;
  };
  j = function(t, e) {
    for (;e + 1 < t.length; e++)
      t[e] = t[e + 1];
    t.pop();
  };
  R = function(t) {
    for (var e = new Array(t.length), n = 0;n < e.length; ++n)
      e[n] = t[n].listener || t[n];
    return e;
  };
  M = function(t, e) {
    return new Promise(function(n, r) {
      function i(s) {
        t.removeListener(e, f), r(s);
      }
      function f() {
        typeof t.removeListener == "function" && t.removeListener("error", i), n([].slice.call(arguments));
      }
      E(t, e, f, { once: true }), e !== "error" && N(t, i, { once: true });
    });
  };
  N = function(t, e, n) {
    typeof t.on == "function" && E(t, "error", e, n);
  };
  E = function(t, e, n, r) {
    if (typeof t.on == "function")
      r.once ? t.once(e, n) : t.on(e, n);
    else if (typeof t.addEventListener == "function")
      t.addEventListener(e, function i(f) {
        r.once && t.removeEventListener(e, i), n(f);
      });
    else
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof t);
  };
  a = typeof Reflect == "object" ? Reflect : null;
  d = a && typeof a.apply == "function" ? a.apply : function(e, n, r) {
    return Function.prototype.apply.call(e, n, r);
  };
  a && typeof a.ownKeys == "function" ? l = a.ownKeys : Object.getOwnPropertySymbols ? l = function(e) {
    return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
  } : l = function(e) {
    return Object.getOwnPropertyNames(e);
  };
  L = Number.isNaN || function(e) {
    return e !== e;
  };
  o.EventEmitter = o;
  o.prototype._events = undefined;
  o.prototype._eventsCount = 0;
  o.prototype._maxListeners = undefined;
  h = 10;
  Object.defineProperty(o, "defaultMaxListeners", { enumerable: true, get: function() {
    return h;
  }, set: function(t) {
    if (typeof t != "number" || t < 0 || L(t))
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + t + ".");
    h = t;
  } });
  o.init = function() {
    (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) && (this._events = Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || undefined;
  };
  o.prototype.setMaxListeners = function(e) {
    if (typeof e != "number" || e < 0 || L(e))
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
    return this._maxListeners = e, this;
  };
  o.prototype.getMaxListeners = function() {
    return m(this);
  };
  o.prototype.emit = function(e) {
    for (var n = [], r = 1;r < arguments.length; r++)
      n.push(arguments[r]);
    var i = e === "error", f = this._events;
    if (f !== undefined)
      i = i && f.error === undefined;
    else if (!i)
      return false;
    if (i) {
      var s;
      if (n.length > 0 && (s = n[0]), s instanceof Error)
        throw s;
      var u = new Error("Unhandled error." + (s ? " (" + s.message + ")" : ""));
      throw u.context = s, u;
    }
    var c = f[e];
    if (c === undefined)
      return false;
    if (typeof c == "function")
      d(c, this, n);
    else
      for (var p = c.length, O = b(c, p), r = 0;r < p; ++r)
        d(O[r], this, n);
    return true;
  };
  o.prototype.addListener = function(e, n) {
    return y(this, e, n, false);
  };
  o.prototype.on = o.prototype.addListener;
  o.prototype.prependListener = function(e, n) {
    return y(this, e, n, true);
  };
  o.prototype.once = function(e, n) {
    return v(n), this.on(e, g(this, e, n)), this;
  };
  o.prototype.prependOnceListener = function(e, n) {
    return v(n), this.prependListener(e, g(this, e, n)), this;
  };
  o.prototype.removeListener = function(e, n) {
    var r, i, f, s, u;
    if (v(n), i = this._events, i === undefined)
      return this;
    if (r = i[e], r === undefined)
      return this;
    if (r === n || r.listener === n)
      --this._eventsCount === 0 ? this._events = Object.create(null) : (delete i[e], i.removeListener && this.emit("removeListener", e, r.listener || n));
    else if (typeof r != "function") {
      for (f = -1, s = r.length - 1;s >= 0; s--)
        if (r[s] === n || r[s].listener === n) {
          u = r[s].listener, f = s;
          break;
        }
      if (f < 0)
        return this;
      f === 0 ? r.shift() : j(r, f), r.length === 1 && (i[e] = r[0]), i.removeListener !== undefined && this.emit("removeListener", e, u || n);
    }
    return this;
  };
  o.prototype.off = o.prototype.removeListener;
  o.prototype.removeAllListeners = function(e) {
    var n, r, i;
    if (r = this._events, r === undefined)
      return this;
    if (r.removeListener === undefined)
      return arguments.length === 0 ? (this._events = Object.create(null), this._eventsCount = 0) : r[e] !== undefined && (--this._eventsCount === 0 ? this._events = Object.create(null) : delete r[e]), this;
    if (arguments.length === 0) {
      var f = Object.keys(r), s;
      for (i = 0;i < f.length; ++i)
        s = f[i], s !== "removeListener" && this.removeAllListeners(s);
      return this.removeAllListeners("removeListener"), this._events = Object.create(null), this._eventsCount = 0, this;
    }
    if (n = r[e], typeof n == "function")
      this.removeListener(e, n);
    else if (n !== undefined)
      for (i = n.length - 1;i >= 0; i--)
        this.removeListener(e, n[i]);
    return this;
  };
  o.prototype.listeners = function(e) {
    return _(this, e, true);
  };
  o.prototype.rawListeners = function(e) {
    return _(this, e, false);
  };
  o.listenerCount = function(t, e) {
    return typeof t.listenerCount == "function" ? t.listenerCount(e) : w.call(t, e);
  };
  o.prototype.listenerCount = w;
  o.prototype.eventNames = function() {
    return this._eventsCount > 0 ? l(this._events) : [];
  };
  A = o;
  P = o.prototype;
});

// node_modules/fast-fifo/fixed-size.js
var require_fixed_size = __commonJS((exports, module) => {
  module.exports = class FixedFIFO {
    constructor(hwm) {
      if (!(hwm > 0) || (hwm - 1 & hwm) !== 0)
        throw new Error("Max size for a FixedFIFO should be a power of two");
      this.buffer = new Array(hwm);
      this.mask = hwm - 1;
      this.top = 0;
      this.btm = 0;
      this.next = null;
    }
    clear() {
      this.top = this.btm = 0;
      this.next = null;
      this.buffer.fill(undefined);
    }
    push(data) {
      if (this.buffer[this.top] !== undefined)
        return false;
      this.buffer[this.top] = data;
      this.top = this.top + 1 & this.mask;
      return true;
    }
    shift() {
      const last = this.buffer[this.btm];
      if (last === undefined)
        return;
      this.buffer[this.btm] = undefined;
      this.btm = this.btm + 1 & this.mask;
      return last;
    }
    peek() {
      return this.buffer[this.btm];
    }
    isEmpty() {
      return this.buffer[this.btm] === undefined;
    }
  };
});

// node_modules/fast-fifo/index.js
var require_fast_fifo = __commonJS((exports, module) => {
  var FixedFIFO = require_fixed_size();
  module.exports = class FastFIFO {
    constructor(hwm) {
      this.hwm = hwm || 16;
      this.head = new FixedFIFO(this.hwm);
      this.tail = this.head;
      this.length = 0;
    }
    clear() {
      this.head = this.tail;
      this.head.clear();
      this.length = 0;
    }
    push(val) {
      this.length++;
      if (!this.head.push(val)) {
        const prev = this.head;
        this.head = prev.next = new FixedFIFO(2 * this.head.buffer.length);
        this.head.push(val);
      }
    }
    shift() {
      if (this.length !== 0)
        this.length--;
      const val = this.tail.shift();
      if (val === undefined && this.tail.next) {
        const next = this.tail.next;
        this.tail.next = null;
        this.tail = next;
        return this.tail.shift();
      }
      return val;
    }
    peek() {
      const val = this.tail.peek();
      if (val === undefined && this.tail.next)
        return this.tail.next.peek();
      return val;
    }
    isEmpty() {
      return this.length === 0;
    }
  };
});

// node_modules/b4a/lib/ascii.js
var require_ascii = __commonJS((exports, module) => {
  var byteLength = function(string) {
    return string.length;
  };
  var toString2 = function(buffer) {
    const len = buffer.byteLength;
    let result = "";
    for (let i = 0;i < len; i++) {
      result += String.fromCharCode(buffer[i]);
    }
    return result;
  };
  var write = function(buffer, string, offset = 0, length = byteLength(string)) {
    const len = Math.min(length, buffer.byteLength - offset);
    for (let i = 0;i < len; i++) {
      buffer[offset + i] = string.charCodeAt(i);
    }
    return len;
  };
  module.exports = {
    byteLength,
    toString: toString2,
    write
  };
});

// node_modules/b4a/lib/base64.js
var require_base64 = __commonJS((exports, module) => {
  var byteLength = function(string) {
    let len = string.length;
    if (string.charCodeAt(len - 1) === 61)
      len--;
    if (len > 1 && string.charCodeAt(len - 1) === 61)
      len--;
    return len * 3 >>> 2;
  };
  var toString2 = function(buffer) {
    const len = buffer.byteLength;
    let result = "";
    for (let i = 0;i < len; i += 3) {
      result += alphabet[buffer[i] >> 2] + alphabet[(buffer[i] & 3) << 4 | buffer[i + 1] >> 4] + alphabet[(buffer[i + 1] & 15) << 2 | buffer[i + 2] >> 6] + alphabet[buffer[i + 2] & 63];
    }
    if (len % 3 === 2) {
      result = result.substring(0, result.length - 1) + "=";
    } else if (len % 3 === 1) {
      result = result.substring(0, result.length - 2) + "==";
    }
    return result;
  };
  var write = function(buffer, string, offset = 0, length = byteLength(string)) {
    const len = Math.min(length, buffer.byteLength - offset);
    for (let i = 0, j2 = 0;j2 < len; i += 4) {
      const a2 = codes[string.charCodeAt(i)];
      const b2 = codes[string.charCodeAt(i + 1)];
      const c = codes[string.charCodeAt(i + 2)];
      const d2 = codes[string.charCodeAt(i + 3)];
      buffer[j2++] = a2 << 2 | b2 >> 4;
      buffer[j2++] = (b2 & 15) << 4 | c >> 2;
      buffer[j2++] = (c & 3) << 6 | d2 & 63;
    }
    return len;
  };
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var codes = new Uint8Array(256);
  for (let i = 0;i < alphabet.length; i++) {
    codes[alphabet.charCodeAt(i)] = i;
  }
  codes[45] = 62;
  codes[95] = 63;
  module.exports = {
    byteLength,
    toString: toString2,
    write
  };
});

// node_modules/b4a/lib/hex.js
var require_hex = __commonJS((exports, module) => {
  var byteLength = function(string) {
    return string.length >>> 1;
  };
  var toString2 = function(buffer) {
    const len = buffer.byteLength;
    buffer = new DataView(buffer.buffer, buffer.byteOffset, len);
    let result = "";
    let i = 0;
    for (let n = len - len % 4;i < n; i += 4) {
      result += buffer.getUint32(i).toString(16).padStart(8, "0");
    }
    for (;i < len; i++) {
      result += buffer.getUint8(i).toString(16).padStart(2, "0");
    }
    return result;
  };
  var write = function(buffer, string, offset = 0, length = byteLength(string)) {
    const len = Math.min(length, buffer.byteLength - offset);
    for (let i = 0;i < len; i++) {
      const a2 = hexValue(string.charCodeAt(i * 2));
      const b2 = hexValue(string.charCodeAt(i * 2 + 1));
      if (a2 === undefined || b2 === undefined) {
        return buffer.subarray(0, i);
      }
      buffer[offset + i] = a2 << 4 | b2;
    }
    return len;
  };
  var hexValue = function(char) {
    if (char >= 48 && char <= 57)
      return char - 48;
    if (char >= 65 && char <= 70)
      return char - 65 + 10;
    if (char >= 97 && char <= 102)
      return char - 97 + 10;
  };
  module.exports = {
    byteLength,
    toString: toString2,
    write
  };
});

// node_modules/b4a/lib/utf8.js
var require_utf8 = __commonJS((exports, module) => {
  var byteLength = function(string) {
    let length = 0;
    for (let i = 0, n = string.length;i < n; i++) {
      const code = string.charCodeAt(i);
      if (code >= 55296 && code <= 56319 && i + 1 < n) {
        const code2 = string.charCodeAt(i + 1);
        if (code2 >= 56320 && code2 <= 57343) {
          length += 4;
          i++;
          continue;
        }
      }
      if (code <= 127)
        length += 1;
      else if (code <= 2047)
        length += 2;
      else
        length += 3;
    }
    return length;
  };
  var toString2;
  if (typeof TextDecoder !== "undefined") {
    const decoder2 = new TextDecoder;
    toString2 = function toString(buffer) {
      return decoder2.decode(buffer);
    };
  } else {
    toString2 = function toString(buffer) {
      const len = buffer.byteLength;
      let output = "";
      let i = 0;
      while (i < len) {
        let byte = buffer[i];
        if (byte <= 127) {
          output += String.fromCharCode(byte);
          i++;
          continue;
        }
        let bytesNeeded = 0;
        let codePoint = 0;
        if (byte <= 223) {
          bytesNeeded = 1;
          codePoint = byte & 31;
        } else if (byte <= 239) {
          bytesNeeded = 2;
          codePoint = byte & 15;
        } else if (byte <= 244) {
          bytesNeeded = 3;
          codePoint = byte & 7;
        }
        if (len - i - bytesNeeded > 0) {
          let k = 0;
          while (k < bytesNeeded) {
            byte = buffer[i + k + 1];
            codePoint = codePoint << 6 | byte & 63;
            k += 1;
          }
        } else {
          codePoint = 65533;
          bytesNeeded = len - i;
        }
        output += String.fromCodePoint(codePoint);
        i += bytesNeeded + 1;
      }
      return output;
    };
  }
  var write;
  if (typeof TextEncoder !== "undefined") {
    const encoder2 = new TextEncoder;
    write = function write(buffer, string, offset = 0, length = byteLength(string)) {
      const len = Math.min(length, buffer.byteLength - offset);
      encoder2.encodeInto(string, buffer.subarray(offset, offset + len));
      return len;
    };
  } else {
    write = function write(buffer, string, offset = 0, length = byteLength(string)) {
      const len = Math.min(length, buffer.byteLength - offset);
      buffer = buffer.subarray(offset, offset + len);
      let i = 0;
      let j2 = 0;
      while (i < string.length) {
        const code = string.codePointAt(i);
        if (code <= 127) {
          buffer[j2++] = code;
          i++;
          continue;
        }
        let count = 0;
        let bits = 0;
        if (code <= 2047) {
          count = 6;
          bits = 192;
        } else if (code <= 65535) {
          count = 12;
          bits = 224;
        } else if (code <= 2097151) {
          count = 18;
          bits = 240;
        }
        buffer[j2++] = bits | code >> count;
        count -= 6;
        while (count >= 0) {
          buffer[j2++] = 128 | code >> count & 63;
          count -= 6;
        }
        i += code >= 65536 ? 2 : 1;
      }
      return len;
    };
  }
  module.exports = {
    byteLength,
    toString: toString2,
    write
  };
});

// node_modules/b4a/lib/utf16le.js
var require_utf16le = __commonJS((exports, module) => {
  var byteLength = function(string) {
    return string.length * 2;
  };
  var toString2 = function(buffer) {
    const len = buffer.byteLength;
    let result = "";
    for (let i = 0;i < len - 1; i += 2) {
      result += String.fromCharCode(buffer[i] + buffer[i + 1] * 256);
    }
    return result;
  };
  var write = function(buffer, string, offset = 0, length = byteLength(string)) {
    const len = Math.min(length, buffer.byteLength - offset);
    let units = len;
    for (let i = 0;i < string.length; ++i) {
      if ((units -= 2) < 0)
        break;
      const c = string.charCodeAt(i);
      const hi = c >> 8;
      const lo = c % 256;
      buffer[offset + i * 2] = lo;
      buffer[offset + i * 2 + 1] = hi;
    }
    return len;
  };
  module.exports = {
    byteLength,
    toString: toString2,
    write
  };
});

// node_modules/b4a/browser.js
var require_browser2 = __commonJS((exports, module) => {
  var codecFor = function(encoding) {
    switch (encoding) {
      case "ascii":
        return ascii;
      case "base64":
        return base64;
      case "hex":
        return hex;
      case "utf8":
      case "utf-8":
      case undefined:
      case null:
        return utf84;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return utf16le;
      default:
        throw new Error(`Unknown encoding: ${encoding}`);
    }
  };
  var isBuffer = function(value) {
    return value instanceof Uint8Array;
  };
  var isEncoding = function(encoding) {
    try {
      codecFor(encoding);
      return true;
    } catch {
      return false;
    }
  };
  var alloc2 = function(size, fill2, encoding) {
    const buffer = new Uint8Array(size);
    if (fill2 !== undefined)
      exports.fill(buffer, fill2, 0, buffer.byteLength, encoding);
    return buffer;
  };
  var allocUnsafe = function(size) {
    return new Uint8Array(size);
  };
  var allocUnsafeSlow = function(size) {
    return new Uint8Array(size);
  };
  var byteLength = function(string, encoding) {
    return codecFor(encoding).byteLength(string);
  };
  var compare = function(a2, b2) {
    if (a2 === b2)
      return 0;
    const len = Math.min(a2.byteLength, b2.byteLength);
    a2 = new DataView(a2.buffer, a2.byteOffset, a2.byteLength);
    b2 = new DataView(b2.buffer, b2.byteOffset, b2.byteLength);
    let i = 0;
    for (let n = len - len % 4;i < n; i += 4) {
      const x2 = a2.getUint32(i, LE);
      const y2 = b2.getUint32(i, LE);
      if (x2 !== y2)
        break;
    }
    for (;i < len; i++) {
      const x2 = a2.getUint8(i);
      const y2 = b2.getUint8(i);
      if (x2 < y2)
        return -1;
      if (x2 > y2)
        return 1;
    }
    return a2.byteLength > b2.byteLength ? 1 : a2.byteLength < b2.byteLength ? -1 : 0;
  };
  var concat = function(buffers, totalLength) {
    if (totalLength === undefined) {
      totalLength = buffers.reduce((len, buffer) => len + buffer.byteLength, 0);
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
      if (offset + buffer.byteLength > result.byteLength) {
        const sub = buffer.subarray(0, result.byteLength - offset);
        result.set(sub, offset);
        return result;
      }
      result.set(buffer, offset);
      offset += buffer.byteLength;
    }
    return result;
  };
  var copy = function(source, target, targetStart = 0, start = 0, end = source.byteLength) {
    if (end > 0 && end < start)
      return 0;
    if (end === start)
      return 0;
    if (source.byteLength === 0 || target.byteLength === 0)
      return 0;
    if (targetStart < 0)
      throw new RangeError("targetStart is out of range");
    if (start < 0 || start >= source.byteLength)
      throw new RangeError("sourceStart is out of range");
    if (end < 0)
      throw new RangeError("sourceEnd is out of range");
    if (targetStart >= target.byteLength)
      targetStart = target.byteLength;
    if (end > source.byteLength)
      end = source.byteLength;
    if (target.byteLength - targetStart < end - start) {
      end = target.length - targetStart + start;
    }
    const len = end - start;
    if (source === target) {
      target.copyWithin(targetStart, start, end);
    } else {
      target.set(source.subarray(start, end), targetStart);
    }
    return len;
  };
  var equals = function(a2, b2) {
    if (a2 === b2)
      return true;
    if (a2.byteLength !== b2.byteLength)
      return false;
    const len = a2.byteLength;
    a2 = new DataView(a2.buffer, a2.byteOffset, a2.byteLength);
    b2 = new DataView(b2.buffer, b2.byteOffset, b2.byteLength);
    let i = 0;
    for (let n = len - len % 4;i < n; i += 4) {
      if (a2.getUint32(i, LE) !== b2.getUint32(i, LE))
        return false;
    }
    for (;i < len; i++) {
      if (a2.getUint8(i) !== b2.getUint8(i))
        return false;
    }
    return true;
  };
  var fill = function(buffer, value, offset, end, encoding) {
    if (typeof value === "string") {
      if (typeof offset === "string") {
        encoding = offset;
        offset = 0;
        end = buffer.byteLength;
      } else if (typeof end === "string") {
        encoding = end;
        end = buffer.byteLength;
      }
    } else if (typeof value === "number") {
      value = value & 255;
    } else if (typeof value === "boolean") {
      value = +value;
    }
    if (offset < 0 || buffer.byteLength < offset || buffer.byteLength < end) {
      throw new RangeError("Out of range index");
    }
    if (offset === undefined)
      offset = 0;
    if (end === undefined)
      end = buffer.byteLength;
    if (end <= offset)
      return buffer;
    if (!value)
      value = 0;
    if (typeof value === "number") {
      for (let i = offset;i < end; ++i) {
        buffer[i] = value;
      }
    } else {
      value = isBuffer(value) ? value : from(value, encoding);
      const len = value.byteLength;
      for (let i = 0;i < end - offset; ++i) {
        buffer[i + offset] = value[i % len];
      }
    }
    return buffer;
  };
  var from = function(value, encodingOrOffset, length) {
    if (typeof value === "string")
      return fromString(value, encodingOrOffset);
    if (Array.isArray(value))
      return fromArray(value);
    if (ArrayBuffer.isView(value))
      return fromBuffer(value);
    return fromArrayBuffer(value, encodingOrOffset, length);
  };
  var fromString = function(string, encoding) {
    const codec = codecFor(encoding);
    const buffer = new Uint8Array(codec.byteLength(string));
    codec.write(buffer, string, 0, buffer.byteLength);
    return buffer;
  };
  var fromArray = function(array) {
    const buffer = new Uint8Array(array.length);
    buffer.set(array);
    return buffer;
  };
  var fromBuffer = function(buffer) {
    const copy2 = new Uint8Array(buffer.byteLength);
    copy2.set(buffer);
    return copy2;
  };
  var fromArrayBuffer = function(arrayBuffer, byteOffset, length) {
    return new Uint8Array(arrayBuffer, byteOffset, length);
  };
  var includes = function(buffer, value, byteOffset, encoding) {
    return indexOf(buffer, value, byteOffset, encoding) !== -1;
  };
  var bidirectionalIndexOf = function(buffer, value, byteOffset, encoding, first) {
    if (buffer.byteLength === 0)
      return -1;
    if (typeof byteOffset === "string") {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset === undefined) {
      byteOffset = first ? 0 : buffer.length - 1;
    } else if (byteOffset < 0) {
      byteOffset += buffer.byteLength;
    }
    if (byteOffset >= buffer.byteLength) {
      if (first)
        return -1;
      else
        byteOffset = buffer.byteLength - 1;
    } else if (byteOffset < 0) {
      if (first)
        byteOffset = 0;
      else
        return -1;
    }
    if (typeof value === "string") {
      value = from(value, encoding);
    } else if (typeof value === "number") {
      value = value & 255;
      if (first) {
        return buffer.indexOf(value, byteOffset);
      } else {
        return buffer.lastIndexOf(value, byteOffset);
      }
    }
    if (value.byteLength === 0)
      return -1;
    if (first) {
      let foundIndex = -1;
      for (let i = byteOffset;i < buffer.byteLength; i++) {
        if (buffer[i] === value[foundIndex === -1 ? 0 : i - foundIndex]) {
          if (foundIndex === -1)
            foundIndex = i;
          if (i - foundIndex + 1 === value.byteLength)
            return foundIndex;
        } else {
          if (foundIndex !== -1)
            i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + value.byteLength > buffer.byteLength) {
        byteOffset = buffer.byteLength - value.byteLength;
      }
      for (let i = byteOffset;i >= 0; i--) {
        let found = true;
        for (let j2 = 0;j2 < value.byteLength; j2++) {
          if (buffer[i + j2] !== value[j2]) {
            found = false;
            break;
          }
        }
        if (found)
          return i;
      }
    }
    return -1;
  };
  var indexOf = function(buffer, value, byteOffset, encoding) {
    return bidirectionalIndexOf(buffer, value, byteOffset, encoding, true);
  };
  var lastIndexOf = function(buffer, value, byteOffset, encoding) {
    return bidirectionalIndexOf(buffer, value, byteOffset, encoding, false);
  };
  var swap = function(buffer, n, m2) {
    const i = buffer[n];
    buffer[n] = buffer[m2];
    buffer[m2] = i;
  };
  var swap16 = function(buffer) {
    const len = buffer.byteLength;
    if (len % 2 !== 0)
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    for (let i = 0;i < len; i += 2)
      swap(buffer, i, i + 1);
    return buffer;
  };
  var swap32 = function(buffer) {
    const len = buffer.byteLength;
    if (len % 4 !== 0)
      throw new RangeError("Buffer size must be a multiple of 32-bits");
    for (let i = 0;i < len; i += 4) {
      swap(buffer, i, i + 3);
      swap(buffer, i + 1, i + 2);
    }
    return buffer;
  };
  var swap64 = function(buffer) {
    const len = buffer.byteLength;
    if (len % 8 !== 0)
      throw new RangeError("Buffer size must be a multiple of 64-bits");
    for (let i = 0;i < len; i += 8) {
      swap(buffer, i, i + 7);
      swap(buffer, i + 1, i + 6);
      swap(buffer, i + 2, i + 5);
      swap(buffer, i + 3, i + 4);
    }
    return buffer;
  };
  var toBuffer = function(buffer) {
    return buffer;
  };
  var toString2 = function(buffer, encoding, start = 0, end = buffer.byteLength) {
    const len = buffer.byteLength;
    if (start >= len)
      return "";
    if (end <= start)
      return "";
    if (start < 0)
      start = 0;
    if (end > len)
      end = len;
    if (start !== 0 || end < len)
      buffer = buffer.subarray(start, end);
    return codecFor(encoding).toString(buffer);
  };
  var write = function(buffer, string, offset, length, encoding) {
    if (offset === undefined) {
      encoding = "utf8";
    } else if (length === undefined && typeof offset === "string") {
      encoding = offset;
      offset = undefined;
    } else if (encoding === undefined && typeof length === "string") {
      encoding = length;
      length = undefined;
    }
    return codecFor(encoding).write(buffer, string, offset, length);
  };
  var writeDoubleLE = function(buffer, value, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    view.setFloat64(offset, value, true);
    return offset + 8;
  };
  var writeFloatLE = function(buffer, value, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    view.setFloat32(offset, value, true);
    return offset + 4;
  };
  var writeUInt32LE = function(buffer, value, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    view.setUint32(offset, value, true);
    return offset + 4;
  };
  var writeInt32LE = function(buffer, value, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    view.setInt32(offset, value, true);
    return offset + 4;
  };
  var readDoubleLE = function(buffer, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return view.getFloat64(offset, true);
  };
  var readFloatLE = function(buffer, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return view.getFloat32(offset, true);
  };
  var readUInt32LE = function(buffer, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return view.getUint32(offset, true);
  };
  var readInt32LE = function(buffer, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return view.getInt32(offset, true);
  };
  var writeDoubleBE = function(buffer, value, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    view.setFloat64(offset, value, false);
    return offset + 8;
  };
  var writeFloatBE = function(buffer, value, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    view.setFloat32(offset, value, false);
    return offset + 4;
  };
  var writeUInt32BE = function(buffer, value, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    view.setUint32(offset, value, false);
    return offset + 4;
  };
  var writeInt32BE = function(buffer, value, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    view.setInt32(offset, value, false);
    return offset + 4;
  };
  var readDoubleBE = function(buffer, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return view.getFloat64(offset, false);
  };
  var readFloatBE = function(buffer, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return view.getFloat32(offset, false);
  };
  var readUInt32BE = function(buffer, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return view.getUint32(offset, false);
  };
  var readInt32BE = function(buffer, offset) {
    if (offset === undefined)
      offset = 0;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return view.getInt32(offset, false);
  };
  var ascii = require_ascii();
  var base64 = require_base64();
  var hex = require_hex();
  var utf84 = require_utf8();
  var utf16le = require_utf16le();
  var LE = new Uint8Array(Uint16Array.of(255).buffer)[0] === 255;
  module.exports = exports = {
    isBuffer,
    isEncoding,
    alloc: alloc2,
    allocUnsafe,
    allocUnsafeSlow,
    byteLength,
    compare,
    concat,
    copy,
    equals,
    fill,
    from,
    includes,
    indexOf,
    lastIndexOf,
    swap16,
    swap32,
    swap64,
    toBuffer,
    toString: toString2,
    write,
    writeDoubleLE,
    writeFloatLE,
    writeUInt32LE,
    writeInt32LE,
    readDoubleLE,
    readFloatLE,
    readUInt32LE,
    readInt32LE,
    writeDoubleBE,
    writeFloatBE,
    writeUInt32BE,
    writeInt32BE,
    readDoubleBE,
    readFloatBE,
    readUInt32BE,
    readInt32BE
  };
});

// node_modules/text-decoder/lib/pass-through-decoder.js
var require_pass_through_decoder = __commonJS((exports, module) => {
  var b4a = require_browser2();
  module.exports = class PassThroughDecoder {
    constructor(encoding) {
      this.encoding = encoding;
    }
    decode(tail) {
      return b4a.toString(tail, this.encoding);
    }
    flush() {
      return "";
    }
  };
});

// node_modules/text-decoder/lib/utf8-decoder.js
var require_utf8_decoder = __commonJS((exports, module) => {
  var b4a = require_browser2();
  module.exports = class UTF8Decoder {
    constructor() {
      this.codePoint = 0;
      this.bytesSeen = 0;
      this.bytesNeeded = 0;
      this.lowerBoundary = 128;
      this.upperBoundary = 191;
    }
    decode(data) {
      if (this.bytesNeeded === 0) {
        let isBoundary = true;
        for (let i = Math.max(0, data.byteLength - 4), n = data.byteLength;i < n && isBoundary; i++) {
          isBoundary = data[i] <= 127;
        }
        if (isBoundary)
          return b4a.toString(data, "utf8");
      }
      let result = "";
      for (let i = 0, n = data.byteLength;i < n; i++) {
        const byte = data[i];
        if (this.bytesNeeded === 0) {
          if (byte <= 127) {
            result += String.fromCharCode(byte);
          } else if (byte >= 194 && byte <= 223) {
            this.bytesNeeded = 1;
            this.codePoint = byte & 31;
          } else if (byte >= 224 && byte <= 239) {
            if (byte === 224)
              this.lowerBoundary = 160;
            else if (byte === 237)
              this.upperBoundary = 159;
            this.bytesNeeded = 2;
            this.codePoint = byte & 15;
          } else if (byte >= 240 && byte <= 244) {
            if (byte === 240)
              this.lowerBoundary = 144;
            if (byte === 244)
              this.upperBoundary = 143;
            this.bytesNeeded = 3;
            this.codePoint = byte & 7;
          } else {
            result += "\uFFFD";
          }
          continue;
        }
        if (byte < this.lowerBoundary || byte > this.upperBoundary) {
          this.codePoint = 0;
          this.bytesNeeded = 0;
          this.bytesSeen = 0;
          this.lowerBoundary = 128;
          this.upperBoundary = 191;
          result += "\uFFFD";
          continue;
        }
        this.lowerBoundary = 128;
        this.upperBoundary = 191;
        this.codePoint = this.codePoint << 6 | byte & 63;
        this.bytesSeen++;
        if (this.bytesSeen !== this.bytesNeeded)
          continue;
        result += String.fromCodePoint(this.codePoint);
        this.codePoint = 0;
        this.bytesNeeded = 0;
        this.bytesSeen = 0;
      }
      return result;
    }
    flush() {
      const result = this.bytesNeeded > 0 ? "\uFFFD" : "";
      this.codePoint = 0;
      this.bytesNeeded = 0;
      this.bytesSeen = 0;
      this.lowerBoundary = 128;
      this.upperBoundary = 191;
      return result;
    }
  };
});

// node_modules/text-decoder/index.js
var require_text_decoder = __commonJS((exports, module) => {
  var normalizeEncoding = function(encoding) {
    encoding = encoding.toLowerCase();
    switch (encoding) {
      case "utf8":
      case "utf-8":
        return "utf8";
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return "utf16le";
      case "latin1":
      case "binary":
        return "latin1";
      case "base64":
      case "ascii":
      case "hex":
        return encoding;
      default:
        throw new Error("Unknown encoding: " + encoding);
    }
  };
  var PassThroughDecoder = require_pass_through_decoder();
  var UTF8Decoder = require_utf8_decoder();
  module.exports = class TextDecoder2 {
    constructor(encoding = "utf8") {
      this.encoding = normalizeEncoding(encoding);
      switch (this.encoding) {
        case "utf8":
          this.decoder = new UTF8Decoder;
          break;
        case "utf16le":
        case "base64":
          throw new Error("Unsupported encoding: " + this.encoding);
        default:
          this.decoder = new PassThroughDecoder(this.encoding);
      }
    }
    push(data) {
      if (typeof data === "string")
        return data;
      return this.decoder.decode(data);
    }
    write(data) {
      return this.push(data);
    }
    end(data) {
      let result = "";
      if (data)
        result = this.push(data);
      result += this.decoder.flush();
      return result;
    }
  };
});

// node_modules/streamx/index.js
var require_streamx = __commonJS((exports, module) => {
  var afterDrain = function() {
    this.stream._duplexState |= READ_PIPE_DRAINED;
    this.updateCallback();
  };
  var afterFinal = function(err2) {
    const stream = this.stream;
    if (err2)
      stream.destroy(err2);
    if ((stream._duplexState & DESTROY_STATUS) === 0) {
      stream._duplexState |= WRITE_DONE;
      stream.emit("finish");
    }
    if ((stream._duplexState & AUTO_DESTROY) === DONE2) {
      stream._duplexState |= DESTROYING;
    }
    stream._duplexState &= WRITE_NOT_FINISHING;
    if ((stream._duplexState & WRITE_UPDATING) === 0)
      this.update();
    else
      this.updateNextTick();
  };
  var afterDestroy = function(err2) {
    const stream = this.stream;
    if (!err2 && this.error !== STREAM_DESTROYED)
      err2 = this.error;
    if (err2)
      stream.emit("error", err2);
    stream._duplexState |= DESTROYED;
    stream.emit("close");
    const rs = stream._readableState;
    const ws = stream._writableState;
    if (rs !== null && rs.pipeline !== null)
      rs.pipeline.done(stream, err2);
    if (ws !== null) {
      while (ws.drains !== null && ws.drains.length > 0)
        ws.drains.shift().resolve(false);
      if (ws.pipeline !== null)
        ws.pipeline.done(stream, err2);
    }
  };
  var afterWrite = function(err2) {
    const stream = this.stream;
    if (err2)
      stream.destroy(err2);
    stream._duplexState &= WRITE_NOT_ACTIVE;
    if (this.drains !== null)
      tickDrains(this.drains);
    if ((stream._duplexState & WRITE_DRAIN_STATUS) === WRITE_UNDRAINED) {
      stream._duplexState &= WRITE_DRAINED;
      if ((stream._duplexState & WRITE_EMIT_DRAIN) === WRITE_EMIT_DRAIN) {
        stream.emit("drain");
      }
    }
    this.updateCallback();
  };
  var afterRead = function(err2) {
    if (err2)
      this.stream.destroy(err2);
    this.stream._duplexState &= READ_NOT_ACTIVE;
    if (this.readAhead === false && (this.stream._duplexState & READ_RESUMED) === 0)
      this.stream._duplexState &= READ_NO_READ_AHEAD;
    this.updateCallback();
  };
  var updateReadNT = function() {
    if ((this.stream._duplexState & READ_UPDATING) === 0) {
      this.stream._duplexState &= READ_NOT_NEXT_TICK;
      this.update();
    }
  };
  var updateWriteNT = function() {
    if ((this.stream._duplexState & WRITE_UPDATING) === 0) {
      this.stream._duplexState &= WRITE_NOT_NEXT_TICK;
      this.update();
    }
  };
  var tickDrains = function(drains) {
    for (let i = 0;i < drains.length; i++) {
      if (--drains[i].writes === 0) {
        drains.shift().resolve(true);
        i--;
      }
    }
  };
  var afterOpen = function(err2) {
    const stream = this.stream;
    if (err2)
      stream.destroy(err2);
    if ((stream._duplexState & DESTROYING) === 0) {
      if ((stream._duplexState & READ_PRIMARY_STATUS) === 0)
        stream._duplexState |= READ_PRIMARY;
      if ((stream._duplexState & WRITE_PRIMARY_STATUS) === 0)
        stream._duplexState |= WRITE_PRIMARY;
      stream.emit("open");
    }
    stream._duplexState &= NOT_ACTIVE;
    if (stream._writableState !== null) {
      stream._writableState.updateCallback();
    }
    if (stream._readableState !== null) {
      stream._readableState.updateCallback();
    }
  };
  var afterTransform = function(err2, data) {
    if (data !== undefined && data !== null)
      this.push(data);
    this._writableState.afterWrite(err2);
  };
  var newListener = function(name) {
    if (this._readableState !== null) {
      if (name === "data") {
        this._duplexState |= READ_EMIT_DATA | READ_RESUMED_READ_AHEAD;
        this._readableState.updateNextTick();
      }
      if (name === "readable") {
        this._duplexState |= READ_EMIT_READABLE;
        this._readableState.updateNextTick();
      }
    }
    if (this._writableState !== null) {
      if (name === "drain") {
        this._duplexState |= WRITE_EMIT_DRAIN;
        this._writableState.updateNextTick();
      }
    }
  };
  var transformAfterFlush = function(err2, data) {
    const cb = this._transformState.afterFinal;
    if (err2)
      return cb(err2);
    if (data !== null && data !== undefined)
      this.push(data);
    this.push(null);
    cb(null);
  };
  var pipelinePromise = function(...streams) {
    return new Promise((resolve, reject) => {
      return pipeline(...streams, (err2) => {
        if (err2)
          return reject(err2);
        resolve();
      });
    });
  };
  var pipeline = function(stream, ...streams) {
    const all2 = Array.isArray(stream) ? [...stream, ...streams] : [stream, ...streams];
    const done = all2.length && typeof all2[all2.length - 1] === "function" ? all2.pop() : null;
    if (all2.length < 2)
      throw new Error("Pipeline requires at least 2 streams");
    let src = all2[0];
    let dest = null;
    let error = null;
    for (let i = 1;i < all2.length; i++) {
      dest = all2[i];
      if (isStreamx(src)) {
        src.pipe(dest, onerror);
      } else {
        errorHandle(src, true, i > 1, onerror);
        src.pipe(dest);
      }
      src = dest;
    }
    if (done) {
      let fin = false;
      const autoDestroy = isStreamx(dest) || !!(dest._writableState && dest._writableState.autoDestroy);
      dest.on("error", (err2) => {
        if (error === null)
          error = err2;
      });
      dest.on("finish", () => {
        fin = true;
        if (!autoDestroy)
          done(error);
      });
      if (autoDestroy) {
        dest.on("close", () => done(error || (fin ? null : PREMATURE_CLOSE)));
      }
    }
    return dest;
    function errorHandle(s, rd, wr, onerror2) {
      s.on("error", onerror2);
      s.on("close", onclose);
      function onclose() {
        if (rd && s._readableState && !s._readableState.ended)
          return onerror2(PREMATURE_CLOSE);
        if (wr && s._writableState && !s._writableState.ended)
          return onerror2(PREMATURE_CLOSE);
      }
    }
    function onerror(err2) {
      if (!err2 || error)
        return;
      error = err2;
      for (const s of all2) {
        s.destroy(err2);
      }
    }
  };
  var echo = function(s) {
    return s;
  };
  var isStream = function(stream) {
    return !!stream._readableState || !!stream._writableState;
  };
  var isStreamx = function(stream) {
    return typeof stream._duplexState === "number" && isStream(stream);
  };
  var isEnded = function(stream) {
    return !!stream._readableState && stream._readableState.ended;
  };
  var isFinished = function(stream) {
    return !!stream._writableState && stream._writableState.ended;
  };
  var getStreamError = function(stream, opts = {}) {
    const err2 = stream._readableState && stream._readableState.error || stream._writableState && stream._writableState.error;
    return !opts.all && err2 === STREAM_DESTROYED ? null : err2;
  };
  var isReadStreamx = function(stream) {
    return isStreamx(stream) && stream.readable;
  };
  var isDisturbed = function(stream) {
    return (stream._duplexState & OPENING) !== OPENING || (stream._duplexState & ACTIVE_OR_TICKING) !== 0;
  };
  var isTypedArray = function(data) {
    return typeof data === "object" && data !== null && typeof data.byteLength === "number";
  };
  var defaultByteLength = function(data) {
    return isTypedArray(data) ? data.byteLength : 1024;
  };
  var noop = function() {
  };
  var abort = function() {
    this.destroy(new Error("Stream aborted."));
  };
  var isWritev = function(s) {
    return s._writev !== Writable.prototype._writev && s._writev !== Duplex.prototype._writev;
  };
  var { EventEmitter } = (init_events(), __toCommonJS(exports_events));
  var STREAM_DESTROYED = new Error("Stream was destroyed");
  var PREMATURE_CLOSE = new Error("Premature close");
  var FIFO = require_fast_fifo();
  var TextDecoder2 = require_text_decoder();
  var MAX = (1 << 29) - 1;
  var OPENING = 1;
  var PREDESTROYING = 2;
  var DESTROYING = 4;
  var DESTROYED = 8;
  var NOT_OPENING = MAX ^ OPENING;
  var NOT_PREDESTROYING = MAX ^ PREDESTROYING;
  var READ_ACTIVE = 1 << 4;
  var READ_UPDATING = 2 << 4;
  var READ_PRIMARY = 4 << 4;
  var READ_QUEUED = 8 << 4;
  var READ_RESUMED = 16 << 4;
  var READ_PIPE_DRAINED = 32 << 4;
  var READ_ENDING = 64 << 4;
  var READ_EMIT_DATA = 128 << 4;
  var READ_EMIT_READABLE = 256 << 4;
  var READ_EMITTED_READABLE = 512 << 4;
  var READ_DONE = 1024 << 4;
  var READ_NEXT_TICK = 2048 << 4;
  var READ_NEEDS_PUSH = 4096 << 4;
  var READ_READ_AHEAD = 8192 << 4;
  var READ_FLOWING = READ_RESUMED | READ_PIPE_DRAINED;
  var READ_ACTIVE_AND_NEEDS_PUSH = READ_ACTIVE | READ_NEEDS_PUSH;
  var READ_PRIMARY_AND_ACTIVE = READ_PRIMARY | READ_ACTIVE;
  var READ_EMIT_READABLE_AND_QUEUED = READ_EMIT_READABLE | READ_QUEUED;
  var READ_RESUMED_READ_AHEAD = READ_RESUMED | READ_READ_AHEAD;
  var READ_NOT_ACTIVE = MAX ^ READ_ACTIVE;
  var READ_NON_PRIMARY = MAX ^ READ_PRIMARY;
  var READ_NON_PRIMARY_AND_PUSHED = MAX ^ (READ_PRIMARY | READ_NEEDS_PUSH);
  var READ_PUSHED = MAX ^ READ_NEEDS_PUSH;
  var READ_PAUSED = MAX ^ READ_RESUMED;
  var READ_NOT_QUEUED = MAX ^ (READ_QUEUED | READ_EMITTED_READABLE);
  var READ_NOT_ENDING = MAX ^ READ_ENDING;
  var READ_PIPE_NOT_DRAINED = MAX ^ READ_FLOWING;
  var READ_NOT_NEXT_TICK = MAX ^ READ_NEXT_TICK;
  var READ_NOT_UPDATING = MAX ^ READ_UPDATING;
  var READ_NO_READ_AHEAD = MAX ^ READ_READ_AHEAD;
  var READ_PAUSED_NO_READ_AHEAD = MAX ^ READ_RESUMED_READ_AHEAD;
  var WRITE_ACTIVE = 1 << 18;
  var WRITE_UPDATING = 2 << 18;
  var WRITE_PRIMARY = 4 << 18;
  var WRITE_QUEUED = 8 << 18;
  var WRITE_UNDRAINED = 16 << 18;
  var WRITE_DONE = 32 << 18;
  var WRITE_EMIT_DRAIN = 64 << 18;
  var WRITE_NEXT_TICK = 128 << 18;
  var WRITE_WRITING = 256 << 18;
  var WRITE_FINISHING = 512 << 18;
  var WRITE_CORKED = 1024 << 18;
  var WRITE_NOT_ACTIVE = MAX ^ (WRITE_ACTIVE | WRITE_WRITING);
  var WRITE_NON_PRIMARY = MAX ^ WRITE_PRIMARY;
  var WRITE_NOT_FINISHING = MAX ^ (WRITE_ACTIVE | WRITE_FINISHING);
  var WRITE_DRAINED = MAX ^ WRITE_UNDRAINED;
  var WRITE_NOT_QUEUED = MAX ^ WRITE_QUEUED;
  var WRITE_NOT_NEXT_TICK = MAX ^ WRITE_NEXT_TICK;
  var WRITE_NOT_UPDATING = MAX ^ WRITE_UPDATING;
  var WRITE_NOT_CORKED = MAX ^ WRITE_CORKED;
  var ACTIVE = READ_ACTIVE | WRITE_ACTIVE;
  var NOT_ACTIVE = MAX ^ ACTIVE;
  var DONE2 = READ_DONE | WRITE_DONE;
  var DESTROY_STATUS = DESTROYING | DESTROYED | PREDESTROYING;
  var OPEN_STATUS = DESTROY_STATUS | OPENING;
  var AUTO_DESTROY = DESTROY_STATUS | DONE2;
  var NON_PRIMARY = WRITE_NON_PRIMARY & READ_NON_PRIMARY;
  var ACTIVE_OR_TICKING = WRITE_NEXT_TICK | READ_NEXT_TICK;
  var TICKING = ACTIVE_OR_TICKING & NOT_ACTIVE;
  var IS_OPENING = OPEN_STATUS | TICKING;
  var READ_PRIMARY_STATUS = OPEN_STATUS | READ_ENDING | READ_DONE;
  var READ_STATUS = OPEN_STATUS | READ_DONE | READ_QUEUED;
  var READ_ENDING_STATUS = OPEN_STATUS | READ_ENDING | READ_QUEUED;
  var READ_READABLE_STATUS = OPEN_STATUS | READ_EMIT_READABLE | READ_QUEUED | READ_EMITTED_READABLE;
  var SHOULD_NOT_READ = OPEN_STATUS | READ_ACTIVE | READ_ENDING | READ_DONE | READ_NEEDS_PUSH | READ_READ_AHEAD;
  var READ_BACKPRESSURE_STATUS = DESTROY_STATUS | READ_ENDING | READ_DONE;
  var READ_UPDATE_SYNC_STATUS = READ_UPDATING | OPEN_STATUS | READ_NEXT_TICK | READ_PRIMARY;
  var READ_NEXT_TICK_OR_OPENING = READ_NEXT_TICK | OPENING;
  var WRITE_PRIMARY_STATUS = OPEN_STATUS | WRITE_FINISHING | WRITE_DONE;
  var WRITE_QUEUED_AND_UNDRAINED = WRITE_QUEUED | WRITE_UNDRAINED;
  var WRITE_QUEUED_AND_ACTIVE = WRITE_QUEUED | WRITE_ACTIVE;
  var WRITE_DRAIN_STATUS = WRITE_QUEUED | WRITE_UNDRAINED | OPEN_STATUS | WRITE_ACTIVE;
  var WRITE_STATUS = OPEN_STATUS | WRITE_ACTIVE | WRITE_QUEUED | WRITE_CORKED;
  var WRITE_PRIMARY_AND_ACTIVE = WRITE_PRIMARY | WRITE_ACTIVE;
  var WRITE_ACTIVE_AND_WRITING = WRITE_ACTIVE | WRITE_WRITING;
  var WRITE_FINISHING_STATUS = OPEN_STATUS | WRITE_FINISHING | WRITE_QUEUED_AND_ACTIVE | WRITE_DONE;
  var WRITE_BACKPRESSURE_STATUS = WRITE_UNDRAINED | DESTROY_STATUS | WRITE_FINISHING | WRITE_DONE;
  var WRITE_UPDATE_SYNC_STATUS = WRITE_UPDATING | OPEN_STATUS | WRITE_NEXT_TICK | WRITE_PRIMARY;
  var WRITE_DROP_DATA = WRITE_FINISHING | WRITE_DONE | DESTROY_STATUS;
  var asyncIterator = Symbol.asyncIterator || Symbol("asyncIterator");

  class WritableState {
    constructor(stream, { highWaterMark = 16384, map = null, mapWritable, byteLength, byteLengthWritable } = {}) {
      this.stream = stream;
      this.queue = new FIFO;
      this.highWaterMark = highWaterMark;
      this.buffered = 0;
      this.error = null;
      this.pipeline = null;
      this.drains = null;
      this.byteLength = byteLengthWritable || byteLength || defaultByteLength;
      this.map = mapWritable || map;
      this.afterWrite = afterWrite.bind(this);
      this.afterUpdateNextTick = updateWriteNT.bind(this);
    }
    get ended() {
      return (this.stream._duplexState & WRITE_DONE) !== 0;
    }
    push(data) {
      if ((this.stream._duplexState & WRITE_DROP_DATA) !== 0)
        return false;
      if (this.map !== null)
        data = this.map(data);
      this.buffered += this.byteLength(data);
      this.queue.push(data);
      if (this.buffered < this.highWaterMark) {
        this.stream._duplexState |= WRITE_QUEUED;
        return true;
      }
      this.stream._duplexState |= WRITE_QUEUED_AND_UNDRAINED;
      return false;
    }
    shift() {
      const data = this.queue.shift();
      this.buffered -= this.byteLength(data);
      if (this.buffered === 0)
        this.stream._duplexState &= WRITE_NOT_QUEUED;
      return data;
    }
    end(data) {
      if (typeof data === "function")
        this.stream.once("finish", data);
      else if (data !== undefined && data !== null)
        this.push(data);
      this.stream._duplexState = (this.stream._duplexState | WRITE_FINISHING) & WRITE_NON_PRIMARY;
    }
    autoBatch(data, cb) {
      const buffer = [];
      const stream = this.stream;
      buffer.push(data);
      while ((stream._duplexState & WRITE_STATUS) === WRITE_QUEUED_AND_ACTIVE) {
        buffer.push(stream._writableState.shift());
      }
      if ((stream._duplexState & OPEN_STATUS) !== 0)
        return cb(null);
      stream._writev(buffer, cb);
    }
    update() {
      const stream = this.stream;
      stream._duplexState |= WRITE_UPDATING;
      do {
        while ((stream._duplexState & WRITE_STATUS) === WRITE_QUEUED) {
          const data = this.shift();
          stream._duplexState |= WRITE_ACTIVE_AND_WRITING;
          stream._write(data, this.afterWrite);
        }
        if ((stream._duplexState & WRITE_PRIMARY_AND_ACTIVE) === 0)
          this.updateNonPrimary();
      } while (this.continueUpdate() === true);
      stream._duplexState &= WRITE_NOT_UPDATING;
    }
    updateNonPrimary() {
      const stream = this.stream;
      if ((stream._duplexState & WRITE_FINISHING_STATUS) === WRITE_FINISHING) {
        stream._duplexState = stream._duplexState | WRITE_ACTIVE;
        stream._final(afterFinal.bind(this));
        return;
      }
      if ((stream._duplexState & DESTROY_STATUS) === DESTROYING) {
        if ((stream._duplexState & ACTIVE_OR_TICKING) === 0) {
          stream._duplexState |= ACTIVE;
          stream._destroy(afterDestroy.bind(this));
        }
        return;
      }
      if ((stream._duplexState & IS_OPENING) === OPENING) {
        stream._duplexState = (stream._duplexState | ACTIVE) & NOT_OPENING;
        stream._open(afterOpen.bind(this));
      }
    }
    continueUpdate() {
      if ((this.stream._duplexState & WRITE_NEXT_TICK) === 0)
        return false;
      this.stream._duplexState &= WRITE_NOT_NEXT_TICK;
      return true;
    }
    updateCallback() {
      if ((this.stream._duplexState & WRITE_UPDATE_SYNC_STATUS) === WRITE_PRIMARY)
        this.update();
      else
        this.updateNextTick();
    }
    updateNextTick() {
      if ((this.stream._duplexState & WRITE_NEXT_TICK) !== 0)
        return;
      this.stream._duplexState |= WRITE_NEXT_TICK;
      if ((this.stream._duplexState & WRITE_UPDATING) === 0)
        queueMicrotask(this.afterUpdateNextTick);
    }
  }

  class ReadableState {
    constructor(stream, { highWaterMark = 16384, map = null, mapReadable, byteLength, byteLengthReadable } = {}) {
      this.stream = stream;
      this.queue = new FIFO;
      this.highWaterMark = highWaterMark === 0 ? 1 : highWaterMark;
      this.buffered = 0;
      this.readAhead = highWaterMark > 0;
      this.error = null;
      this.pipeline = null;
      this.byteLength = byteLengthReadable || byteLength || defaultByteLength;
      this.map = mapReadable || map;
      this.pipeTo = null;
      this.afterRead = afterRead.bind(this);
      this.afterUpdateNextTick = updateReadNT.bind(this);
    }
    get ended() {
      return (this.stream._duplexState & READ_DONE) !== 0;
    }
    pipe(pipeTo, cb) {
      if (this.pipeTo !== null)
        throw new Error("Can only pipe to one destination");
      if (typeof cb !== "function")
        cb = null;
      this.stream._duplexState |= READ_PIPE_DRAINED;
      this.pipeTo = pipeTo;
      this.pipeline = new Pipeline(this.stream, pipeTo, cb);
      if (cb)
        this.stream.on("error", noop);
      if (isStreamx(pipeTo)) {
        pipeTo._writableState.pipeline = this.pipeline;
        if (cb)
          pipeTo.on("error", noop);
        pipeTo.on("finish", this.pipeline.finished.bind(this.pipeline));
      } else {
        const onerror = this.pipeline.done.bind(this.pipeline, pipeTo);
        const onclose = this.pipeline.done.bind(this.pipeline, pipeTo, null);
        pipeTo.on("error", onerror);
        pipeTo.on("close", onclose);
        pipeTo.on("finish", this.pipeline.finished.bind(this.pipeline));
      }
      pipeTo.on("drain", afterDrain.bind(this));
      this.stream.emit("piping", pipeTo);
      pipeTo.emit("pipe", this.stream);
    }
    push(data) {
      const stream = this.stream;
      if (data === null) {
        this.highWaterMark = 0;
        stream._duplexState = (stream._duplexState | READ_ENDING) & READ_NON_PRIMARY_AND_PUSHED;
        return false;
      }
      if (this.map !== null) {
        data = this.map(data);
        if (data === null) {
          stream._duplexState &= READ_PUSHED;
          return this.buffered < this.highWaterMark;
        }
      }
      this.buffered += this.byteLength(data);
      this.queue.push(data);
      stream._duplexState = (stream._duplexState | READ_QUEUED) & READ_PUSHED;
      return this.buffered < this.highWaterMark;
    }
    shift() {
      const data = this.queue.shift();
      this.buffered -= this.byteLength(data);
      if (this.buffered === 0)
        this.stream._duplexState &= READ_NOT_QUEUED;
      return data;
    }
    unshift(data) {
      const pending = [this.map !== null ? this.map(data) : data];
      while (this.buffered > 0)
        pending.push(this.shift());
      for (let i = 0;i < pending.length - 1; i++) {
        const data2 = pending[i];
        this.buffered += this.byteLength(data2);
        this.queue.push(data2);
      }
      this.push(pending[pending.length - 1]);
    }
    read() {
      const stream = this.stream;
      if ((stream._duplexState & READ_STATUS) === READ_QUEUED) {
        const data = this.shift();
        if (this.pipeTo !== null && this.pipeTo.write(data) === false)
          stream._duplexState &= READ_PIPE_NOT_DRAINED;
        if ((stream._duplexState & READ_EMIT_DATA) !== 0)
          stream.emit("data", data);
        return data;
      }
      if (this.readAhead === false) {
        stream._duplexState |= READ_READ_AHEAD;
        this.updateNextTick();
      }
      return null;
    }
    drain() {
      const stream = this.stream;
      while ((stream._duplexState & READ_STATUS) === READ_QUEUED && (stream._duplexState & READ_FLOWING) !== 0) {
        const data = this.shift();
        if (this.pipeTo !== null && this.pipeTo.write(data) === false)
          stream._duplexState &= READ_PIPE_NOT_DRAINED;
        if ((stream._duplexState & READ_EMIT_DATA) !== 0)
          stream.emit("data", data);
      }
    }
    update() {
      const stream = this.stream;
      stream._duplexState |= READ_UPDATING;
      do {
        this.drain();
        while (this.buffered < this.highWaterMark && (stream._duplexState & SHOULD_NOT_READ) === READ_READ_AHEAD) {
          stream._duplexState |= READ_ACTIVE_AND_NEEDS_PUSH;
          stream._read(this.afterRead);
          this.drain();
        }
        if ((stream._duplexState & READ_READABLE_STATUS) === READ_EMIT_READABLE_AND_QUEUED) {
          stream._duplexState |= READ_EMITTED_READABLE;
          stream.emit("readable");
        }
        if ((stream._duplexState & READ_PRIMARY_AND_ACTIVE) === 0)
          this.updateNonPrimary();
      } while (this.continueUpdate() === true);
      stream._duplexState &= READ_NOT_UPDATING;
    }
    updateNonPrimary() {
      const stream = this.stream;
      if ((stream._duplexState & READ_ENDING_STATUS) === READ_ENDING) {
        stream._duplexState = (stream._duplexState | READ_DONE) & READ_NOT_ENDING;
        stream.emit("end");
        if ((stream._duplexState & AUTO_DESTROY) === DONE2)
          stream._duplexState |= DESTROYING;
        if (this.pipeTo !== null)
          this.pipeTo.end();
      }
      if ((stream._duplexState & DESTROY_STATUS) === DESTROYING) {
        if ((stream._duplexState & ACTIVE_OR_TICKING) === 0) {
          stream._duplexState |= ACTIVE;
          stream._destroy(afterDestroy.bind(this));
        }
        return;
      }
      if ((stream._duplexState & IS_OPENING) === OPENING) {
        stream._duplexState = (stream._duplexState | ACTIVE) & NOT_OPENING;
        stream._open(afterOpen.bind(this));
      }
    }
    continueUpdate() {
      if ((this.stream._duplexState & READ_NEXT_TICK) === 0)
        return false;
      this.stream._duplexState &= READ_NOT_NEXT_TICK;
      return true;
    }
    updateCallback() {
      if ((this.stream._duplexState & READ_UPDATE_SYNC_STATUS) === READ_PRIMARY)
        this.update();
      else
        this.updateNextTick();
    }
    updateNextTickIfOpen() {
      if ((this.stream._duplexState & READ_NEXT_TICK_OR_OPENING) !== 0)
        return;
      this.stream._duplexState |= READ_NEXT_TICK;
      if ((this.stream._duplexState & READ_UPDATING) === 0)
        queueMicrotask(this.afterUpdateNextTick);
    }
    updateNextTick() {
      if ((this.stream._duplexState & READ_NEXT_TICK) !== 0)
        return;
      this.stream._duplexState |= READ_NEXT_TICK;
      if ((this.stream._duplexState & READ_UPDATING) === 0)
        queueMicrotask(this.afterUpdateNextTick);
    }
  }

  class TransformState {
    constructor(stream) {
      this.data = null;
      this.afterTransform = afterTransform.bind(stream);
      this.afterFinal = null;
    }
  }

  class Pipeline {
    constructor(src, dst, cb) {
      this.from = src;
      this.to = dst;
      this.afterPipe = cb;
      this.error = null;
      this.pipeToFinished = false;
    }
    finished() {
      this.pipeToFinished = true;
    }
    done(stream, err2) {
      if (err2)
        this.error = err2;
      if (stream === this.to) {
        this.to = null;
        if (this.from !== null) {
          if ((this.from._duplexState & READ_DONE) === 0 || !this.pipeToFinished) {
            this.from.destroy(this.error || new Error("Writable stream closed prematurely"));
          }
          return;
        }
      }
      if (stream === this.from) {
        this.from = null;
        if (this.to !== null) {
          if ((stream._duplexState & READ_DONE) === 0) {
            this.to.destroy(this.error || new Error("Readable stream closed before ending"));
          }
          return;
        }
      }
      if (this.afterPipe !== null)
        this.afterPipe(this.error);
      this.to = this.from = this.afterPipe = null;
    }
  }

  class Stream extends EventEmitter {
    constructor(opts) {
      super();
      this._duplexState = 0;
      this._readableState = null;
      this._writableState = null;
      if (opts) {
        if (opts.open)
          this._open = opts.open;
        if (opts.destroy)
          this._destroy = opts.destroy;
        if (opts.predestroy)
          this._predestroy = opts.predestroy;
        if (opts.signal) {
          opts.signal.addEventListener("abort", abort.bind(this));
        }
      }
      this.on("newListener", newListener);
    }
    _open(cb) {
      cb(null);
    }
    _destroy(cb) {
      cb(null);
    }
    _predestroy() {
    }
    get readable() {
      return this._readableState !== null ? true : undefined;
    }
    get writable() {
      return this._writableState !== null ? true : undefined;
    }
    get destroyed() {
      return (this._duplexState & DESTROYED) !== 0;
    }
    get destroying() {
      return (this._duplexState & DESTROY_STATUS) !== 0;
    }
    destroy(err2) {
      if ((this._duplexState & DESTROY_STATUS) === 0) {
        if (!err2)
          err2 = STREAM_DESTROYED;
        this._duplexState = (this._duplexState | DESTROYING) & NON_PRIMARY;
        if (this._readableState !== null) {
          this._readableState.highWaterMark = 0;
          this._readableState.error = err2;
        }
        if (this._writableState !== null) {
          this._writableState.highWaterMark = 0;
          this._writableState.error = err2;
        }
        this._duplexState |= PREDESTROYING;
        this._predestroy();
        this._duplexState &= NOT_PREDESTROYING;
        if (this._readableState !== null)
          this._readableState.updateNextTick();
        if (this._writableState !== null)
          this._writableState.updateNextTick();
      }
    }
  }

  class Readable extends Stream {
    constructor(opts) {
      super(opts);
      this._duplexState |= OPENING | WRITE_DONE | READ_READ_AHEAD;
      this._readableState = new ReadableState(this, opts);
      if (opts) {
        if (this._readableState.readAhead === false)
          this._duplexState &= READ_NO_READ_AHEAD;
        if (opts.read)
          this._read = opts.read;
        if (opts.eagerOpen)
          this._readableState.updateNextTick();
        if (opts.encoding)
          this.setEncoding(opts.encoding);
      }
    }
    setEncoding(encoding) {
      const dec = new TextDecoder2(encoding);
      const map = this._readableState.map || echo;
      this._readableState.map = mapOrSkip;
      return this;
      function mapOrSkip(data) {
        const next = dec.push(data);
        return next === "" && (data.byteLength !== 0 || dec.remaining > 0) ? null : map(next);
      }
    }
    _read(cb) {
      cb(null);
    }
    pipe(dest, cb) {
      this._readableState.updateNextTick();
      this._readableState.pipe(dest, cb);
      return dest;
    }
    read() {
      this._readableState.updateNextTick();
      return this._readableState.read();
    }
    push(data) {
      this._readableState.updateNextTickIfOpen();
      return this._readableState.push(data);
    }
    unshift(data) {
      this._readableState.updateNextTickIfOpen();
      return this._readableState.unshift(data);
    }
    resume() {
      this._duplexState |= READ_RESUMED_READ_AHEAD;
      this._readableState.updateNextTick();
      return this;
    }
    pause() {
      this._duplexState &= this._readableState.readAhead === false ? READ_PAUSED_NO_READ_AHEAD : READ_PAUSED;
      return this;
    }
    static _fromAsyncIterator(ite, opts) {
      let destroy;
      const rs = new Readable({
        ...opts,
        read(cb) {
          ite.next().then(push).then(cb.bind(null, null)).catch(cb);
        },
        predestroy() {
          destroy = ite.return();
        },
        destroy(cb) {
          if (!destroy)
            return cb(null);
          destroy.then(cb.bind(null, null)).catch(cb);
        }
      });
      return rs;
      function push(data) {
        if (data.done)
          rs.push(null);
        else
          rs.push(data.value);
      }
    }
    static from(data, opts) {
      if (isReadStreamx(data))
        return data;
      if (data[asyncIterator])
        return this._fromAsyncIterator(data[asyncIterator](), opts);
      if (!Array.isArray(data))
        data = data === undefined ? [] : [data];
      let i = 0;
      return new Readable({
        ...opts,
        read(cb) {
          this.push(i === data.length ? null : data[i++]);
          cb(null);
        }
      });
    }
    static isBackpressured(rs) {
      return (rs._duplexState & READ_BACKPRESSURE_STATUS) !== 0 || rs._readableState.buffered >= rs._readableState.highWaterMark;
    }
    static isPaused(rs) {
      return (rs._duplexState & READ_RESUMED) === 0;
    }
    [asyncIterator]() {
      const stream = this;
      let error = null;
      let promiseResolve = null;
      let promiseReject = null;
      this.on("error", (err2) => {
        error = err2;
      });
      this.on("readable", onreadable);
      this.on("close", onclose);
      return {
        [asyncIterator]() {
          return this;
        },
        next() {
          return new Promise(function(resolve, reject) {
            promiseResolve = resolve;
            promiseReject = reject;
            const data = stream.read();
            if (data !== null)
              ondata(data);
            else if ((stream._duplexState & DESTROYED) !== 0)
              ondata(null);
          });
        },
        return() {
          return destroy(null);
        },
        throw(err2) {
          return destroy(err2);
        }
      };
      function onreadable() {
        if (promiseResolve !== null)
          ondata(stream.read());
      }
      function onclose() {
        if (promiseResolve !== null)
          ondata(null);
      }
      function ondata(data) {
        if (promiseReject === null)
          return;
        if (error)
          promiseReject(error);
        else if (data === null && (stream._duplexState & READ_DONE) === 0)
          promiseReject(STREAM_DESTROYED);
        else
          promiseResolve({ value: data, done: data === null });
        promiseReject = promiseResolve = null;
      }
      function destroy(err2) {
        stream.destroy(err2);
        return new Promise((resolve, reject) => {
          if (stream._duplexState & DESTROYED)
            return resolve({ value: undefined, done: true });
          stream.once("close", function() {
            if (err2)
              reject(err2);
            else
              resolve({ value: undefined, done: true });
          });
        });
      }
    }
  }

  class Writable extends Stream {
    constructor(opts) {
      super(opts);
      this._duplexState |= OPENING | READ_DONE;
      this._writableState = new WritableState(this, opts);
      if (opts) {
        if (opts.writev)
          this._writev = opts.writev;
        if (opts.write)
          this._write = opts.write;
        if (opts.final)
          this._final = opts.final;
        if (opts.eagerOpen)
          this._writableState.updateNextTick();
      }
    }
    cork() {
      this._duplexState |= WRITE_CORKED;
    }
    uncork() {
      this._duplexState &= WRITE_NOT_CORKED;
      this._writableState.updateNextTick();
    }
    _writev(batch, cb) {
      cb(null);
    }
    _write(data, cb) {
      this._writableState.autoBatch(data, cb);
    }
    _final(cb) {
      cb(null);
    }
    static isBackpressured(ws) {
      return (ws._duplexState & WRITE_BACKPRESSURE_STATUS) !== 0;
    }
    static drained(ws) {
      if (ws.destroyed)
        return Promise.resolve(false);
      const state = ws._writableState;
      const pending = isWritev(ws) ? Math.min(1, state.queue.length) : state.queue.length;
      const writes = pending + (ws._duplexState & WRITE_WRITING ? 1 : 0);
      if (writes === 0)
        return Promise.resolve(true);
      if (state.drains === null)
        state.drains = [];
      return new Promise((resolve) => {
        state.drains.push({ writes, resolve });
      });
    }
    write(data) {
      this._writableState.updateNextTick();
      return this._writableState.push(data);
    }
    end(data) {
      this._writableState.updateNextTick();
      this._writableState.end(data);
      return this;
    }
  }

  class Duplex extends Readable {
    constructor(opts) {
      super(opts);
      this._duplexState = OPENING | this._duplexState & READ_READ_AHEAD;
      this._writableState = new WritableState(this, opts);
      if (opts) {
        if (opts.writev)
          this._writev = opts.writev;
        if (opts.write)
          this._write = opts.write;
        if (opts.final)
          this._final = opts.final;
      }
    }
    cork() {
      this._duplexState |= WRITE_CORKED;
    }
    uncork() {
      this._duplexState &= WRITE_NOT_CORKED;
      this._writableState.updateNextTick();
    }
    _writev(batch, cb) {
      cb(null);
    }
    _write(data, cb) {
      this._writableState.autoBatch(data, cb);
    }
    _final(cb) {
      cb(null);
    }
    write(data) {
      this._writableState.updateNextTick();
      return this._writableState.push(data);
    }
    end(data) {
      this._writableState.updateNextTick();
      this._writableState.end(data);
      return this;
    }
  }

  class Transform extends Duplex {
    constructor(opts) {
      super(opts);
      this._transformState = new TransformState(this);
      if (opts) {
        if (opts.transform)
          this._transform = opts.transform;
        if (opts.flush)
          this._flush = opts.flush;
      }
    }
    _write(data, cb) {
      if (this._readableState.buffered >= this._readableState.highWaterMark) {
        this._transformState.data = data;
      } else {
        this._transform(data, this._transformState.afterTransform);
      }
    }
    _read(cb) {
      if (this._transformState.data !== null) {
        const data = this._transformState.data;
        this._transformState.data = null;
        cb(null);
        this._transform(data, this._transformState.afterTransform);
      } else {
        cb(null);
      }
    }
    destroy(err2) {
      super.destroy(err2);
      if (this._transformState.data !== null) {
        this._transformState.data = null;
        this._transformState.afterTransform();
      }
    }
    _transform(data, cb) {
      cb(null, data);
    }
    _flush(cb) {
      cb(null);
    }
    _final(cb) {
      this._transformState.afterFinal = cb;
      this._flush(transformAfterFlush.bind(this));
    }
  }

  class PassThrough extends Transform {
  }
  module.exports = {
    pipeline,
    pipelinePromise,
    isStream,
    isStreamx,
    isEnded,
    isFinished,
    isDisturbed,
    getStreamError,
    Stream,
    Writable,
    Readable,
    Duplex,
    Transform,
    PassThrough
  };
});

// node_modules/err-code/index.js
var require_err_code = __commonJS((exports, module) => {
  var assign2 = function(obj, props) {
    for (const key in props) {
      Object.defineProperty(obj, key, {
        value: props[key],
        enumerable: true,
        configurable: true
      });
    }
    return obj;
  };
  var createError = function(err2, code, props) {
    if (!err2 || typeof err2 === "string") {
      throw new TypeError("Please pass an Error to err-code");
    }
    if (!props) {
      props = {};
    }
    if (typeof code === "object") {
      props = code;
      code = "";
    }
    if (code) {
      props.code = code;
    }
    try {
      return assign2(err2, props);
    } catch (_2) {
      props.message = err2.message;
      props.stack = err2.stack;
      const ErrClass = function() {
      };
      ErrClass.prototype = Object.create(Object.getPrototypeOf(err2));
      const output = assign2(new ErrClass, props);
      return output;
    }
  };
  module.exports = createError;
});

// node_modules/@msgpack/msgpack/dist.esm/utils/utf8.mjs
function utf8Count(str) {
  const strLength = str.length;
  let byteLength = 0;
  let pos = 0;
  while (pos < strLength) {
    let value = str.charCodeAt(pos++);
    if ((value & 4294967168) === 0) {
      byteLength++;
      continue;
    } else if ((value & 4294965248) === 0) {
      byteLength += 2;
    } else {
      if (value >= 55296 && value <= 56319) {
        if (pos < strLength) {
          const extra = str.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
      }
      if ((value & 4294901760) === 0) {
        byteLength += 3;
      } else {
        byteLength += 4;
      }
    }
  }
  return byteLength;
}
function utf8EncodeJs(str, output, outputOffset) {
  const strLength = str.length;
  let offset = outputOffset;
  let pos = 0;
  while (pos < strLength) {
    let value = str.charCodeAt(pos++);
    if ((value & 4294967168) === 0) {
      output[offset++] = value;
      continue;
    } else if ((value & 4294965248) === 0) {
      output[offset++] = value >> 6 & 31 | 192;
    } else {
      if (value >= 55296 && value <= 56319) {
        if (pos < strLength) {
          const extra = str.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
      }
      if ((value & 4294901760) === 0) {
        output[offset++] = value >> 12 & 15 | 224;
        output[offset++] = value >> 6 & 63 | 128;
      } else {
        output[offset++] = value >> 18 & 7 | 240;
        output[offset++] = value >> 12 & 63 | 128;
        output[offset++] = value >> 6 & 63 | 128;
      }
    }
    output[offset++] = value & 63 | 128;
  }
}
function utf8EncodeTE(str, output, outputOffset) {
  sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
}
function utf8Encode(str, output, outputOffset) {
  if (str.length > TEXT_ENCODER_THRESHOLD) {
    utf8EncodeTE(str, output, outputOffset);
  } else {
    utf8EncodeJs(str, output, outputOffset);
  }
}
function utf8DecodeJs(bytes, inputOffset, byteLength) {
  let offset = inputOffset;
  const end = offset + byteLength;
  const units = [];
  let result = "";
  while (offset < end) {
    const byte1 = bytes[offset++];
    if ((byte1 & 128) === 0) {
      units.push(byte1);
    } else if ((byte1 & 224) === 192) {
      const byte2 = bytes[offset++] & 63;
      units.push((byte1 & 31) << 6 | byte2);
    } else if ((byte1 & 240) === 224) {
      const byte2 = bytes[offset++] & 63;
      const byte3 = bytes[offset++] & 63;
      units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
    } else if ((byte1 & 248) === 240) {
      const byte2 = bytes[offset++] & 63;
      const byte3 = bytes[offset++] & 63;
      const byte4 = bytes[offset++] & 63;
      let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
      if (unit > 65535) {
        unit -= 65536;
        units.push(unit >>> 10 & 1023 | 55296);
        unit = 56320 | unit & 1023;
      }
      units.push(unit);
    } else {
      units.push(byte1);
    }
    if (units.length >= CHUNK_SIZE) {
      result += String.fromCharCode(...units);
      units.length = 0;
    }
  }
  if (units.length > 0) {
    result += String.fromCharCode(...units);
  }
  return result;
}
function utf8DecodeTD(bytes, inputOffset, byteLength) {
  const stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
  return sharedTextDecoder.decode(stringBytes);
}
function utf8Decode(bytes, inputOffset, byteLength) {
  if (byteLength > TEXT_DECODER_THRESHOLD) {
    return utf8DecodeTD(bytes, inputOffset, byteLength);
  } else {
    return utf8DecodeJs(bytes, inputOffset, byteLength);
  }
}
var sharedTextEncoder = new TextEncoder;
var TEXT_ENCODER_THRESHOLD = 50;
var CHUNK_SIZE = 4096;
var sharedTextDecoder = new TextDecoder;
var TEXT_DECODER_THRESHOLD = 200;

// node_modules/@msgpack/msgpack/dist.esm/ExtData.mjs
class ExtData {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}

// node_modules/@msgpack/msgpack/dist.esm/DecodeError.mjs
class DecodeError extends Error {
  constructor(message) {
    super(message);
    const proto = Object.create(DecodeError.prototype);
    Object.setPrototypeOf(this, proto);
    Object.defineProperty(this, "name", {
      configurable: true,
      enumerable: false,
      value: DecodeError.name
    });
  }
}

// node_modules/@msgpack/msgpack/dist.esm/utils/int.mjs
function setUint64(view, offset, value) {
  const high = value / 4294967296;
  const low = value;
  view.setUint32(offset, high);
  view.setUint32(offset + 4, low);
}
function setInt64(view, offset, value) {
  const high = Math.floor(value / 4294967296);
  const low = value;
  view.setUint32(offset, high);
  view.setUint32(offset + 4, low);
}
function getInt64(view, offset) {
  const high = view.getInt32(offset);
  const low = view.getUint32(offset + 4);
  return high * 4294967296 + low;
}
function getUint64(view, offset) {
  const high = view.getUint32(offset);
  const low = view.getUint32(offset + 4);
  return high * 4294967296 + low;
}
var UINT32_MAX = 4294967295;

// node_modules/@msgpack/msgpack/dist.esm/timestamp.mjs
function encodeTimeSpecToTimestamp({ sec, nsec }) {
  if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
    if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
      const rv = new Uint8Array(4);
      const view = new DataView(rv.buffer);
      view.setUint32(0, sec);
      return rv;
    } else {
      const secHigh = sec / 4294967296;
      const secLow = sec & 4294967295;
      const rv = new Uint8Array(8);
      const view = new DataView(rv.buffer);
      view.setUint32(0, nsec << 2 | secHigh & 3);
      view.setUint32(4, secLow);
      return rv;
    }
  } else {
    const rv = new Uint8Array(12);
    const view = new DataView(rv.buffer);
    view.setUint32(0, nsec);
    setInt64(view, 4, sec);
    return rv;
  }
}
function encodeDateToTimeSpec(date) {
  const msec = date.getTime();
  const sec = Math.floor(msec / 1000);
  const nsec = (msec - sec * 1000) * 1e6;
  const nsecInSec = Math.floor(nsec / 1e9);
  return {
    sec: sec + nsecInSec,
    nsec: nsec - nsecInSec * 1e9
  };
}
function encodeTimestampExtension(object) {
  if (object instanceof Date) {
    const timeSpec = encodeDateToTimeSpec(object);
    return encodeTimeSpecToTimestamp(timeSpec);
  } else {
    return null;
  }
}
function decodeTimestampToTimeSpec(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  switch (data.byteLength) {
    case 4: {
      const sec = view.getUint32(0);
      const nsec = 0;
      return { sec, nsec };
    }
    case 8: {
      const nsec30AndSecHigh2 = view.getUint32(0);
      const secLow32 = view.getUint32(4);
      const sec = (nsec30AndSecHigh2 & 3) * 4294967296 + secLow32;
      const nsec = nsec30AndSecHigh2 >>> 2;
      return { sec, nsec };
    }
    case 12: {
      const sec = getInt64(view, 4);
      const nsec = view.getUint32(0);
      return { sec, nsec };
    }
    default:
      throw new DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
  }
}
function decodeTimestampExtension(data) {
  const timeSpec = decodeTimestampToTimeSpec(data);
  return new Date(timeSpec.sec * 1000 + timeSpec.nsec / 1e6);
}
var EXT_TIMESTAMP = -1;
var TIMESTAMP32_MAX_SEC = 4294967296 - 1;
var TIMESTAMP64_MAX_SEC = 17179869184 - 1;
var timestampExtension = {
  type: EXT_TIMESTAMP,
  encode: encodeTimestampExtension,
  decode: decodeTimestampExtension
};

// node_modules/@msgpack/msgpack/dist.esm/ExtensionCodec.mjs
class ExtensionCodec {
  constructor() {
    this.builtInEncoders = [];
    this.builtInDecoders = [];
    this.encoders = [];
    this.decoders = [];
    this.register(timestampExtension);
  }
  register({ type, encode, decode }) {
    if (type >= 0) {
      this.encoders[type] = encode;
      this.decoders[type] = decode;
    } else {
      const index = -1 - type;
      this.builtInEncoders[index] = encode;
      this.builtInDecoders[index] = decode;
    }
  }
  tryToEncode(object, context) {
    for (let i = 0;i < this.builtInEncoders.length; i++) {
      const encodeExt = this.builtInEncoders[i];
      if (encodeExt != null) {
        const data = encodeExt(object, context);
        if (data != null) {
          const type = -1 - i;
          return new ExtData(type, data);
        }
      }
    }
    for (let i = 0;i < this.encoders.length; i++) {
      const encodeExt = this.encoders[i];
      if (encodeExt != null) {
        const data = encodeExt(object, context);
        if (data != null) {
          const type = i;
          return new ExtData(type, data);
        }
      }
    }
    if (object instanceof ExtData) {
      return object;
    }
    return null;
  }
  decode(data, type, context) {
    const decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
    if (decodeExt) {
      return decodeExt(data, type, context);
    } else {
      return new ExtData(type, data);
    }
  }
}
ExtensionCodec.defaultCodec = new ExtensionCodec;

// node_modules/@msgpack/msgpack/dist.esm/utils/typedArrays.mjs
var isArrayBufferLike = function(buffer) {
  return buffer instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer;
};
function ensureUint8Array(buffer) {
  if (buffer instanceof Uint8Array) {
    return buffer;
  } else if (ArrayBuffer.isView(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (isArrayBufferLike(buffer)) {
    return new Uint8Array(buffer);
  } else {
    return Uint8Array.from(buffer);
  }
}

// node_modules/@msgpack/msgpack/dist.esm/Encoder.mjs
var __addDisposableResource = function(env, value, async) {
  if (value !== null && value !== undefined) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === undefined) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
var DEFAULT_MAX_DEPTH = 100;
var DEFAULT_INITIAL_BUFFER_SIZE = 2048;

class Encoder {
  constructor(options) {
    this.entered = false;
    this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
    this.context = options?.context;
    this.useBigInt64 = options?.useBigInt64 ?? false;
    this.maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
    this.initialBufferSize = options?.initialBufferSize ?? DEFAULT_INITIAL_BUFFER_SIZE;
    this.sortKeys = options?.sortKeys ?? false;
    this.forceFloat32 = options?.forceFloat32 ?? false;
    this.ignoreUndefined = options?.ignoreUndefined ?? false;
    this.forceIntegerToFloat = options?.forceIntegerToFloat ?? false;
    this.pos = 0;
    this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
    this.bytes = new Uint8Array(this.view.buffer);
  }
  clone() {
    return new Encoder({
      extensionCodec: this.extensionCodec,
      context: this.context,
      useBigInt64: this.useBigInt64,
      maxDepth: this.maxDepth,
      initialBufferSize: this.initialBufferSize,
      sortKeys: this.sortKeys,
      forceFloat32: this.forceFloat32,
      ignoreUndefined: this.ignoreUndefined,
      forceIntegerToFloat: this.forceIntegerToFloat
    });
  }
  reinitializeState() {
    this.pos = 0;
  }
  enteringGuard() {
    this.entered = true;
    return {
      [Symbol.dispose]: () => {
        this.entered = false;
      }
    };
  }
  encodeSharedRef(object) {
    const env_1 = { stack: [], error: undefined, hasError: false };
    try {
      if (this.entered) {
        const instance = this.clone();
        return instance.encodeSharedRef(object);
      }
      const _guard = __addDisposableResource(env_1, this.enteringGuard(), false);
      this.reinitializeState();
      this.doEncode(object, 1);
      return this.bytes.subarray(0, this.pos);
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources(env_1);
    }
  }
  encode(object) {
    const env_2 = { stack: [], error: undefined, hasError: false };
    try {
      if (this.entered) {
        const instance = this.clone();
        return instance.encode(object);
      }
      const _guard = __addDisposableResource(env_2, this.enteringGuard(), false);
      this.reinitializeState();
      this.doEncode(object, 1);
      return this.bytes.slice(0, this.pos);
    } catch (e_2) {
      env_2.error = e_2;
      env_2.hasError = true;
    } finally {
      __disposeResources(env_2);
    }
  }
  doEncode(object, depth) {
    if (depth > this.maxDepth) {
      throw new Error(`Too deep objects in depth ${depth}`);
    }
    if (object == null) {
      this.encodeNil();
    } else if (typeof object === "boolean") {
      this.encodeBoolean(object);
    } else if (typeof object === "number") {
      if (!this.forceIntegerToFloat) {
        this.encodeNumber(object);
      } else {
        this.encodeNumberAsFloat(object);
      }
    } else if (typeof object === "string") {
      this.encodeString(object);
    } else if (this.useBigInt64 && typeof object === "bigint") {
      this.encodeBigInt64(object);
    } else {
      this.encodeObject(object, depth);
    }
  }
  ensureBufferSizeToWrite(sizeToWrite) {
    const requiredSize = this.pos + sizeToWrite;
    if (this.view.byteLength < requiredSize) {
      this.resizeBuffer(requiredSize * 2);
    }
  }
  resizeBuffer(newSize) {
    const newBuffer = new ArrayBuffer(newSize);
    const newBytes = new Uint8Array(newBuffer);
    const newView = new DataView(newBuffer);
    newBytes.set(this.bytes);
    this.view = newView;
    this.bytes = newBytes;
  }
  encodeNil() {
    this.writeU8(192);
  }
  encodeBoolean(object) {
    if (object === false) {
      this.writeU8(194);
    } else {
      this.writeU8(195);
    }
  }
  encodeNumber(object) {
    if (!this.forceIntegerToFloat && Number.isSafeInteger(object)) {
      if (object >= 0) {
        if (object < 128) {
          this.writeU8(object);
        } else if (object < 256) {
          this.writeU8(204);
          this.writeU8(object);
        } else if (object < 65536) {
          this.writeU8(205);
          this.writeU16(object);
        } else if (object < 4294967296) {
          this.writeU8(206);
          this.writeU32(object);
        } else if (!this.useBigInt64) {
          this.writeU8(207);
          this.writeU64(object);
        } else {
          this.encodeNumberAsFloat(object);
        }
      } else {
        if (object >= -32) {
          this.writeU8(224 | object + 32);
        } else if (object >= -128) {
          this.writeU8(208);
          this.writeI8(object);
        } else if (object >= -32768) {
          this.writeU8(209);
          this.writeI16(object);
        } else if (object >= -2147483648) {
          this.writeU8(210);
          this.writeI32(object);
        } else if (!this.useBigInt64) {
          this.writeU8(211);
          this.writeI64(object);
        } else {
          this.encodeNumberAsFloat(object);
        }
      }
    } else {
      this.encodeNumberAsFloat(object);
    }
  }
  encodeNumberAsFloat(object) {
    if (this.forceFloat32) {
      this.writeU8(202);
      this.writeF32(object);
    } else {
      this.writeU8(203);
      this.writeF64(object);
    }
  }
  encodeBigInt64(object) {
    if (object >= BigInt(0)) {
      this.writeU8(207);
      this.writeBigUint64(object);
    } else {
      this.writeU8(211);
      this.writeBigInt64(object);
    }
  }
  writeStringHeader(byteLength) {
    if (byteLength < 32) {
      this.writeU8(160 + byteLength);
    } else if (byteLength < 256) {
      this.writeU8(217);
      this.writeU8(byteLength);
    } else if (byteLength < 65536) {
      this.writeU8(218);
      this.writeU16(byteLength);
    } else if (byteLength < 4294967296) {
      this.writeU8(219);
      this.writeU32(byteLength);
    } else {
      throw new Error(`Too long string: ${byteLength} bytes in UTF-8`);
    }
  }
  encodeString(object) {
    const maxHeaderSize = 1 + 4;
    const byteLength = utf8Count(object);
    this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
    this.writeStringHeader(byteLength);
    utf8Encode(object, this.bytes, this.pos);
    this.pos += byteLength;
  }
  encodeObject(object, depth) {
    const ext = this.extensionCodec.tryToEncode(object, this.context);
    if (ext != null) {
      this.encodeExtension(ext);
    } else if (Array.isArray(object)) {
      this.encodeArray(object, depth);
    } else if (ArrayBuffer.isView(object)) {
      this.encodeBinary(object);
    } else if (typeof object === "object") {
      this.encodeMap(object, depth);
    } else {
      throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(object)}`);
    }
  }
  encodeBinary(object) {
    const size = object.byteLength;
    if (size < 256) {
      this.writeU8(196);
      this.writeU8(size);
    } else if (size < 65536) {
      this.writeU8(197);
      this.writeU16(size);
    } else if (size < 4294967296) {
      this.writeU8(198);
      this.writeU32(size);
    } else {
      throw new Error(`Too large binary: ${size}`);
    }
    const bytes = ensureUint8Array(object);
    this.writeU8a(bytes);
  }
  encodeArray(object, depth) {
    const size = object.length;
    if (size < 16) {
      this.writeU8(144 + size);
    } else if (size < 65536) {
      this.writeU8(220);
      this.writeU16(size);
    } else if (size < 4294967296) {
      this.writeU8(221);
      this.writeU32(size);
    } else {
      throw new Error(`Too large array: ${size}`);
    }
    for (const item of object) {
      this.doEncode(item, depth + 1);
    }
  }
  countWithoutUndefined(object, keys) {
    let count = 0;
    for (const key of keys) {
      if (object[key] !== undefined) {
        count++;
      }
    }
    return count;
  }
  encodeMap(object, depth) {
    const keys = Object.keys(object);
    if (this.sortKeys) {
      keys.sort();
    }
    const size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
    if (size < 16) {
      this.writeU8(128 + size);
    } else if (size < 65536) {
      this.writeU8(222);
      this.writeU16(size);
    } else if (size < 4294967296) {
      this.writeU8(223);
      this.writeU32(size);
    } else {
      throw new Error(`Too large map object: ${size}`);
    }
    for (const key of keys) {
      const value = object[key];
      if (!(this.ignoreUndefined && value === undefined)) {
        this.encodeString(key);
        this.doEncode(value, depth + 1);
      }
    }
  }
  encodeExtension(ext) {
    if (typeof ext.data === "function") {
      const data = ext.data(this.pos + 6);
      const size2 = data.length;
      if (size2 >= 4294967296) {
        throw new Error(`Too large extension object: ${size2}`);
      }
      this.writeU8(201);
      this.writeU32(size2);
      this.writeI8(ext.type);
      this.writeU8a(data);
      return;
    }
    const size = ext.data.length;
    if (size === 1) {
      this.writeU8(212);
    } else if (size === 2) {
      this.writeU8(213);
    } else if (size === 4) {
      this.writeU8(214);
    } else if (size === 8) {
      this.writeU8(215);
    } else if (size === 16) {
      this.writeU8(216);
    } else if (size < 256) {
      this.writeU8(199);
      this.writeU8(size);
    } else if (size < 65536) {
      this.writeU8(200);
      this.writeU16(size);
    } else if (size < 4294967296) {
      this.writeU8(201);
      this.writeU32(size);
    } else {
      throw new Error(`Too large extension object: ${size}`);
    }
    this.writeI8(ext.type);
    this.writeU8a(ext.data);
  }
  writeU8(value) {
    this.ensureBufferSizeToWrite(1);
    this.view.setUint8(this.pos, value);
    this.pos++;
  }
  writeU8a(values) {
    const size = values.length;
    this.ensureBufferSizeToWrite(size);
    this.bytes.set(values, this.pos);
    this.pos += size;
  }
  writeI8(value) {
    this.ensureBufferSizeToWrite(1);
    this.view.setInt8(this.pos, value);
    this.pos++;
  }
  writeU16(value) {
    this.ensureBufferSizeToWrite(2);
    this.view.setUint16(this.pos, value);
    this.pos += 2;
  }
  writeI16(value) {
    this.ensureBufferSizeToWrite(2);
    this.view.setInt16(this.pos, value);
    this.pos += 2;
  }
  writeU32(value) {
    this.ensureBufferSizeToWrite(4);
    this.view.setUint32(this.pos, value);
    this.pos += 4;
  }
  writeI32(value) {
    this.ensureBufferSizeToWrite(4);
    this.view.setInt32(this.pos, value);
    this.pos += 4;
  }
  writeF32(value) {
    this.ensureBufferSizeToWrite(4);
    this.view.setFloat32(this.pos, value);
    this.pos += 4;
  }
  writeF64(value) {
    this.ensureBufferSizeToWrite(8);
    this.view.setFloat64(this.pos, value);
    this.pos += 8;
  }
  writeU64(value) {
    this.ensureBufferSizeToWrite(8);
    setUint64(this.view, this.pos, value);
    this.pos += 8;
  }
  writeI64(value) {
    this.ensureBufferSizeToWrite(8);
    setInt64(this.view, this.pos, value);
    this.pos += 8;
  }
  writeBigUint64(value) {
    this.ensureBufferSizeToWrite(8);
    this.view.setBigUint64(this.pos, value);
    this.pos += 8;
  }
  writeBigInt64(value) {
    this.ensureBufferSizeToWrite(8);
    this.view.setBigInt64(this.pos, value);
    this.pos += 8;
  }
}

// node_modules/@msgpack/msgpack/dist.esm/encode.mjs
function encode(value, options) {
  const encoder = new Encoder(options);
  return encoder.encodeSharedRef(value);
}

// node_modules/@msgpack/msgpack/dist.esm/utils/prettyByte.mjs
function prettyByte(byte) {
  return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
}

// node_modules/@msgpack/msgpack/dist.esm/CachedKeyDecoder.mjs
var DEFAULT_MAX_KEY_LENGTH = 16;
var DEFAULT_MAX_LENGTH_PER_KEY = 16;

class CachedKeyDecoder {
  constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
    this.hit = 0;
    this.miss = 0;
    this.maxKeyLength = maxKeyLength;
    this.maxLengthPerKey = maxLengthPerKey;
    this.caches = [];
    for (let i = 0;i < this.maxKeyLength; i++) {
      this.caches.push([]);
    }
  }
  canBeCached(byteLength) {
    return byteLength > 0 && byteLength <= this.maxKeyLength;
  }
  find(bytes, inputOffset, byteLength) {
    const records = this.caches[byteLength - 1];
    FIND_CHUNK:
      for (const record of records) {
        const recordBytes = record.bytes;
        for (let j = 0;j < byteLength; j++) {
          if (recordBytes[j] !== bytes[inputOffset + j]) {
            continue FIND_CHUNK;
          }
        }
        return record.str;
      }
    return null;
  }
  store(bytes, value) {
    const records = this.caches[bytes.length - 1];
    const record = { bytes, str: value };
    if (records.length >= this.maxLengthPerKey) {
      records[Math.random() * records.length | 0] = record;
    } else {
      records.push(record);
    }
  }
  decode(bytes, inputOffset, byteLength) {
    const cachedValue = this.find(bytes, inputOffset, byteLength);
    if (cachedValue != null) {
      this.hit++;
      return cachedValue;
    }
    this.miss++;
    const str = utf8DecodeJs(bytes, inputOffset, byteLength);
    const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
    this.store(slicedCopyOfBytes, str);
    return str;
  }
}

// node_modules/@msgpack/msgpack/dist.esm/Decoder.mjs
var __addDisposableResource2 = function(env, value, async) {
  if (value !== null && value !== undefined) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === undefined) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources2 = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
var STATE_ARRAY = "array";
var STATE_MAP_KEY = "map_key";
var STATE_MAP_VALUE = "map_value";
var mapKeyConverter = (key) => {
  if (typeof key === "string" || typeof key === "number") {
    return key;
  }
  throw new DecodeError("The type of key must be string or number but " + typeof key);
};

class StackPool {
  constructor() {
    this.stack = [];
    this.stackHeadPosition = -1;
  }
  get length() {
    return this.stackHeadPosition + 1;
  }
  top() {
    return this.stack[this.stackHeadPosition];
  }
  pushArrayState(size) {
    const state = this.getUninitializedStateFromPool();
    state.type = STATE_ARRAY;
    state.position = 0;
    state.size = size;
    state.array = new Array(size);
  }
  pushMapState(size) {
    const state = this.getUninitializedStateFromPool();
    state.type = STATE_MAP_KEY;
    state.readCount = 0;
    state.size = size;
    state.map = {};
  }
  getUninitializedStateFromPool() {
    this.stackHeadPosition++;
    if (this.stackHeadPosition === this.stack.length) {
      const partialState = {
        type: undefined,
        size: 0,
        array: undefined,
        position: 0,
        readCount: 0,
        map: undefined,
        key: null
      };
      this.stack.push(partialState);
    }
    return this.stack[this.stackHeadPosition];
  }
  release(state) {
    const topStackState = this.stack[this.stackHeadPosition];
    if (topStackState !== state) {
      throw new Error("Invalid stack state. Released state is not on top of the stack.");
    }
    if (state.type === STATE_ARRAY) {
      const partialState = state;
      partialState.size = 0;
      partialState.array = undefined;
      partialState.position = 0;
      partialState.type = undefined;
    }
    if (state.type === STATE_MAP_KEY || state.type === STATE_MAP_VALUE) {
      const partialState = state;
      partialState.size = 0;
      partialState.map = undefined;
      partialState.readCount = 0;
      partialState.type = undefined;
    }
    this.stackHeadPosition--;
  }
  reset() {
    this.stack.length = 0;
    this.stackHeadPosition = -1;
  }
}
var HEAD_BYTE_REQUIRED = -1;
var EMPTY_VIEW = new DataView(new ArrayBuffer(0));
var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
try {
  EMPTY_VIEW.getInt8(0);
} catch (e) {
  if (!(e instanceof RangeError)) {
    throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access");
  }
}
var MORE_DATA = new RangeError("Insufficient data");
var sharedCachedKeyDecoder = new CachedKeyDecoder;

class Decoder {
  constructor(options) {
    this.totalPos = 0;
    this.pos = 0;
    this.view = EMPTY_VIEW;
    this.bytes = EMPTY_BYTES;
    this.headByte = HEAD_BYTE_REQUIRED;
    this.stack = new StackPool;
    this.entered = false;
    this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
    this.context = options?.context;
    this.useBigInt64 = options?.useBigInt64 ?? false;
    this.rawStrings = options?.rawStrings ?? false;
    this.maxStrLength = options?.maxStrLength ?? UINT32_MAX;
    this.maxBinLength = options?.maxBinLength ?? UINT32_MAX;
    this.maxArrayLength = options?.maxArrayLength ?? UINT32_MAX;
    this.maxMapLength = options?.maxMapLength ?? UINT32_MAX;
    this.maxExtLength = options?.maxExtLength ?? UINT32_MAX;
    this.keyDecoder = options?.keyDecoder !== undefined ? options.keyDecoder : sharedCachedKeyDecoder;
    this.mapKeyConverter = options?.mapKeyConverter ?? mapKeyConverter;
  }
  clone() {
    return new Decoder({
      extensionCodec: this.extensionCodec,
      context: this.context,
      useBigInt64: this.useBigInt64,
      rawStrings: this.rawStrings,
      maxStrLength: this.maxStrLength,
      maxBinLength: this.maxBinLength,
      maxArrayLength: this.maxArrayLength,
      maxMapLength: this.maxMapLength,
      maxExtLength: this.maxExtLength,
      keyDecoder: this.keyDecoder
    });
  }
  reinitializeState() {
    this.totalPos = 0;
    this.headByte = HEAD_BYTE_REQUIRED;
    this.stack.reset();
  }
  setBuffer(buffer) {
    const bytes = ensureUint8Array(buffer);
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.pos = 0;
  }
  appendBuffer(buffer) {
    if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
      this.setBuffer(buffer);
    } else {
      const remainingData = this.bytes.subarray(this.pos);
      const newData = ensureUint8Array(buffer);
      const newBuffer = new Uint8Array(remainingData.length + newData.length);
      newBuffer.set(remainingData);
      newBuffer.set(newData, remainingData.length);
      this.setBuffer(newBuffer);
    }
  }
  hasRemaining(size) {
    return this.view.byteLength - this.pos >= size;
  }
  createExtraByteError(posToShow) {
    const { view, pos } = this;
    return new RangeError(`Extra ${view.byteLength - pos} of ${view.byteLength} byte(s) found at buffer[${posToShow}]`);
  }
  enteringGuard() {
    this.entered = true;
    return {
      [Symbol.dispose]: () => {
        this.entered = false;
      }
    };
  }
  decode(buffer) {
    const env_1 = { stack: [], error: undefined, hasError: false };
    try {
      if (this.entered) {
        const instance = this.clone();
        return instance.decode(buffer);
      }
      const _guard = __addDisposableResource2(env_1, this.enteringGuard(), false);
      this.reinitializeState();
      this.setBuffer(buffer);
      const object = this.doDecodeSync();
      if (this.hasRemaining(1)) {
        throw this.createExtraByteError(this.pos);
      }
      return object;
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources2(env_1);
    }
  }
  *decodeMulti(buffer) {
    const env_2 = { stack: [], error: undefined, hasError: false };
    try {
      if (this.entered) {
        const instance = this.clone();
        yield* instance.decodeMulti(buffer);
        return;
      }
      const _guard = __addDisposableResource2(env_2, this.enteringGuard(), false);
      this.reinitializeState();
      this.setBuffer(buffer);
      while (this.hasRemaining(1)) {
        yield this.doDecodeSync();
      }
    } catch (e_2) {
      env_2.error = e_2;
      env_2.hasError = true;
    } finally {
      __disposeResources2(env_2);
    }
  }
  async decodeAsync(stream) {
    const env_3 = { stack: [], error: undefined, hasError: false };
    try {
      if (this.entered) {
        const instance = this.clone();
        return instance.decodeAsync(stream);
      }
      const _guard = __addDisposableResource2(env_3, this.enteringGuard(), false);
      let decoded = false;
      let object;
      for await (const buffer of stream) {
        if (decoded) {
          this.entered = false;
          throw this.createExtraByteError(this.totalPos);
        }
        this.appendBuffer(buffer);
        try {
          object = this.doDecodeSync();
          decoded = true;
        } catch (e) {
          if (!(e instanceof RangeError)) {
            throw e;
          }
        }
        this.totalPos += this.pos;
      }
      if (decoded) {
        if (this.hasRemaining(1)) {
          throw this.createExtraByteError(this.totalPos);
        }
        return object;
      }
      const { headByte, pos, totalPos } = this;
      throw new RangeError(`Insufficient data in parsing ${prettyByte(headByte)} at ${totalPos} (${pos} in the current buffer)`);
    } catch (e_3) {
      env_3.error = e_3;
      env_3.hasError = true;
    } finally {
      __disposeResources2(env_3);
    }
  }
  decodeArrayStream(stream) {
    return this.decodeMultiAsync(stream, true);
  }
  decodeStream(stream) {
    return this.decodeMultiAsync(stream, false);
  }
  async* decodeMultiAsync(stream, isArray) {
    const env_4 = { stack: [], error: undefined, hasError: false };
    try {
      if (this.entered) {
        const instance = this.clone();
        yield* instance.decodeMultiAsync(stream, isArray);
        return;
      }
      const _guard = __addDisposableResource2(env_4, this.enteringGuard(), false);
      let isArrayHeaderRequired = isArray;
      let arrayItemsLeft = -1;
      for await (const buffer of stream) {
        if (isArray && arrayItemsLeft === 0) {
          throw this.createExtraByteError(this.totalPos);
        }
        this.appendBuffer(buffer);
        if (isArrayHeaderRequired) {
          arrayItemsLeft = this.readArraySize();
          isArrayHeaderRequired = false;
          this.complete();
        }
        try {
          while (true) {
            yield this.doDecodeSync();
            if (--arrayItemsLeft === 0) {
              break;
            }
          }
        } catch (e) {
          if (!(e instanceof RangeError)) {
            throw e;
          }
        }
        this.totalPos += this.pos;
      }
    } catch (e_4) {
      env_4.error = e_4;
      env_4.hasError = true;
    } finally {
      __disposeResources2(env_4);
    }
  }
  doDecodeSync() {
    DECODE:
      while (true) {
        const headByte = this.readHeadByte();
        let object;
        if (headByte >= 224) {
          object = headByte - 256;
        } else if (headByte < 192) {
          if (headByte < 128) {
            object = headByte;
          } else if (headByte < 144) {
            const size = headByte - 128;
            if (size !== 0) {
              this.pushMapState(size);
              this.complete();
              continue DECODE;
            } else {
              object = {};
            }
          } else if (headByte < 160) {
            const size = headByte - 144;
            if (size !== 0) {
              this.pushArrayState(size);
              this.complete();
              continue DECODE;
            } else {
              object = [];
            }
          } else {
            const byteLength = headByte - 160;
            object = this.decodeString(byteLength, 0);
          }
        } else if (headByte === 192) {
          object = null;
        } else if (headByte === 194) {
          object = false;
        } else if (headByte === 195) {
          object = true;
        } else if (headByte === 202) {
          object = this.readF32();
        } else if (headByte === 203) {
          object = this.readF64();
        } else if (headByte === 204) {
          object = this.readU8();
        } else if (headByte === 205) {
          object = this.readU16();
        } else if (headByte === 206) {
          object = this.readU32();
        } else if (headByte === 207) {
          if (this.useBigInt64) {
            object = this.readU64AsBigInt();
          } else {
            object = this.readU64();
          }
        } else if (headByte === 208) {
          object = this.readI8();
        } else if (headByte === 209) {
          object = this.readI16();
        } else if (headByte === 210) {
          object = this.readI32();
        } else if (headByte === 211) {
          if (this.useBigInt64) {
            object = this.readI64AsBigInt();
          } else {
            object = this.readI64();
          }
        } else if (headByte === 217) {
          const byteLength = this.lookU8();
          object = this.decodeString(byteLength, 1);
        } else if (headByte === 218) {
          const byteLength = this.lookU16();
          object = this.decodeString(byteLength, 2);
        } else if (headByte === 219) {
          const byteLength = this.lookU32();
          object = this.decodeString(byteLength, 4);
        } else if (headByte === 220) {
          const size = this.readU16();
          if (size !== 0) {
            this.pushArrayState(size);
            this.complete();
            continue DECODE;
          } else {
            object = [];
          }
        } else if (headByte === 221) {
          const size = this.readU32();
          if (size !== 0) {
            this.pushArrayState(size);
            this.complete();
            continue DECODE;
          } else {
            object = [];
          }
        } else if (headByte === 222) {
          const size = this.readU16();
          if (size !== 0) {
            this.pushMapState(size);
            this.complete();
            continue DECODE;
          } else {
            object = {};
          }
        } else if (headByte === 223) {
          const size = this.readU32();
          if (size !== 0) {
            this.pushMapState(size);
            this.complete();
            continue DECODE;
          } else {
            object = {};
          }
        } else if (headByte === 196) {
          const size = this.lookU8();
          object = this.decodeBinary(size, 1);
        } else if (headByte === 197) {
          const size = this.lookU16();
          object = this.decodeBinary(size, 2);
        } else if (headByte === 198) {
          const size = this.lookU32();
          object = this.decodeBinary(size, 4);
        } else if (headByte === 212) {
          object = this.decodeExtension(1, 0);
        } else if (headByte === 213) {
          object = this.decodeExtension(2, 0);
        } else if (headByte === 214) {
          object = this.decodeExtension(4, 0);
        } else if (headByte === 215) {
          object = this.decodeExtension(8, 0);
        } else if (headByte === 216) {
          object = this.decodeExtension(16, 0);
        } else if (headByte === 199) {
          const size = this.lookU8();
          object = this.decodeExtension(size, 1);
        } else if (headByte === 200) {
          const size = this.lookU16();
          object = this.decodeExtension(size, 2);
        } else if (headByte === 201) {
          const size = this.lookU32();
          object = this.decodeExtension(size, 4);
        } else {
          throw new DecodeError(`Unrecognized type byte: ${prettyByte(headByte)}`);
        }
        this.complete();
        const stack = this.stack;
        while (stack.length > 0) {
          const state = stack.top();
          if (state.type === STATE_ARRAY) {
            state.array[state.position] = object;
            state.position++;
            if (state.position === state.size) {
              object = state.array;
              stack.release(state);
            } else {
              continue DECODE;
            }
          } else if (state.type === STATE_MAP_KEY) {
            if (object === "__proto__") {
              throw new DecodeError("The key __proto__ is not allowed");
            }
            state.key = this.mapKeyConverter(object);
            state.type = STATE_MAP_VALUE;
            continue DECODE;
          } else {
            state.map[state.key] = object;
            state.readCount++;
            if (state.readCount === state.size) {
              object = state.map;
              stack.release(state);
            } else {
              state.key = null;
              state.type = STATE_MAP_KEY;
              continue DECODE;
            }
          }
        }
        return object;
      }
  }
  readHeadByte() {
    if (this.headByte === HEAD_BYTE_REQUIRED) {
      this.headByte = this.readU8();
    }
    return this.headByte;
  }
  complete() {
    this.headByte = HEAD_BYTE_REQUIRED;
  }
  readArraySize() {
    const headByte = this.readHeadByte();
    switch (headByte) {
      case 220:
        return this.readU16();
      case 221:
        return this.readU32();
      default: {
        if (headByte < 160) {
          return headByte - 144;
        } else {
          throw new DecodeError(`Unrecognized array type byte: ${prettyByte(headByte)}`);
        }
      }
    }
  }
  pushMapState(size) {
    if (size > this.maxMapLength) {
      throw new DecodeError(`Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`);
    }
    this.stack.pushMapState(size);
  }
  pushArrayState(size) {
    if (size > this.maxArrayLength) {
      throw new DecodeError(`Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`);
    }
    this.stack.pushArrayState(size);
  }
  decodeString(byteLength, headerOffset) {
    if (!this.rawStrings || this.stateIsMapKey()) {
      return this.decodeUtf8String(byteLength, headerOffset);
    }
    return this.decodeBinary(byteLength, headerOffset);
  }
  decodeUtf8String(byteLength, headerOffset) {
    if (byteLength > this.maxStrLength) {
      throw new DecodeError(`Max length exceeded: UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`);
    }
    if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
      throw MORE_DATA;
    }
    const offset = this.pos + headerOffset;
    let object;
    if (this.stateIsMapKey() && this.keyDecoder?.canBeCached(byteLength)) {
      object = this.keyDecoder.decode(this.bytes, offset, byteLength);
    } else {
      object = utf8Decode(this.bytes, offset, byteLength);
    }
    this.pos += headerOffset + byteLength;
    return object;
  }
  stateIsMapKey() {
    if (this.stack.length > 0) {
      const state = this.stack.top();
      return state.type === STATE_MAP_KEY;
    }
    return false;
  }
  decodeBinary(byteLength, headOffset) {
    if (byteLength > this.maxBinLength) {
      throw new DecodeError(`Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`);
    }
    if (!this.hasRemaining(byteLength + headOffset)) {
      throw MORE_DATA;
    }
    const offset = this.pos + headOffset;
    const object = this.bytes.subarray(offset, offset + byteLength);
    this.pos += headOffset + byteLength;
    return object;
  }
  decodeExtension(size, headOffset) {
    if (size > this.maxExtLength) {
      throw new DecodeError(`Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`);
    }
    const extType = this.view.getInt8(this.pos + headOffset);
    const data = this.decodeBinary(size, headOffset + 1);
    return this.extensionCodec.decode(data, extType, this.context);
  }
  lookU8() {
    return this.view.getUint8(this.pos);
  }
  lookU16() {
    return this.view.getUint16(this.pos);
  }
  lookU32() {
    return this.view.getUint32(this.pos);
  }
  readU8() {
    const value = this.view.getUint8(this.pos);
    this.pos++;
    return value;
  }
  readI8() {
    const value = this.view.getInt8(this.pos);
    this.pos++;
    return value;
  }
  readU16() {
    const value = this.view.getUint16(this.pos);
    this.pos += 2;
    return value;
  }
  readI16() {
    const value = this.view.getInt16(this.pos);
    this.pos += 2;
    return value;
  }
  readU32() {
    const value = this.view.getUint32(this.pos);
    this.pos += 4;
    return value;
  }
  readI32() {
    const value = this.view.getInt32(this.pos);
    this.pos += 4;
    return value;
  }
  readU64() {
    const value = getUint64(this.view, this.pos);
    this.pos += 8;
    return value;
  }
  readI64() {
    const value = getInt64(this.view, this.pos);
    this.pos += 8;
    return value;
  }
  readU64AsBigInt() {
    const value = this.view.getBigUint64(this.pos);
    this.pos += 8;
    return value;
  }
  readI64AsBigInt() {
    const value = this.view.getBigInt64(this.pos);
    this.pos += 8;
    return value;
  }
  readF32() {
    const value = this.view.getFloat32(this.pos);
    this.pos += 4;
    return value;
  }
  readF64() {
    const value = this.view.getFloat64(this.pos);
    this.pos += 8;
    return value;
  }
}

// node_modules/@msgpack/msgpack/dist.esm/decode.mjs
function decode(buffer, options) {
  const decoder = new Decoder(options);
  return decoder.decode(buffer);
}

// node_modules/pako/dist/pako.esm.mjs
var zero$1 = function(buf) {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
};
var StaticTreeDesc = function(static_tree, extra_bits, extra_base, elems, max_length) {
  this.static_tree = static_tree;
  this.extra_bits = extra_bits;
  this.extra_base = extra_base;
  this.elems = elems;
  this.max_length = max_length;
  this.has_stree = static_tree && static_tree.length;
};
var TreeDesc = function(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;
  this.max_code = 0;
  this.stat_desc = stat_desc;
};
var Config = function(good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
};
var DeflateState = function() {
  this.strm = null;
  this.status = 0;
  this.pending_buf = null;
  this.pending_buf_size = 0;
  this.pending_out = 0;
  this.pending = 0;
  this.wrap = 0;
  this.gzhead = null;
  this.gzindex = 0;
  this.method = Z_DEFLATED$2;
  this.last_flush = -1;
  this.w_size = 0;
  this.w_bits = 0;
  this.w_mask = 0;
  this.window = null;
  this.window_size = 0;
  this.prev = null;
  this.head = null;
  this.ins_h = 0;
  this.hash_size = 0;
  this.hash_bits = 0;
  this.hash_mask = 0;
  this.hash_shift = 0;
  this.block_start = 0;
  this.match_length = 0;
  this.prev_match = 0;
  this.match_available = 0;
  this.strstart = 0;
  this.match_start = 0;
  this.lookahead = 0;
  this.prev_length = 0;
  this.max_chain_length = 0;
  this.max_lazy_match = 0;
  this.level = 0;
  this.strategy = 0;
  this.good_match = 0;
  this.nice_match = 0;
  this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
  this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
  this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);
  this.l_desc = null;
  this.d_desc = null;
  this.bl_desc = null;
  this.bl_count = new Uint16Array(MAX_BITS + 1);
  this.heap = new Uint16Array(2 * L_CODES + 1);
  zero(this.heap);
  this.heap_len = 0;
  this.heap_max = 0;
  this.depth = new Uint16Array(2 * L_CODES + 1);
  zero(this.depth);
  this.sym_buf = 0;
  this.lit_bufsize = 0;
  this.sym_next = 0;
  this.sym_end = 0;
  this.opt_len = 0;
  this.static_len = 0;
  this.matches = 0;
  this.insert = 0;
  this.bi_buf = 0;
  this.bi_valid = 0;
};
var ZStream = function() {
  this.input = null;
  this.next_in = 0;
  this.avail_in = 0;
  this.total_in = 0;
  this.output = null;
  this.next_out = 0;
  this.avail_out = 0;
  this.total_out = 0;
  this.msg = "";
  this.state = null;
  this.data_type = 2;
  this.adler = 0;
};
var Deflate$1 = function(options) {
  this.options = common.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED$1,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY
  }, options || {});
  let opt = this.options;
  if (opt.raw && opt.windowBits > 0) {
    opt.windowBits = -opt.windowBits;
  } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
    opt.windowBits += 16;
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream;
  this.strm.avail_out = 0;
  let status = deflate_1$2.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
  if (status !== Z_OK$2) {
    throw new Error(messages[status]);
  }
  if (opt.header) {
    deflate_1$2.deflateSetHeader(this.strm, opt.header);
  }
  if (opt.dictionary) {
    let dict;
    if (typeof opt.dictionary === "string") {
      dict = strings.string2buf(opt.dictionary);
    } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
      dict = new Uint8Array(opt.dictionary);
    } else {
      dict = opt.dictionary;
    }
    status = deflate_1$2.deflateSetDictionary(this.strm, dict);
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    this._dict_set = true;
  }
};
var deflate$1 = function(input, options) {
  const deflator = new Deflate$1(options);
  deflator.push(input, true);
  if (deflator.err) {
    throw deflator.msg || messages[deflator.err];
  }
  return deflator.result;
};
var deflateRaw$1 = function(input, options) {
  options = options || {};
  options.raw = true;
  return deflate$1(input, options);
};
var gzip$1 = function(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate$1(input, options);
};
var InflateState = function() {
  this.strm = null;
  this.mode = 0;
  this.last = false;
  this.wrap = 0;
  this.havedict = false;
  this.flags = 0;
  this.dmax = 0;
  this.check = 0;
  this.total = 0;
  this.head = null;
  this.wbits = 0;
  this.wsize = 0;
  this.whave = 0;
  this.wnext = 0;
  this.window = null;
  this.hold = 0;
  this.bits = 0;
  this.length = 0;
  this.offset = 0;
  this.extra = 0;
  this.lencode = null;
  this.distcode = null;
  this.lenbits = 0;
  this.distbits = 0;
  this.ncode = 0;
  this.nlen = 0;
  this.ndist = 0;
  this.have = 0;
  this.next = null;
  this.lens = new Uint16Array(320);
  this.work = new Uint16Array(288);
  this.lendyn = null;
  this.distdyn = null;
  this.sane = 0;
  this.back = 0;
  this.was = 0;
};
var GZheader = function() {
  this.text = 0;
  this.time = 0;
  this.xflags = 0;
  this.os = 0;
  this.extra = null;
  this.extra_len = 0;
  this.name = "";
  this.comment = "";
  this.hcrc = 0;
  this.done = false;
};
var Inflate$1 = function(options) {
  this.options = common.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, options || {});
  const opt = this.options;
  if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) {
      opt.windowBits = -15;
    }
  }
  if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
    opt.windowBits += 32;
  }
  if (opt.windowBits > 15 && opt.windowBits < 48) {
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream;
  this.strm.avail_out = 0;
  let status = inflate_1$2.inflateInit2(this.strm, opt.windowBits);
  if (status !== Z_OK) {
    throw new Error(messages[status]);
  }
  this.header = new gzheader;
  inflate_1$2.inflateGetHeader(this.strm, this.header);
  if (opt.dictionary) {
    if (typeof opt.dictionary === "string") {
      opt.dictionary = strings.string2buf(opt.dictionary);
    } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
      opt.dictionary = new Uint8Array(opt.dictionary);
    }
    if (opt.raw) {
      status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
      if (status !== Z_OK) {
        throw new Error(messages[status]);
      }
    }
  }
};
var inflate$1 = function(input, options) {
  const inflator = new Inflate$1(options);
  inflator.push(input);
  if (inflator.err)
    throw inflator.msg || messages[inflator.err];
  return inflator.result;
};
var inflateRaw$1 = function(input, options) {
  options = options || {};
  options.raw = true;
  return inflate$1(input, options);
};
/*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) */
var Z_FIXED$1 = 4;
var Z_BINARY = 0;
var Z_TEXT = 1;
var Z_UNKNOWN$1 = 2;
var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES = 2;
var MIN_MATCH$1 = 3;
var MAX_MATCH$1 = 258;
var LENGTH_CODES$1 = 29;
var LITERALS$1 = 256;
var L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
var D_CODES$1 = 30;
var BL_CODES$1 = 19;
var HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
var MAX_BITS$1 = 15;
var Buf_size = 16;
var MAX_BL_BITS = 7;
var END_BLOCK = 256;
var REP_3_6 = 16;
var REPZ_3_10 = 17;
var REPZ_11_138 = 18;
var extra_lbits = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]);
var extra_dbits = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
var extra_blbits = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]);
var bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var DIST_CODE_LEN = 512;
var static_ltree = new Array((L_CODES$1 + 2) * 2);
zero$1(static_ltree);
var static_dtree = new Array(D_CODES$1 * 2);
zero$1(static_dtree);
var _dist_code = new Array(DIST_CODE_LEN);
zero$1(_dist_code);
var _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
zero$1(_length_code);
var base_length = new Array(LENGTH_CODES$1);
zero$1(base_length);
var base_dist = new Array(D_CODES$1);
zero$1(base_dist);
var static_l_desc;
var static_d_desc;
var static_bl_desc;
var d_code = (dist) => {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
};
var put_short = (s, w) => {
  s.pending_buf[s.pending++] = w & 255;
  s.pending_buf[s.pending++] = w >>> 8 & 255;
};
var send_bits = (s, value, length) => {
  if (s.bi_valid > Buf_size - length) {
    s.bi_buf |= value << s.bi_valid & 65535;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> Buf_size - s.bi_valid;
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= value << s.bi_valid & 65535;
    s.bi_valid += length;
  }
};
var send_code = (s, c, tree) => {
  send_bits(s, tree[c * 2], tree[c * 2 + 1]);
};
var bi_reverse = (code, len) => {
  let res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
};
var bi_flush = (s) => {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;
  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 255;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
};
var gen_bitlen = (s, desc) => {
  const tree = desc.dyn_tree;
  const max_code = desc.max_code;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const extra = desc.stat_desc.extra_bits;
  const base = desc.stat_desc.extra_base;
  const max_length = desc.stat_desc.max_length;
  let h;
  let n, m;
  let bits;
  let xbits;
  let f;
  let overflow = 0;
  for (bits = 0;bits <= MAX_BITS$1; bits++) {
    s.bl_count[bits] = 0;
  }
  tree[s.heap[s.heap_max] * 2 + 1] = 0;
  for (h = s.heap_max + 1;h < HEAP_SIZE$1; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1] = bits;
    if (n > max_code) {
      continue;
    }
    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n - base];
    }
    f = tree[n * 2];
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n * 2 + 1] + xbits);
    }
  }
  if (overflow === 0) {
    return;
  }
  do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) {
      bits--;
    }
    s.bl_count[bits]--;
    s.bl_count[bits + 1] += 2;
    s.bl_count[max_length]--;
    overflow -= 2;
  } while (overflow > 0);
  for (bits = max_length;bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) {
        continue;
      }
      if (tree[m * 2 + 1] !== bits) {
        s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
        tree[m * 2 + 1] = bits;
      }
      n--;
    }
  }
};
var gen_codes = (tree, max_code, bl_count) => {
  const next_code = new Array(MAX_BITS$1 + 1);
  let code = 0;
  let bits;
  let n;
  for (bits = 1;bits <= MAX_BITS$1; bits++) {
    code = code + bl_count[bits - 1] << 1;
    next_code[bits] = code;
  }
  for (n = 0;n <= max_code; n++) {
    let len = tree[n * 2 + 1];
    if (len === 0) {
      continue;
    }
    tree[n * 2] = bi_reverse(next_code[len]++, len);
  }
};
var tr_static_init = () => {
  let n;
  let bits;
  let length;
  let code;
  let dist;
  const bl_count = new Array(MAX_BITS$1 + 1);
  length = 0;
  for (code = 0;code < LENGTH_CODES$1 - 1; code++) {
    base_length[code] = length;
    for (n = 0;n < 1 << extra_lbits[code]; n++) {
      _length_code[length++] = code;
    }
  }
  _length_code[length - 1] = code;
  dist = 0;
  for (code = 0;code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0;n < 1 << extra_dbits[code]; n++) {
      _dist_code[dist++] = code;
    }
  }
  dist >>= 7;
  for (;code < D_CODES$1; code++) {
    base_dist[code] = dist << 7;
    for (n = 0;n < 1 << extra_dbits[code] - 7; n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  for (bits = 0;bits <= MAX_BITS$1; bits++) {
    bl_count[bits] = 0;
  }
  n = 0;
  while (n <= 143) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n * 2 + 1] = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n * 2 + 1] = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
  for (n = 0;n < D_CODES$1; n++) {
    static_dtree[n * 2 + 1] = 5;
    static_dtree[n * 2] = bi_reverse(n, 5);
  }
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
  static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
};
var init_block = (s) => {
  let n;
  for (n = 0;n < L_CODES$1; n++) {
    s.dyn_ltree[n * 2] = 0;
  }
  for (n = 0;n < D_CODES$1; n++) {
    s.dyn_dtree[n * 2] = 0;
  }
  for (n = 0;n < BL_CODES$1; n++) {
    s.bl_tree[n * 2] = 0;
  }
  s.dyn_ltree[END_BLOCK * 2] = 1;
  s.opt_len = s.static_len = 0;
  s.sym_next = s.matches = 0;
};
var bi_windup = (s) => {
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
};
var smaller = (tree, n, m, depth) => {
  const _n2 = n * 2;
  const _m2 = m * 2;
  return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
};
var pqdownheap = (s, tree, k) => {
  const v = s.heap[k];
  let j = k << 1;
  while (j <= s.heap_len) {
    if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
      j++;
    }
    if (smaller(tree, v, s.heap[j], s.depth)) {
      break;
    }
    s.heap[k] = s.heap[j];
    k = j;
    j <<= 1;
  }
  s.heap[k] = v;
};
var compress_block = (s, ltree, dtree) => {
  let dist;
  let lc;
  let sx = 0;
  let code;
  let extra;
  if (s.sym_next !== 0) {
    do {
      dist = s.pending_buf[s.sym_buf + sx++] & 255;
      dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
      lc = s.pending_buf[s.sym_buf + sx++];
      if (dist === 0) {
        send_code(s, lc, ltree);
      } else {
        code = _length_code[lc];
        send_code(s, code + LITERALS$1 + 1, ltree);
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);
        }
        dist--;
        code = d_code(dist);
        send_code(s, code, dtree);
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);
        }
      }
    } while (sx < s.sym_next);
  }
  send_code(s, END_BLOCK, ltree);
};
var build_tree = (s, desc) => {
  const tree = desc.dyn_tree;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const elems = desc.stat_desc.elems;
  let n, m;
  let max_code = -1;
  let node;
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE$1;
  for (n = 0;n < elems; n++) {
    if (tree[n * 2] !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;
    } else {
      tree[n * 2 + 1] = 0;
    }
  }
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
    tree[node * 2] = 1;
    s.depth[node] = 0;
    s.opt_len--;
    if (has_stree) {
      s.static_len -= stree[node * 2 + 1];
    }
  }
  desc.max_code = max_code;
  for (n = s.heap_len >> 1;n >= 1; n--) {
    pqdownheap(s, tree, n);
  }
  node = elems;
  do {
    n = s.heap[1];
    s.heap[1] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1);
    m = s.heap[1];
    s.heap[--s.heap_max] = n;
    s.heap[--s.heap_max] = m;
    tree[node * 2] = tree[n * 2] + tree[m * 2];
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1] = tree[m * 2 + 1] = node;
    s.heap[1] = node++;
    pqdownheap(s, tree, 1);
  } while (s.heap_len >= 2);
  s.heap[--s.heap_max] = s.heap[1];
  gen_bitlen(s, desc);
  gen_codes(tree, max_code, s.bl_count);
};
var scan_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[0 * 2 + 1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1] = 65535;
  for (n = 0;n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      s.bl_tree[curlen * 2] += count;
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        s.bl_tree[curlen * 2]++;
      }
      s.bl_tree[REP_3_6 * 2]++;
    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10 * 2]++;
    } else {
      s.bl_tree[REPZ_11_138 * 2]++;
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
var send_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[0 * 2 + 1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  for (n = 0;n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      do {
        send_code(s, curlen, s.bl_tree);
      } while (--count !== 0);
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);
    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);
    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
var build_bl_tree = (s) => {
  let max_blindex;
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
  build_tree(s, s.bl_desc);
  for (max_blindex = BL_CODES$1 - 1;max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
      break;
    }
  }
  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  return max_blindex;
};
var send_all_trees = (s, lcodes, dcodes, blcodes) => {
  let rank;
  send_bits(s, lcodes - 257, 5);
  send_bits(s, dcodes - 1, 5);
  send_bits(s, blcodes - 4, 4);
  for (rank = 0;rank < blcodes; rank++) {
    send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
  }
  send_tree(s, s.dyn_ltree, lcodes - 1);
  send_tree(s, s.dyn_dtree, dcodes - 1);
};
var detect_data_type = (s) => {
  let block_mask = 4093624447;
  let n;
  for (n = 0;n <= 31; n++, block_mask >>>= 1) {
    if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
      return Z_BINARY;
    }
  }
  if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
    return Z_TEXT;
  }
  for (n = 32;n < LITERALS$1; n++) {
    if (s.dyn_ltree[n * 2] !== 0) {
      return Z_TEXT;
    }
  }
  return Z_BINARY;
};
var static_init_done = false;
var _tr_init$1 = (s) => {
  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }
  s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
  s.bi_buf = 0;
  s.bi_valid = 0;
  init_block(s);
};
var _tr_stored_block$1 = (s, buf, stored_len, last) => {
  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
  bi_windup(s);
  put_short(s, stored_len);
  put_short(s, ~stored_len);
  if (stored_len) {
    s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
  }
  s.pending += stored_len;
};
var _tr_align$1 = (s) => {
  send_bits(s, STATIC_TREES << 1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
};
var _tr_flush_block$1 = (s, buf, stored_len, last) => {
  let opt_lenb, static_lenb;
  let max_blindex = 0;
  if (s.level > 0) {
    if (s.strm.data_type === Z_UNKNOWN$1) {
      s.strm.data_type = detect_data_type(s);
    }
    build_tree(s, s.l_desc);
    build_tree(s, s.d_desc);
    max_blindex = build_bl_tree(s);
    opt_lenb = s.opt_len + 3 + 7 >>> 3;
    static_lenb = s.static_len + 3 + 7 >>> 3;
    if (static_lenb <= opt_lenb) {
      opt_lenb = static_lenb;
    }
  } else {
    opt_lenb = static_lenb = stored_len + 5;
  }
  if (stored_len + 4 <= opt_lenb && buf !== -1) {
    _tr_stored_block$1(s, buf, stored_len, last);
  } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);
  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  init_block(s);
  if (last) {
    bi_windup(s);
  }
};
var _tr_tally$1 = (s, dist, lc) => {
  s.pending_buf[s.sym_buf + s.sym_next++] = dist;
  s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
  s.pending_buf[s.sym_buf + s.sym_next++] = lc;
  if (dist === 0) {
    s.dyn_ltree[lc * 2]++;
  } else {
    s.matches++;
    dist--;
    s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
    s.dyn_dtree[d_code(dist) * 2]++;
  }
  return s.sym_next === s.sym_end;
};
var _tr_init_1 = _tr_init$1;
var _tr_stored_block_1 = _tr_stored_block$1;
var _tr_flush_block_1 = _tr_flush_block$1;
var _tr_tally_1 = _tr_tally$1;
var _tr_align_1 = _tr_align$1;
var trees = {
  _tr_init: _tr_init_1,
  _tr_stored_block: _tr_stored_block_1,
  _tr_flush_block: _tr_flush_block_1,
  _tr_tally: _tr_tally_1,
  _tr_align: _tr_align_1
};
var adler32 = (adler, buf, len, pos) => {
  let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
  while (len !== 0) {
    n = len > 2000 ? 2000 : len;
    len -= n;
    do {
      s1 = s1 + buf[pos++] | 0;
      s2 = s2 + s1 | 0;
    } while (--n);
    s1 %= 65521;
    s2 %= 65521;
  }
  return s1 | s2 << 16 | 0;
};
var adler32_1 = adler32;
var makeTable = () => {
  let c, table = [];
  for (var n = 0;n < 256; n++) {
    c = n;
    for (var k = 0;k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};
var crcTable = new Uint32Array(makeTable());
var crc32 = (crc, buf, len, pos) => {
  const t = crcTable;
  const end = pos + len;
  crc ^= -1;
  for (let i = pos;i < end; i++) {
    crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
  }
  return crc ^ -1;
};
var crc32_1 = crc32;
var messages = {
  2: "need dictionary",
  1: "stream end",
  0: "",
  "-1": "file error",
  "-2": "stream error",
  "-3": "data error",
  "-4": "insufficient memory",
  "-5": "buffer error",
  "-6": "incompatible version"
};
var constants$2 = {
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  Z_BINARY: 0,
  Z_TEXT: 1,
  Z_UNKNOWN: 2,
  Z_DEFLATED: 8
};
var { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;
var {
  Z_NO_FLUSH: Z_NO_FLUSH$2,
  Z_PARTIAL_FLUSH,
  Z_FULL_FLUSH: Z_FULL_FLUSH$1,
  Z_FINISH: Z_FINISH$3,
  Z_BLOCK: Z_BLOCK$1,
  Z_OK: Z_OK$3,
  Z_STREAM_END: Z_STREAM_END$3,
  Z_STREAM_ERROR: Z_STREAM_ERROR$2,
  Z_DATA_ERROR: Z_DATA_ERROR$2,
  Z_BUF_ERROR: Z_BUF_ERROR$1,
  Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
  Z_FILTERED,
  Z_HUFFMAN_ONLY,
  Z_RLE,
  Z_FIXED,
  Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
  Z_UNKNOWN,
  Z_DEFLATED: Z_DEFLATED$2
} = constants$2;
var MAX_MEM_LEVEL = 9;
var MAX_WBITS$1 = 15;
var DEF_MEM_LEVEL = 8;
var LENGTH_CODES = 29;
var LITERALS = 256;
var L_CODES = LITERALS + 1 + LENGTH_CODES;
var D_CODES = 30;
var BL_CODES = 19;
var HEAP_SIZE = 2 * L_CODES + 1;
var MAX_BITS = 15;
var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
var PRESET_DICT = 32;
var INIT_STATE = 42;
var GZIP_STATE = 57;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;
var BS_NEED_MORE = 1;
var BS_BLOCK_DONE = 2;
var BS_FINISH_STARTED = 3;
var BS_FINISH_DONE = 4;
var OS_CODE = 3;
var err = (strm, errorCode) => {
  strm.msg = messages[errorCode];
  return errorCode;
};
var rank = (f) => {
  return f * 2 - (f > 4 ? 9 : 0);
};
var zero = (buf) => {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
};
var slide_hash = (s) => {
  let n, m;
  let p;
  let wsize = s.w_size;
  n = s.hash_size;
  p = n;
  do {
    m = s.head[--p];
    s.head[p] = m >= wsize ? m - wsize : 0;
  } while (--n);
  n = wsize;
  p = n;
  do {
    m = s.prev[--p];
    s.prev[p] = m >= wsize ? m - wsize : 0;
  } while (--n);
};
var HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
var HASH = HASH_ZLIB;
var flush_pending = (strm) => {
  const s = strm.state;
  let len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) {
    return;
  }
  strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
};
var flush_block_only = (s, last) => {
  _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
};
var put_byte = (s, b) => {
  s.pending_buf[s.pending++] = b;
};
var putShortMSB = (s, b) => {
  s.pending_buf[s.pending++] = b >>> 8 & 255;
  s.pending_buf[s.pending++] = b & 255;
};
var read_buf = (strm, buf, start, size) => {
  let len = strm.avail_in;
  if (len > size) {
    len = size;
  }
  if (len === 0) {
    return 0;
  }
  strm.avail_in -= len;
  buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32_1(strm.adler, buf, len, start);
  } else if (strm.state.wrap === 2) {
    strm.adler = crc32_1(strm.adler, buf, len, start);
  }
  strm.next_in += len;
  strm.total_in += len;
  return len;
};
var longest_match = (s, cur_match) => {
  let chain_length = s.max_chain_length;
  let scan = s.strstart;
  let match;
  let len;
  let best_len = s.prev_length;
  let nice_match = s.nice_match;
  const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
  const _win = s.window;
  const wmask = s.w_mask;
  const prev = s.prev;
  const strend = s.strstart + MAX_MATCH;
  let scan_end1 = _win[scan + best_len - 1];
  let scan_end = _win[scan + best_len];
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  if (nice_match > s.lookahead) {
    nice_match = s.lookahead;
  }
  do {
    match = cur_match;
    if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
      continue;
    }
    scan += 2;
    match++;
    do {
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;
    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1 = _win[scan + best_len - 1];
      scan_end = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
};
var fill_window = (s) => {
  const _w_size = s.w_size;
  let n, more, str;
  do {
    more = s.window_size - s.lookahead - s.strstart;
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
      s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      s.block_start -= _w_size;
      if (s.insert > s.strstart) {
        s.insert = s.strstart;
      }
      slide_hash(s);
      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];
      s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
      while (s.insert) {
        s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
};
var deflate_stored = (s, flush) => {
  let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
  let len, left, have, last = 0;
  let used = s.strm.avail_in;
  do {
    len = 65535;
    have = s.bi_valid + 42 >> 3;
    if (s.strm.avail_out < have) {
      break;
    }
    have = s.strm.avail_out - have;
    left = s.strstart - s.block_start;
    if (len > left + s.strm.avail_in) {
      len = left + s.strm.avail_in;
    }
    if (len > have) {
      len = have;
    }
    if (len < min_block && (len === 0 && flush !== Z_FINISH$3 || flush === Z_NO_FLUSH$2 || len !== left + s.strm.avail_in)) {
      break;
    }
    last = flush === Z_FINISH$3 && len === left + s.strm.avail_in ? 1 : 0;
    _tr_stored_block(s, 0, 0, last);
    s.pending_buf[s.pending - 4] = len;
    s.pending_buf[s.pending - 3] = len >> 8;
    s.pending_buf[s.pending - 2] = ~len;
    s.pending_buf[s.pending - 1] = ~len >> 8;
    flush_pending(s.strm);
    if (left) {
      if (left > len) {
        left = len;
      }
      s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
      s.strm.next_out += left;
      s.strm.avail_out -= left;
      s.strm.total_out += left;
      s.block_start += left;
      len -= left;
    }
    if (len) {
      read_buf(s.strm, s.strm.output, s.strm.next_out, len);
      s.strm.next_out += len;
      s.strm.avail_out -= len;
      s.strm.total_out += len;
    }
  } while (last === 0);
  used -= s.strm.avail_in;
  if (used) {
    if (used >= s.w_size) {
      s.matches = 2;
      s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
      s.strstart = s.w_size;
      s.insert = s.strstart;
    } else {
      if (s.window_size - s.strstart <= used) {
        s.strstart -= s.w_size;
        s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
        if (s.matches < 2) {
          s.matches++;
        }
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
      }
      s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
      s.strstart += used;
      s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
    }
    s.block_start = s.strstart;
  }
  if (s.high_water < s.strstart) {
    s.high_water = s.strstart;
  }
  if (last) {
    return BS_FINISH_DONE;
  }
  if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 && s.strm.avail_in === 0 && s.strstart === s.block_start) {
    return BS_BLOCK_DONE;
  }
  have = s.window_size - s.strstart;
  if (s.strm.avail_in > have && s.block_start >= s.w_size) {
    s.block_start -= s.w_size;
    s.strstart -= s.w_size;
    s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
    if (s.matches < 2) {
      s.matches++;
    }
    have += s.w_size;
    if (s.insert > s.strstart) {
      s.insert = s.strstart;
    }
  }
  if (have > s.strm.avail_in) {
    have = s.strm.avail_in;
  }
  if (have) {
    read_buf(s.strm, s.window, s.strstart, have);
    s.strstart += have;
    s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
  }
  if (s.high_water < s.strstart) {
    s.high_water = s.strstart;
  }
  have = s.bi_valid + 42 >> 3;
  have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
  min_block = have > s.w_size ? s.w_size : have;
  left = s.strstart - s.block_start;
  if (left >= min_block || (left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 && s.strm.avail_in === 0 && left <= have) {
    len = left > have ? have : left;
    last = flush === Z_FINISH$3 && s.strm.avail_in === 0 && len === left ? 1 : 0;
    _tr_stored_block(s, s.block_start, len, last);
    s.block_start += len;
    flush_pending(s.strm);
  }
  return last ? BS_FINISH_STARTED : BS_NEED_MORE;
};
var deflate_fast = (s, flush) => {
  let hash_head;
  let bflush;
  for (;; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
    }
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
        s.match_length--;
        do {
          s.strstart++;
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        } while (--s.match_length !== 0);
        s.strstart++;
      } else {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
      }
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_slow = (s, flush) => {
  let hash_head;
  let bflush;
  let max_insert;
  for (;; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;
    if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
      if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
        s.match_length = MIN_MATCH - 1;
      }
    }
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    } else if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      if (bflush) {
        flush_block_only(s, false);
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  if (s.match_available) {
    bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_rle = (s, flush) => {
  let bflush;
  let prev;
  let scan, strend;
  const _win = s.window;
  for (;; ) {
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
        } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
    }
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_huff = (s, flush) => {
  let bflush;
  for (;; ) {
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        break;
      }
    }
    s.match_length = 0;
    bflush = _tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var configuration_table = [
  new Config(0, 0, 0, 0, deflate_stored),
  new Config(4, 4, 8, 4, deflate_fast),
  new Config(4, 5, 16, 8, deflate_fast),
  new Config(4, 6, 32, 32, deflate_fast),
  new Config(4, 4, 16, 16, deflate_slow),
  new Config(8, 16, 32, 32, deflate_slow),
  new Config(8, 16, 128, 128, deflate_slow),
  new Config(8, 32, 128, 256, deflate_slow),
  new Config(32, 128, 258, 1024, deflate_slow),
  new Config(32, 258, 258, 4096, deflate_slow)
];
var lm_init = (s) => {
  s.window_size = 2 * s.w_size;
  zero(s.head);
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;
  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
};
var deflateStateCheck = (strm) => {
  if (!strm) {
    return 1;
  }
  const s = strm.state;
  if (!s || s.strm !== strm || s.status !== INIT_STATE && s.status !== GZIP_STATE && s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
    return 1;
  }
  return 0;
};
var deflateResetKeep = (strm) => {
  if (deflateStateCheck(strm)) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;
  const s = strm.state;
  s.pending = 0;
  s.pending_out = 0;
  if (s.wrap < 0) {
    s.wrap = -s.wrap;
  }
  s.status = s.wrap === 2 ? GZIP_STATE : s.wrap ? INIT_STATE : BUSY_STATE;
  strm.adler = s.wrap === 2 ? 0 : 1;
  s.last_flush = -2;
  _tr_init(s);
  return Z_OK$3;
};
var deflateReset = (strm) => {
  const ret = deflateResetKeep(strm);
  if (ret === Z_OK$3) {
    lm_init(strm.state);
  }
  return ret;
};
var deflateSetHeader = (strm, head) => {
  if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
    return Z_STREAM_ERROR$2;
  }
  strm.state.gzhead = head;
  return Z_OK$3;
};
var deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
  if (!strm) {
    return Z_STREAM_ERROR$2;
  }
  let wrap = 1;
  if (level === Z_DEFAULT_COMPRESSION$1) {
    level = 6;
  }
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  } else if (windowBits > 15) {
    wrap = 2;
    windowBits -= 16;
  }
  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap !== 1) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  if (windowBits === 8) {
    windowBits = 9;
  }
  const s = new DeflateState;
  strm.state = s;
  s.strm = strm;
  s.status = INIT_STATE;
  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;
  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
  s.window = new Uint8Array(s.w_size * 2);
  s.head = new Uint16Array(s.hash_size);
  s.prev = new Uint16Array(s.w_size);
  s.lit_bufsize = 1 << memLevel + 6;
  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new Uint8Array(s.pending_buf_size);
  s.sym_buf = s.lit_bufsize;
  s.sym_end = (s.lit_bufsize - 1) * 3;
  s.level = level;
  s.strategy = strategy;
  s.method = method;
  return deflateReset(strm);
};
var deflateInit = (strm, level) => {
  return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
};
var deflate$2 = (strm, flush) => {
  if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
  }
  const s = strm.state;
  if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
    return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
  }
  const old_flush = s.last_flush;
  s.last_flush = flush;
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
    return err(strm, Z_BUF_ERROR$1);
  }
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR$1);
  }
  if (s.status === INIT_STATE && s.wrap === 0) {
    s.status = BUSY_STATE;
  }
  if (s.status === INIT_STATE) {
    let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
    let level_flags = -1;
    if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
      level_flags = 0;
    } else if (s.level < 6) {
      level_flags = 1;
    } else if (s.level === 6) {
      level_flags = 2;
    } else {
      level_flags = 3;
    }
    header |= level_flags << 6;
    if (s.strstart !== 0) {
      header |= PRESET_DICT;
    }
    header += 31 - header % 31;
    putShortMSB(s, header);
    if (s.strstart !== 0) {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 65535);
    }
    strm.adler = 1;
    s.status = BUSY_STATE;
    flush_pending(strm);
    if (s.pending !== 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  }
  if (s.status === GZIP_STATE) {
    strm.adler = 0;
    put_byte(s, 31);
    put_byte(s, 139);
    put_byte(s, 8);
    if (!s.gzhead) {
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
      put_byte(s, OS_CODE);
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    } else {
      put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
      put_byte(s, s.gzhead.time & 255);
      put_byte(s, s.gzhead.time >> 8 & 255);
      put_byte(s, s.gzhead.time >> 16 & 255);
      put_byte(s, s.gzhead.time >> 24 & 255);
      put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
      put_byte(s, s.gzhead.os & 255);
      if (s.gzhead.extra && s.gzhead.extra.length) {
        put_byte(s, s.gzhead.extra.length & 255);
        put_byte(s, s.gzhead.extra.length >> 8 & 255);
      }
      if (s.gzhead.hcrc) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
      }
      s.gzindex = 0;
      s.status = EXTRA_STATE;
    }
  }
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra) {
      let beg = s.pending;
      let left = (s.gzhead.extra.length & 65535) - s.gzindex;
      while (s.pending + left > s.pending_buf_size) {
        let copy = s.pending_buf_size - s.pending;
        s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
        s.pending = s.pending_buf_size;
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex += copy;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
        beg = 0;
        left -= copy;
      }
      let gzhead_extra = new Uint8Array(s.gzhead.extra);
      s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
      s.pending += left;
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      s.gzindex = 0;
    }
    s.status = NAME_STATE;
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name) {
      let beg = s.pending;
      let val;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
        }
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      s.gzindex = 0;
    }
    s.status = COMMENT_STATE;
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment) {
      let beg = s.pending;
      let val;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
        }
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
    }
    s.status = HCRC_STATE;
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
      put_byte(s, strm.adler & 255);
      put_byte(s, strm.adler >> 8 & 255);
      strm.adler = 0;
    }
    s.status = BUSY_STATE;
    flush_pending(strm);
    if (s.pending !== 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  }
  if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
    let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
      }
      return Z_OK$3;
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        _tr_align(s);
      } else if (flush !== Z_BLOCK$1) {
        _tr_stored_block(s, 0, 0, false);
        if (flush === Z_FULL_FLUSH$1) {
          zero(s.head);
          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
  }
  if (flush !== Z_FINISH$3) {
    return Z_OK$3;
  }
  if (s.wrap <= 0) {
    return Z_STREAM_END$3;
  }
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 255);
    put_byte(s, strm.adler >> 8 & 255);
    put_byte(s, strm.adler >> 16 & 255);
    put_byte(s, strm.adler >> 24 & 255);
    put_byte(s, strm.total_in & 255);
    put_byte(s, strm.total_in >> 8 & 255);
    put_byte(s, strm.total_in >> 16 & 255);
    put_byte(s, strm.total_in >> 24 & 255);
  } else {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 65535);
  }
  flush_pending(strm);
  if (s.wrap > 0) {
    s.wrap = -s.wrap;
  }
  return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
};
var deflateEnd = (strm) => {
  if (deflateStateCheck(strm)) {
    return Z_STREAM_ERROR$2;
  }
  const status = strm.state.status;
  strm.state = null;
  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
};
var deflateSetDictionary = (strm, dictionary) => {
  let dictLength = dictionary.length;
  if (deflateStateCheck(strm)) {
    return Z_STREAM_ERROR$2;
  }
  const s = strm.state;
  const wrap = s.wrap;
  if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
    return Z_STREAM_ERROR$2;
  }
  if (wrap === 1) {
    strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
  }
  s.wrap = 0;
  if (dictLength >= s.w_size) {
    if (wrap === 0) {
      zero(s.head);
      s.strstart = 0;
      s.block_start = 0;
      s.insert = 0;
    }
    let tmpDict = new Uint8Array(s.w_size);
    tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
    dictionary = tmpDict;
    dictLength = s.w_size;
  }
  const avail = strm.avail_in;
  const next = strm.next_in;
  const input = strm.input;
  strm.avail_in = dictLength;
  strm.next_in = 0;
  strm.input = dictionary;
  fill_window(s);
  while (s.lookahead >= MIN_MATCH) {
    let str = s.strstart;
    let n = s.lookahead - (MIN_MATCH - 1);
    do {
      s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
      s.prev[str & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = str;
      str++;
    } while (--n);
    s.strstart = str;
    s.lookahead = MIN_MATCH - 1;
    fill_window(s);
  }
  s.strstart += s.lookahead;
  s.block_start = s.strstart;
  s.insert = s.lookahead;
  s.lookahead = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  strm.next_in = next;
  strm.input = input;
  strm.avail_in = avail;
  s.wrap = wrap;
  return Z_OK$3;
};
var deflateInit_1 = deflateInit;
var deflateInit2_1 = deflateInit2;
var deflateReset_1 = deflateReset;
var deflateResetKeep_1 = deflateResetKeep;
var deflateSetHeader_1 = deflateSetHeader;
var deflate_2$1 = deflate$2;
var deflateEnd_1 = deflateEnd;
var deflateSetDictionary_1 = deflateSetDictionary;
var deflateInfo = "pako deflate (from Nodeca project)";
var deflate_1$2 = {
  deflateInit: deflateInit_1,
  deflateInit2: deflateInit2_1,
  deflateReset: deflateReset_1,
  deflateResetKeep: deflateResetKeep_1,
  deflateSetHeader: deflateSetHeader_1,
  deflate: deflate_2$1,
  deflateEnd: deflateEnd_1,
  deflateSetDictionary: deflateSetDictionary_1,
  deflateInfo
};
var _has = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
var assign = function(obj) {
  const sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    const source = sources.shift();
    if (!source) {
      continue;
    }
    if (typeof source !== "object") {
      throw new TypeError(source + "must be non-object");
    }
    for (const p in source) {
      if (_has(source, p)) {
        obj[p] = source[p];
      }
    }
  }
  return obj;
};
var flattenChunks = (chunks) => {
  let len = 0;
  for (let i = 0, l = chunks.length;i < l; i++) {
    len += chunks[i].length;
  }
  const result = new Uint8Array(len);
  for (let i = 0, pos = 0, l = chunks.length;i < l; i++) {
    let chunk = chunks[i];
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
};
var common = {
  assign,
  flattenChunks
};
var STR_APPLY_UIA_OK = true;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch (__) {
  STR_APPLY_UIA_OK = false;
}
var _utf8len = new Uint8Array(256);
for (let q = 0;q < 256; q++) {
  _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
}
_utf8len[254] = _utf8len[254] = 1;
var string2buf = (str) => {
  if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
    return new TextEncoder().encode(str);
  }
  let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
  for (m_pos = 0;m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (c2 - 56320);
        m_pos++;
      }
    }
    buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
  }
  buf = new Uint8Array(buf_len);
  for (i = 0, m_pos = 0;i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (c2 - 56320);
        m_pos++;
      }
    }
    if (c < 128) {
      buf[i++] = c;
    } else if (c < 2048) {
      buf[i++] = 192 | c >>> 6;
      buf[i++] = 128 | c & 63;
    } else if (c < 65536) {
      buf[i++] = 224 | c >>> 12;
      buf[i++] = 128 | c >>> 6 & 63;
      buf[i++] = 128 | c & 63;
    } else {
      buf[i++] = 240 | c >>> 18;
      buf[i++] = 128 | c >>> 12 & 63;
      buf[i++] = 128 | c >>> 6 & 63;
      buf[i++] = 128 | c & 63;
    }
  }
  return buf;
};
var buf2binstring = (buf, len) => {
  if (len < 65534) {
    if (buf.subarray && STR_APPLY_UIA_OK) {
      return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
    }
  }
  let result = "";
  for (let i = 0;i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
};
var buf2string = (buf, max) => {
  const len = max || buf.length;
  if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
    return new TextDecoder().decode(buf.subarray(0, max));
  }
  let i, out;
  const utf16buf = new Array(len * 2);
  for (out = 0, i = 0;i < len; ) {
    let c = buf[i++];
    if (c < 128) {
      utf16buf[out++] = c;
      continue;
    }
    let c_len = _utf8len[c];
    if (c_len > 4) {
      utf16buf[out++] = 65533;
      i += c_len - 1;
      continue;
    }
    c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
    while (c_len > 1 && i < len) {
      c = c << 6 | buf[i++] & 63;
      c_len--;
    }
    if (c_len > 1) {
      utf16buf[out++] = 65533;
      continue;
    }
    if (c < 65536) {
      utf16buf[out++] = c;
    } else {
      c -= 65536;
      utf16buf[out++] = 55296 | c >> 10 & 1023;
      utf16buf[out++] = 56320 | c & 1023;
    }
  }
  return buf2binstring(utf16buf, out);
};
var utf8border = (buf, max) => {
  max = max || buf.length;
  if (max > buf.length) {
    max = buf.length;
  }
  let pos = max - 1;
  while (pos >= 0 && (buf[pos] & 192) === 128) {
    pos--;
  }
  if (pos < 0) {
    return max;
  }
  if (pos === 0) {
    return max;
  }
  return pos + _utf8len[buf[pos]] > max ? pos : max;
};
var strings = {
  string2buf,
  buf2string,
  utf8border
};
var zstream = ZStream;
var toString$1 = Object.prototype.toString;
var {
  Z_NO_FLUSH: Z_NO_FLUSH$1,
  Z_SYNC_FLUSH,
  Z_FULL_FLUSH,
  Z_FINISH: Z_FINISH$2,
  Z_OK: Z_OK$2,
  Z_STREAM_END: Z_STREAM_END$2,
  Z_DEFAULT_COMPRESSION,
  Z_DEFAULT_STRATEGY,
  Z_DEFLATED: Z_DEFLATED$1
} = constants$2;
Deflate$1.prototype.push = function(data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  let status, _flush_mode;
  if (this.ended) {
    return false;
  }
  if (flush_mode === ~~flush_mode)
    _flush_mode = flush_mode;
  else
    _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
  if (typeof data === "string") {
    strm.input = strings.string2buf(data);
  } else if (toString$1.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }
  strm.next_in = 0;
  strm.avail_in = strm.input.length;
  for (;; ) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }
    status = deflate_1$2.deflate(strm, _flush_mode);
    if (status === Z_STREAM_END$2) {
      if (strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
      }
      status = deflate_1$2.deflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return status === Z_OK$2;
    }
    if (strm.avail_out === 0) {
      this.onData(strm.output);
      continue;
    }
    if (_flush_mode > 0 && strm.next_out > 0) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }
    if (strm.avail_in === 0)
      break;
  }
  return true;
};
Deflate$1.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};
Deflate$1.prototype.onEnd = function(status) {
  if (status === Z_OK$2) {
    this.result = common.flattenChunks(this.chunks);
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};
var Deflate_1$1 = Deflate$1;
var deflate_2 = deflate$1;
var deflateRaw_1$1 = deflateRaw$1;
var gzip_1$1 = gzip$1;
var constants$1 = constants$2;
var deflate_1$1 = {
  Deflate: Deflate_1$1,
  deflate: deflate_2,
  deflateRaw: deflateRaw_1$1,
  gzip: gzip_1$1,
  constants: constants$1
};
var BAD$1 = 16209;
var TYPE$1 = 16191;
var inffast = function inflate_fast(strm, start) {
  let _in;
  let last;
  let _out;
  let beg;
  let end;
  let dmax;
  let wsize;
  let whave;
  let wnext;
  let s_window;
  let hold;
  let bits;
  let lcode;
  let dcode;
  let lmask;
  let dmask;
  let here;
  let op;
  let len;
  let dist;
  let from;
  let from_source;
  let input, output;
  const state = strm.state;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
  dmax = state.dmax;
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;
  top:
    do {
      if (bits < 15) {
        hold += input[_in++] << bits;
        bits += 8;
        hold += input[_in++] << bits;
        bits += 8;
      }
      here = lcode[hold & lmask];
      dolen:
        for (;; ) {
          op = here >>> 24;
          hold >>>= op;
          bits -= op;
          op = here >>> 16 & 255;
          if (op === 0) {
            output[_out++] = here & 65535;
          } else if (op & 16) {
            len = here & 65535;
            op &= 15;
            if (op) {
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
              len += hold & (1 << op) - 1;
              hold >>>= op;
              bits -= op;
            }
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = dcode[hold & dmask];
            dodist:
              for (;; ) {
                op = here >>> 24;
                hold >>>= op;
                bits -= op;
                op = here >>> 16 & 255;
                if (op & 16) {
                  dist = here & 65535;
                  op &= 15;
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                  }
                  dist += hold & (1 << op) - 1;
                  if (dist > dmax) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD$1;
                    break top;
                  }
                  hold >>>= op;
                  bits -= op;
                  op = _out - beg;
                  if (dist > op) {
                    op = dist - op;
                    if (op > whave) {
                      if (state.sane) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD$1;
                        break top;
                      }
                    }
                    from = 0;
                    from_source = s_window;
                    if (wnext === 0) {
                      from += wsize - op;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;
                        from_source = output;
                      }
                    } else if (wnext < op) {
                      from += wsize + wnext - op;
                      op -= wnext;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = 0;
                        if (wnext < len) {
                          op = wnext;
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      }
                    } else {
                      from += wnext - op;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;
                        from_source = output;
                      }
                    }
                    while (len > 2) {
                      output[_out++] = from_source[from++];
                      output[_out++] = from_source[from++];
                      output[_out++] = from_source[from++];
                      len -= 3;
                    }
                    if (len) {
                      output[_out++] = from_source[from++];
                      if (len > 1) {
                        output[_out++] = from_source[from++];
                      }
                    }
                  } else {
                    from = _out - dist;
                    do {
                      output[_out++] = output[from++];
                      output[_out++] = output[from++];
                      output[_out++] = output[from++];
                      len -= 3;
                    } while (len > 2);
                    if (len) {
                      output[_out++] = output[from++];
                      if (len > 1) {
                        output[_out++] = output[from++];
                      }
                    }
                  }
                } else if ((op & 64) === 0) {
                  here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                  continue dodist;
                } else {
                  strm.msg = "invalid distance code";
                  state.mode = BAD$1;
                  break top;
                }
                break;
              }
          } else if ((op & 64) === 0) {
            here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
            continue dolen;
          } else if (op & 32) {
            state.mode = TYPE$1;
            break top;
          } else {
            strm.msg = "invalid literal/length code";
            state.mode = BAD$1;
            break top;
          }
          break;
        }
    } while (_in < last && _out < end);
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
  strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
  state.hold = hold;
  state.bits = bits;
  return;
};
var MAXBITS = 15;
var ENOUGH_LENS$1 = 852;
var ENOUGH_DISTS$1 = 592;
var CODES$1 = 0;
var LENS$1 = 1;
var DISTS$1 = 2;
var lbase = new Uint16Array([
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]);
var lext = new Uint8Array([
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]);
var dbase = new Uint16Array([
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]);
var dext = new Uint8Array([
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]);
var inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
  const bits = opts.bits;
  let len = 0;
  let sym = 0;
  let min = 0, max = 0;
  let root = 0;
  let curr = 0;
  let drop = 0;
  let left = 0;
  let used = 0;
  let huff = 0;
  let incr;
  let fill;
  let low;
  let mask;
  let next;
  let base = null;
  let match;
  const count = new Uint16Array(MAXBITS + 1);
  const offs = new Uint16Array(MAXBITS + 1);
  let extra = null;
  let here_bits, here_op, here_val;
  for (len = 0;len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0;sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }
  root = bits;
  for (max = MAXBITS;max >= 1; max--) {
    if (count[max] !== 0) {
      break;
    }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {
    table[table_index++] = 1 << 24 | 64 << 16 | 0;
    table[table_index++] = 1 << 24 | 64 << 16 | 0;
    opts.bits = 1;
    return 0;
  }
  for (min = 1;min < max; min++) {
    if (count[min] !== 0) {
      break;
    }
  }
  if (root < min) {
    root = min;
  }
  left = 1;
  for (len = 1;len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }
  }
  if (left > 0 && (type === CODES$1 || max !== 1)) {
    return -1;
  }
  offs[1] = 0;
  for (len = 1;len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }
  for (sym = 0;sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }
  if (type === CODES$1) {
    base = extra = work;
    match = 20;
  } else if (type === LENS$1) {
    base = lbase;
    extra = lext;
    match = 257;
  } else {
    base = dbase;
    extra = dext;
    match = 0;
  }
  huff = 0;
  sym = 0;
  len = min;
  next = table_index;
  curr = root;
  drop = 0;
  low = -1;
  used = 1 << root;
  mask = used - 1;
  if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
    return 1;
  }
  for (;; ) {
    here_bits = len - drop;
    if (work[sym] + 1 < match) {
      here_op = 0;
      here_val = work[sym];
    } else if (work[sym] >= match) {
      here_op = extra[work[sym] - match];
      here_val = base[work[sym] - match];
    } else {
      here_op = 32 + 64;
      here_val = 0;
    }
    incr = 1 << len - drop;
    fill = 1 << curr;
    min = fill;
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
    } while (fill !== 0);
    incr = 1 << len - 1;
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }
    sym++;
    if (--count[len] === 0) {
      if (len === max) {
        break;
      }
      len = lens[lens_index + work[sym]];
    }
    if (len > root && (huff & mask) !== low) {
      if (drop === 0) {
        drop = root;
      }
      next += min;
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) {
          break;
        }
        curr++;
        left <<= 1;
      }
      used += 1 << curr;
      if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
        return 1;
      }
      low = huff & mask;
      table[low] = root << 24 | curr << 16 | next - table_index | 0;
    }
  }
  if (huff !== 0) {
    table[next + huff] = len - drop << 24 | 64 << 16 | 0;
  }
  opts.bits = root;
  return 0;
};
var inftrees = inflate_table;
var CODES = 0;
var LENS = 1;
var DISTS = 2;
var {
  Z_FINISH: Z_FINISH$1,
  Z_BLOCK,
  Z_TREES,
  Z_OK: Z_OK$1,
  Z_STREAM_END: Z_STREAM_END$1,
  Z_NEED_DICT: Z_NEED_DICT$1,
  Z_STREAM_ERROR: Z_STREAM_ERROR$1,
  Z_DATA_ERROR: Z_DATA_ERROR$1,
  Z_MEM_ERROR: Z_MEM_ERROR$1,
  Z_BUF_ERROR,
  Z_DEFLATED
} = constants$2;
var HEAD = 16180;
var FLAGS = 16181;
var TIME = 16182;
var OS = 16183;
var EXLEN = 16184;
var EXTRA = 16185;
var NAME = 16186;
var COMMENT = 16187;
var HCRC = 16188;
var DICTID = 16189;
var DICT = 16190;
var TYPE = 16191;
var TYPEDO = 16192;
var STORED = 16193;
var COPY_ = 16194;
var COPY = 16195;
var TABLE = 16196;
var LENLENS = 16197;
var CODELENS = 16198;
var LEN_ = 16199;
var LEN = 16200;
var LENEXT = 16201;
var DIST = 16202;
var DISTEXT = 16203;
var MATCH = 16204;
var LIT = 16205;
var CHECK = 16206;
var LENGTH = 16207;
var DONE = 16208;
var BAD = 16209;
var MEM = 16210;
var SYNC = 16211;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
var MAX_WBITS = 15;
var DEF_WBITS = MAX_WBITS;
var zswap32 = (q) => {
  return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
};
var inflateStateCheck = (strm) => {
  if (!strm) {
    return 1;
  }
  const state = strm.state;
  if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
    return 1;
  }
  return 0;
};
var inflateResetKeep = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = "";
  if (state.wrap) {
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.flags = -1;
  state.dmax = 32768;
  state.head = null;
  state.hold = 0;
  state.bits = 0;
  state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
  state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
  state.sane = 1;
  state.back = -1;
  return Z_OK$1;
};
var inflateReset = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);
};
var inflateReset2 = (strm, windowBits) => {
  let wrap;
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  } else {
    wrap = (windowBits >> 4) + 5;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR$1;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
};
var inflateInit2 = (strm, windowBits) => {
  if (!strm) {
    return Z_STREAM_ERROR$1;
  }
  const state = new InflateState;
  strm.state = state;
  state.strm = strm;
  state.window = null;
  state.mode = HEAD;
  const ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK$1) {
    strm.state = null;
  }
  return ret;
};
var inflateInit = (strm) => {
  return inflateInit2(strm, DEF_WBITS);
};
var virgin = true;
var lenfix;
var distfix;
var fixedtables = (state) => {
  if (virgin) {
    lenfix = new Int32Array(512);
    distfix = new Int32Array(32);
    let sym = 0;
    while (sym < 144) {
      state.lens[sym++] = 8;
    }
    while (sym < 256) {
      state.lens[sym++] = 9;
    }
    while (sym < 280) {
      state.lens[sym++] = 7;
    }
    while (sym < 288) {
      state.lens[sym++] = 8;
    }
    inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
    sym = 0;
    while (sym < 32) {
      state.lens[sym++] = 5;
    }
    inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
    virgin = false;
  }
  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
};
var updatewindow = (strm, src, end, copy) => {
  let dist;
  const state = strm.state;
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;
    state.window = new Uint8Array(state.wsize);
  }
  if (copy >= state.wsize) {
    state.window.set(src.subarray(end - state.wsize, end), 0);
    state.wnext = 0;
    state.whave = state.wsize;
  } else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
    copy -= dist;
    if (copy) {
      state.window.set(src.subarray(end - copy, end), 0);
      state.wnext = copy;
      state.whave = state.wsize;
    } else {
      state.wnext += dist;
      if (state.wnext === state.wsize) {
        state.wnext = 0;
      }
      if (state.whave < state.wsize) {
        state.whave += dist;
      }
    }
  }
  return 0;
};
var inflate$2 = (strm, flush) => {
  let state;
  let input, output;
  let next;
  let put;
  let have, left;
  let hold;
  let bits;
  let _in, _out;
  let copy;
  let from;
  let from_source;
  let here = 0;
  let here_bits, here_op, here_val;
  let last_bits, last_op, last_val;
  let len;
  let ret;
  const hbuf = new Uint8Array(4);
  let opts;
  let n;
  const order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
    return Z_STREAM_ERROR$1;
  }
  state = strm.state;
  if (state.mode === TYPE) {
    state.mode = TYPEDO;
  }
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  _in = have;
  _out = left;
  ret = Z_OK$1;
  inf_leave:
    for (;; ) {
      switch (state.mode) {
        case HEAD:
          if (state.wrap === 0) {
            state.mode = TYPEDO;
            break;
          }
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.wrap & 2 && hold === 35615) {
            if (state.wbits === 0) {
              state.wbits = 15;
            }
            state.check = 0;
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
            hold = 0;
            bits = 0;
            state.mode = FLAGS;
            break;
          }
          if (state.head) {
            state.head.done = false;
          }
          if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
            strm.msg = "incorrect header check";
            state.mode = BAD;
            break;
          }
          if ((hold & 15) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD;
            break;
          }
          hold >>>= 4;
          bits -= 4;
          len = (hold & 15) + 8;
          if (state.wbits === 0) {
            state.wbits = len;
          }
          if (len > 15 || len > state.wbits) {
            strm.msg = "invalid window size";
            state.mode = BAD;
            break;
          }
          state.dmax = 1 << state.wbits;
          state.flags = 0;
          strm.adler = state.check = 1;
          state.mode = hold & 512 ? DICTID : TYPE;
          hold = 0;
          bits = 0;
          break;
        case FLAGS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.flags = hold;
          if ((state.flags & 255) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD;
            break;
          }
          if (state.flags & 57344) {
            strm.msg = "unknown header flags set";
            state.mode = BAD;
            break;
          }
          if (state.head) {
            state.head.text = hold >> 8 & 1;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = TIME;
        case TIME:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.time = hold;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            hbuf[2] = hold >>> 16 & 255;
            hbuf[3] = hold >>> 24 & 255;
            state.check = crc32_1(state.check, hbuf, 4, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = OS;
        case OS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.xflags = hold & 255;
            state.head.os = hold >> 8;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = EXLEN;
        case EXLEN:
          if (state.flags & 1024) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length = hold;
            if (state.head) {
              state.head.extra_len = hold;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
          } else if (state.head) {
            state.head.extra = null;
          }
          state.mode = EXTRA;
        case EXTRA:
          if (state.flags & 1024) {
            copy = state.length;
            if (copy > have) {
              copy = have;
            }
            if (copy) {
              if (state.head) {
                len = state.head.extra_len - state.length;
                if (!state.head.extra) {
                  state.head.extra = new Uint8Array(state.head.extra_len);
                }
                state.head.extra.set(input.subarray(next, next + copy), len);
              }
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              state.length -= copy;
            }
            if (state.length) {
              break inf_leave;
            }
          }
          state.length = 0;
          state.mode = NAME;
        case NAME:
          if (state.flags & 2048) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.name += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512 && state.wrap & 4) {
              state.check = crc32_1(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.name = null;
          }
          state.length = 0;
          state.mode = COMMENT;
        case COMMENT:
          if (state.flags & 4096) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.comment += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512 && state.wrap & 4) {
              state.check = crc32_1(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.comment = null;
          }
          state.mode = HCRC;
        case HCRC:
          if (state.flags & 512) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 4 && hold !== (state.check & 65535)) {
              strm.msg = "header crc mismatch";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          if (state.head) {
            state.head.hcrc = state.flags >> 9 & 1;
            state.head.done = true;
          }
          strm.adler = state.check = 0;
          state.mode = TYPE;
          break;
        case DICTID:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          strm.adler = state.check = zswap32(hold);
          hold = 0;
          bits = 0;
          state.mode = DICT;
        case DICT:
          if (state.havedict === 0) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            return Z_NEED_DICT$1;
          }
          strm.adler = state.check = 1;
          state.mode = TYPE;
        case TYPE:
          if (flush === Z_BLOCK || flush === Z_TREES) {
            break inf_leave;
          }
        case TYPEDO:
          if (state.last) {
            hold >>>= bits & 7;
            bits -= bits & 7;
            state.mode = CHECK;
            break;
          }
          while (bits < 3) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.last = hold & 1;
          hold >>>= 1;
          bits -= 1;
          switch (hold & 3) {
            case 0:
              state.mode = STORED;
              break;
            case 1:
              fixedtables(state);
              state.mode = LEN_;
              if (flush === Z_TREES) {
                hold >>>= 2;
                bits -= 2;
                break inf_leave;
              }
              break;
            case 2:
              state.mode = TABLE;
              break;
            case 3:
              strm.msg = "invalid block type";
              state.mode = BAD;
          }
          hold >>>= 2;
          bits -= 2;
          break;
        case STORED:
          hold >>>= bits & 7;
          bits -= bits & 7;
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
            strm.msg = "invalid stored block lengths";
            state.mode = BAD;
            break;
          }
          state.length = hold & 65535;
          hold = 0;
          bits = 0;
          state.mode = COPY_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        case COPY_:
          state.mode = COPY;
        case COPY:
          copy = state.length;
          if (copy) {
            if (copy > have) {
              copy = have;
            }
            if (copy > left) {
              copy = left;
            }
            if (copy === 0) {
              break inf_leave;
            }
            output.set(input.subarray(next, next + copy), put);
            have -= copy;
            next += copy;
            left -= copy;
            put += copy;
            state.length -= copy;
            break;
          }
          state.mode = TYPE;
          break;
        case TABLE:
          while (bits < 14) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.nlen = (hold & 31) + 257;
          hold >>>= 5;
          bits -= 5;
          state.ndist = (hold & 31) + 1;
          hold >>>= 5;
          bits -= 5;
          state.ncode = (hold & 15) + 4;
          hold >>>= 4;
          bits -= 4;
          if (state.nlen > 286 || state.ndist > 30) {
            strm.msg = "too many length or distance symbols";
            state.mode = BAD;
            break;
          }
          state.have = 0;
          state.mode = LENLENS;
        case LENLENS:
          while (state.have < state.ncode) {
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.lens[order[state.have++]] = hold & 7;
            hold >>>= 3;
            bits -= 3;
          }
          while (state.have < 19) {
            state.lens[order[state.have++]] = 0;
          }
          state.lencode = state.lendyn;
          state.lenbits = 7;
          opts = { bits: state.lenbits };
          ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid code lengths set";
            state.mode = BAD;
            break;
          }
          state.have = 0;
          state.mode = CODELENS;
        case CODELENS:
          while (state.have < state.nlen + state.ndist) {
            for (;; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_val < 16) {
              hold >>>= here_bits;
              bits -= here_bits;
              state.lens[state.have++] = here_val;
            } else {
              if (here_val === 16) {
                n = here_bits + 2;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                if (state.have === 0) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD;
                  break;
                }
                len = state.lens[state.have - 1];
                copy = 3 + (hold & 3);
                hold >>>= 2;
                bits -= 2;
              } else if (here_val === 17) {
                n = here_bits + 3;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 3 + (hold & 7);
                hold >>>= 3;
                bits -= 3;
              } else {
                n = here_bits + 7;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 11 + (hold & 127);
                hold >>>= 7;
                bits -= 7;
              }
              if (state.have + copy > state.nlen + state.ndist) {
                strm.msg = "invalid bit length repeat";
                state.mode = BAD;
                break;
              }
              while (copy--) {
                state.lens[state.have++] = len;
              }
            }
          }
          if (state.mode === BAD) {
            break;
          }
          if (state.lens[256] === 0) {
            strm.msg = "invalid code -- missing end-of-block";
            state.mode = BAD;
            break;
          }
          state.lenbits = 9;
          opts = { bits: state.lenbits };
          ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid literal/lengths set";
            state.mode = BAD;
            break;
          }
          state.distbits = 6;
          state.distcode = state.distdyn;
          opts = { bits: state.distbits };
          ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
          state.distbits = opts.bits;
          if (ret) {
            strm.msg = "invalid distances set";
            state.mode = BAD;
            break;
          }
          state.mode = LEN_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        case LEN_:
          state.mode = LEN;
        case LEN:
          if (have >= 6 && left >= 258) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            inffast(strm, _out);
            put = strm.next_out;
            output = strm.output;
            left = strm.avail_out;
            next = strm.next_in;
            input = strm.input;
            have = strm.avail_in;
            hold = state.hold;
            bits = state.bits;
            if (state.mode === TYPE) {
              state.back = -1;
            }
            break;
          }
          state.back = 0;
          for (;; ) {
            here = state.lencode[hold & (1 << state.lenbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (here_op && (here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (;; ) {
              here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          state.length = here_val;
          if (here_op === 0) {
            state.mode = LIT;
            break;
          }
          if (here_op & 32) {
            state.back = -1;
            state.mode = TYPE;
            break;
          }
          if (here_op & 64) {
            strm.msg = "invalid literal/length code";
            state.mode = BAD;
            break;
          }
          state.extra = here_op & 15;
          state.mode = LENEXT;
        case LENEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          state.was = state.length;
          state.mode = DIST;
        case DIST:
          for (;; ) {
            here = state.distcode[hold & (1 << state.distbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (;; ) {
              here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          if (here_op & 64) {
            strm.msg = "invalid distance code";
            state.mode = BAD;
            break;
          }
          state.offset = here_val;
          state.extra = here_op & 15;
          state.mode = DISTEXT;
        case DISTEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.offset += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          if (state.offset > state.dmax) {
            strm.msg = "invalid distance too far back";
            state.mode = BAD;
            break;
          }
          state.mode = MATCH;
        case MATCH:
          if (left === 0) {
            break inf_leave;
          }
          copy = _out - left;
          if (state.offset > copy) {
            copy = state.offset - copy;
            if (copy > state.whave) {
              if (state.sane) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break;
              }
            }
            if (copy > state.wnext) {
              copy -= state.wnext;
              from = state.wsize - copy;
            } else {
              from = state.wnext - copy;
            }
            if (copy > state.length) {
              copy = state.length;
            }
            from_source = state.window;
          } else {
            from_source = output;
            from = put - state.offset;
            copy = state.length;
          }
          if (copy > left) {
            copy = left;
          }
          left -= copy;
          state.length -= copy;
          do {
            output[put++] = from_source[from++];
          } while (--copy);
          if (state.length === 0) {
            state.mode = LEN;
          }
          break;
        case LIT:
          if (left === 0) {
            break inf_leave;
          }
          output[put++] = state.length;
          left--;
          state.mode = LEN;
          break;
        case CHECK:
          if (state.wrap) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold |= input[next++] << bits;
              bits += 8;
            }
            _out -= left;
            strm.total_out += _out;
            state.total += _out;
            if (state.wrap & 4 && _out) {
              strm.adler = state.check = state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
            }
            _out = left;
            if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
              strm.msg = "incorrect data check";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = LENGTH;
        case LENGTH:
          if (state.wrap && state.flags) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
              strm.msg = "incorrect length check";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = DONE;
        case DONE:
          ret = Z_STREAM_END$1;
          break inf_leave;
        case BAD:
          ret = Z_DATA_ERROR$1;
          break inf_leave;
        case MEM:
          return Z_MEM_ERROR$1;
        case SYNC:
        default:
          return Z_STREAM_ERROR$1;
      }
    }
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out))
      ;
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap & 4 && _out) {
    strm.adler = state.check = state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
    ret = Z_BUF_ERROR;
  }
  return ret;
};
var inflateEnd = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  let state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK$1;
};
var inflateGetHeader = (strm, head) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  if ((state.wrap & 2) === 0) {
    return Z_STREAM_ERROR$1;
  }
  state.head = head;
  head.done = false;
  return Z_OK$1;
};
var inflateSetDictionary = (strm, dictionary) => {
  const dictLength = dictionary.length;
  let state;
  let dictid;
  let ret;
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  state = strm.state;
  if (state.wrap !== 0 && state.mode !== DICT) {
    return Z_STREAM_ERROR$1;
  }
  if (state.mode === DICT) {
    dictid = 1;
    dictid = adler32_1(dictid, dictionary, dictLength, 0);
    if (dictid !== state.check) {
      return Z_DATA_ERROR$1;
    }
  }
  ret = updatewindow(strm, dictionary, dictLength, dictLength);
  if (ret) {
    state.mode = MEM;
    return Z_MEM_ERROR$1;
  }
  state.havedict = 1;
  return Z_OK$1;
};
var inflateReset_1 = inflateReset;
var inflateReset2_1 = inflateReset2;
var inflateResetKeep_1 = inflateResetKeep;
var inflateInit_1 = inflateInit;
var inflateInit2_1 = inflateInit2;
var inflate_2$1 = inflate$2;
var inflateEnd_1 = inflateEnd;
var inflateGetHeader_1 = inflateGetHeader;
var inflateSetDictionary_1 = inflateSetDictionary;
var inflateInfo = "pako inflate (from Nodeca project)";
var inflate_1$2 = {
  inflateReset: inflateReset_1,
  inflateReset2: inflateReset2_1,
  inflateResetKeep: inflateResetKeep_1,
  inflateInit: inflateInit_1,
  inflateInit2: inflateInit2_1,
  inflate: inflate_2$1,
  inflateEnd: inflateEnd_1,
  inflateGetHeader: inflateGetHeader_1,
  inflateSetDictionary: inflateSetDictionary_1,
  inflateInfo
};
var gzheader = GZheader;
var toString = Object.prototype.toString;
var {
  Z_NO_FLUSH,
  Z_FINISH,
  Z_OK,
  Z_STREAM_END,
  Z_NEED_DICT,
  Z_STREAM_ERROR,
  Z_DATA_ERROR,
  Z_MEM_ERROR
} = constants$2;
Inflate$1.prototype.push = function(data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  const dictionary = this.options.dictionary;
  let status, _flush_mode, last_avail_out;
  if (this.ended)
    return false;
  if (flush_mode === ~~flush_mode)
    _flush_mode = flush_mode;
  else
    _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
  if (toString.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }
  strm.next_in = 0;
  strm.avail_in = strm.input.length;
  for (;; ) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = inflate_1$2.inflate(strm, _flush_mode);
    if (status === Z_NEED_DICT && dictionary) {
      status = inflate_1$2.inflateSetDictionary(strm, dictionary);
      if (status === Z_OK) {
        status = inflate_1$2.inflate(strm, _flush_mode);
      } else if (status === Z_DATA_ERROR) {
        status = Z_NEED_DICT;
      }
    }
    while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
      inflate_1$2.inflateReset(strm);
      status = inflate_1$2.inflate(strm, _flush_mode);
    }
    switch (status) {
      case Z_STREAM_ERROR:
      case Z_DATA_ERROR:
      case Z_NEED_DICT:
      case Z_MEM_ERROR:
        this.onEnd(status);
        this.ended = true;
        return false;
    }
    last_avail_out = strm.avail_out;
    if (strm.next_out) {
      if (strm.avail_out === 0 || status === Z_STREAM_END) {
        if (this.options.to === "string") {
          let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
          let tail = strm.next_out - next_out_utf8;
          let utf8str = strings.buf2string(strm.output, next_out_utf8);
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail)
            strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
          this.onData(utf8str);
        } else {
          this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
        }
      }
    }
    if (status === Z_OK && last_avail_out === 0)
      continue;
    if (status === Z_STREAM_END) {
      status = inflate_1$2.inflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return true;
    }
    if (strm.avail_in === 0)
      break;
  }
  return true;
};
Inflate$1.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};
Inflate$1.prototype.onEnd = function(status) {
  if (status === Z_OK) {
    if (this.options.to === "string") {
      this.result = this.chunks.join("");
    } else {
      this.result = common.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};
var Inflate_1$1 = Inflate$1;
var inflate_2 = inflate$1;
var inflateRaw_1$1 = inflateRaw$1;
var ungzip$1 = inflate$1;
var constants = constants$2;
var inflate_1$1 = {
  Inflate: Inflate_1$1,
  inflate: inflate_2,
  inflateRaw: inflateRaw_1$1,
  ungzip: ungzip$1,
  constants
};
var { Deflate, deflate, deflateRaw, gzip } = deflate_1$1;
var { Inflate, inflate, inflateRaw, ungzip } = inflate_1$1;
var Deflate_1 = Deflate;
var deflate_1 = deflate;
var deflateRaw_1 = deflateRaw;
var gzip_1 = gzip;
var Inflate_1 = Inflate;
var inflate_1 = inflate;
var inflateRaw_1 = inflateRaw;
var ungzip_1 = ungzip;
var constants_1 = constants$2;
var pako = {
  Deflate: Deflate_1,
  deflate: deflate_1,
  deflateRaw: deflateRaw_1,
  gzip: gzip_1,
  Inflate: Inflate_1,
  inflate: inflate_1,
  inflateRaw: inflateRaw_1,
  ungzip: ungzip_1,
  constants: constants_1
};

// node_modules/trystero/node_modules/@noble/hashes/esm/_assert.js
var anumber = function(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
};
var isBytes = function(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
};
var abytes = function(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
};
var ahash = function(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash should be wrapped by utils.wrapConstructor");
  anumber(h.outputLen);
  anumber(h.blockLen);
};
var aexists = function(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
};
var aoutput = function(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
};

// node_modules/trystero/node_modules/@noble/hashes/esm/crypto.js
var crypto2 = typeof globalThis === "object" && ("crypto" in globalThis) ? globalThis.crypto : undefined;

// node_modules/trystero/node_modules/@noble/hashes/esm/utils.js
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("utf8ToBytes expected string, got " + typeof str);
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0;i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0;i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function wrapConstructor(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function randomBytes(bytesLength = 32) {
  if (crypto2 && typeof crypto2.getRandomValues === "function") {
    return crypto2.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto2 && typeof crypto2.randomBytes === "function") {
    return crypto2.randomBytes(bytesLength);
  }
  throw new Error("crypto.getRandomValues must be defined");
}
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
class Hash {
  clone() {
    return this._cloneInto();
  }
}

// node_modules/trystero/node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE ? 4 : 0;
  const l = isLE ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE);
  view.setUint32(byteOffset + l, wl, isLE);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}

class HashMD extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE) {
    super();
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    const { view, buffer, blockLen } = this;
    data = toBytes(data);
    const len = data.length;
    for (let pos = 0;pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (;blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    this.buffer.subarray(pos).fill(0);
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos;i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0;i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor);
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.length = length;
    to.pos = pos;
    to.finished = finished;
    to.destroyed = destroyed;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
}

// node_modules/trystero/node_modules/@noble/hashes/esm/sha256.js
var SHA256_K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_IV = new Uint32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA256_W = new Uint32Array(64);

class SHA256 extends HashMD {
  constructor() {
    super(64, 32, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0;i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16;i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0;i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    SHA256_W.fill(0);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    this.buffer.fill(0);
  }
}
var sha256 = wrapConstructor(() => new SHA256);

// node_modules/trystero/node_modules/@noble/hashes/esm/hmac.js
class HMAC extends Hash {
  constructor(hash, _key) {
    super();
    this.finished = false;
    this.destroyed = false;
    ahash(hash);
    const key = toBytes(_key);
    this.iHash = hash.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
    for (let i = 0;i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash.create();
    for (let i = 0;i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    pad.fill(0);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    abytes(out, this.outputLen);
    this.finished = true;
    this.iHash.digestInto(out);
    this.oHash.update(out);
    this.oHash.digestInto(out);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to || (to = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
}
var hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new HMAC(hash, key);

// node_modules/trystero/node_modules/@noble/curves/esm/abstract/utils.js
var exports_utils = {};
__export(exports_utils, {
  validateObject: () => {
    {
      return validateObject;
    }
  },
  utf8ToBytes: () => {
    {
      return utf8ToBytes2;
    }
  },
  numberToVarBytesBE: () => {
    {
      return numberToVarBytesBE;
    }
  },
  numberToHexUnpadded: () => {
    {
      return numberToHexUnpadded;
    }
  },
  numberToBytesLE: () => {
    {
      return numberToBytesLE;
    }
  },
  numberToBytesBE: () => {
    {
      return numberToBytesBE;
    }
  },
  notImplemented: () => {
    {
      return notImplemented;
    }
  },
  memoized: () => {
    {
      return memoized;
    }
  },
  isBytes: () => {
    {
      return isBytes2;
    }
  },
  inRange: () => {
    {
      return inRange;
    }
  },
  hexToNumber: () => {
    {
      return hexToNumber;
    }
  },
  hexToBytes: () => {
    {
      return hexToBytes;
    }
  },
  equalBytes: () => {
    {
      return equalBytes;
    }
  },
  ensureBytes: () => {
    {
      return ensureBytes;
    }
  },
  createHmacDrbg: () => {
    {
      return createHmacDrbg;
    }
  },
  concatBytes: () => {
    {
      return concatBytes2;
    }
  },
  bytesToNumberLE: () => {
    {
      return bytesToNumberLE;
    }
  },
  bytesToNumberBE: () => {
    {
      return bytesToNumberBE;
    }
  },
  bytesToHex: () => {
    {
      return bytesToHex;
    }
  },
  bitSet: () => {
    {
      return bitSet;
    }
  },
  bitMask: () => {
    {
      return bitMask;
    }
  },
  bitLen: () => {
    {
      return bitLen;
    }
  },
  bitGet: () => {
    {
      return bitGet;
    }
  },
  abytes: () => {
    {
      return abytes2;
    }
  },
  abool: () => {
    {
      return abool;
    }
  },
  aInRange: () => {
    {
      return aInRange;
    }
  }
});
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes2(item) {
  if (!isBytes2(item))
    throw new Error("Uint8Array expected");
}
function abool(title, value) {
  if (typeof value !== "boolean")
    throw new Error(title + " boolean expected, got " + value);
}
function bytesToHex(bytes) {
  abytes2(bytes);
  let hex = "";
  for (let i = 0;i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
function numberToHexUnpadded(num) {
  const hex = num.toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return hex === "" ? _0n : BigInt("0x" + hex);
}
var asciiToBase16 = function(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
};
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0;ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === undefined || n2 === undefined) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  abytes2(bytes);
  return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n, len) {
  return hexToBytes(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function numberToVarBytesBE(n) {
  return hexToBytes(numberToHexUnpadded(n));
}
function ensureBytes(title, hex, expectedLength) {
  let res;
  if (typeof hex === "string") {
    try {
      res = hexToBytes(hex);
    } catch (e) {
      throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
    }
  } else if (isBytes2(hex)) {
    res = Uint8Array.from(hex);
  } else {
    throw new Error(title + " must be hex string or Uint8Array");
  }
  const len = res.length;
  if (typeof expectedLength === "number" && len !== expectedLength)
    throw new Error(title + " of length " + expectedLength + " expected, got " + len);
  return res;
}
function concatBytes2(...arrays) {
  let sum = 0;
  for (let i = 0;i < arrays.length; i++) {
    const a = arrays[i];
    abytes2(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0;i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0;i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function utf8ToBytes2(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0;n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
function bitGet(n, pos) {
  return n >> BigInt(pos) & _1n;
}
function bitSet(n, pos, value) {
  return n | (value ? _1n : _0n) << BigInt(pos);
}
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  if (typeof hashLen !== "number" || hashLen < 2)
    throw new Error("hashLen must be a number");
  if (typeof qByteLen !== "number" || qByteLen < 2)
    throw new Error("qByteLen must be a number");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...b) => hmacFn(k, v, ...b);
  const reseed = (seed = u8n()) => {
    k = h(u8fr([0]), seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(u8fr([1]), seed);
    v = h();
  };
  const gen = () => {
    if (i++ >= 1000)
      throw new Error("drbg: tried 1000 values");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes2(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = undefined;
    while (!(res = pred(gen())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object, validators, optValidators = {}) {
  const checkField = (fieldName, type, isOptional) => {
    const checkVal = validatorFns[type];
    if (typeof checkVal !== "function")
      throw new Error("invalid validator function");
    const val = object[fieldName];
    if (isOptional && val === undefined)
      return;
    if (!checkVal(val, object)) {
      throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
    }
  };
  for (const [fieldName, type] of Object.entries(validators))
    checkField(fieldName, type, false);
  for (const [fieldName, type] of Object.entries(optValidators))
    checkField(fieldName, type, true);
  return object;
}
function memoized(fn) {
  const map = new WeakMap;
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== undefined)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n = BigInt(0);
var _1n = BigInt(1);
var _2n = BigInt(2);
var hexes = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
var bitMask = (n) => (_2n << BigInt(n - 1)) - _1n;
var u8n = (data) => new Uint8Array(data);
var u8fr = (arr) => Uint8Array.from(arr);
var validatorFns = {
  bigint: (val) => typeof val === "bigint",
  function: (val) => typeof val === "function",
  boolean: (val) => typeof val === "boolean",
  string: (val) => typeof val === "string",
  stringOrUint8Array: (val) => typeof val === "string" || isBytes2(val),
  isSafeInteger: (val) => Number.isSafeInteger(val),
  array: (val) => Array.isArray(val),
  field: (val, object) => object.Fp.isValid(val),
  hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
};
var notImplemented = () => {
  throw new Error("not implemented");
};

// node_modules/trystero/node_modules/@noble/curves/esm/abstract/modular.js
function mod(a, b) {
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow(num, power, modulo) {
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (modulo <= _0n2)
    throw new Error("invalid modulus");
  if (modulo === _1n2)
    return _0n2;
  let res = _1n2;
  while (power > _0n2) {
    if (power & _1n2)
      res = res * num % modulo;
    num = num * num % modulo;
    power >>= _1n2;
  }
  return res;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (gcd !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function tonelliShanks(P) {
  const legendreC = (P - _1n2) / _2n2;
  let Q, S, Z;
  for (Q = P - _1n2, S = 0;Q % _2n2 === _0n2; Q /= _2n2, S++)
    ;
  for (Z = _2n2;Z < P && pow(Z, legendreC, P) !== P - _1n2; Z++) {
    if (Z > 1000)
      throw new Error("Cannot find square root: likely non-prime P");
  }
  if (S === 1) {
    const p1div4 = (P + _1n2) / _4n;
    return function tonelliFast(Fp, n) {
      const root = Fp.pow(n, p1div4);
      if (!Fp.eql(Fp.sqr(root), n))
        throw new Error("Cannot find square root");
      return root;
    };
  }
  const Q1div2 = (Q + _1n2) / _2n2;
  return function tonelliSlow(Fp, n) {
    if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE))
      throw new Error("Cannot find square root");
    let r = S;
    let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q);
    let x = Fp.pow(n, Q1div2);
    let b = Fp.pow(n, Q);
    while (!Fp.eql(b, Fp.ONE)) {
      if (Fp.eql(b, Fp.ZERO))
        return Fp.ZERO;
      let m = 1;
      for (let t2 = Fp.sqr(b);m < r; m++) {
        if (Fp.eql(t2, Fp.ONE))
          break;
        t2 = Fp.sqr(t2);
      }
      const ge = Fp.pow(g, _1n2 << BigInt(r - m - 1));
      g = Fp.sqr(ge);
      x = Fp.mul(x, ge);
      b = Fp.mul(b, g);
      r = m;
    }
    return x;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n) {
    const p1div4 = (P + _1n2) / _4n;
    return function sqrt3mod4(Fp, n) {
      const root = Fp.pow(n, p1div4);
      if (!Fp.eql(Fp.sqr(root), n))
        throw new Error("Cannot find square root");
      return root;
    };
  }
  if (P % _8n === _5n) {
    const c1 = (P - _5n) / _8n;
    return function sqrt5mod8(Fp, n) {
      const n2 = Fp.mul(n, _2n2);
      const v = Fp.pow(n2, c1);
      const nv = Fp.mul(n, v);
      const i = Fp.mul(Fp.mul(nv, _2n2), v);
      const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
      if (!Fp.eql(Fp.sqr(root), n))
        throw new Error("Cannot find square root");
      return root;
    };
  }
  if (P % _16n === _9n) {
  }
  return tonelliShanks(P);
}
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    MASK: "bigint",
    BYTES: "isSafeInteger",
    BITS: "isSafeInteger"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  return validateObject(field, opts);
}
function FpPow(f, num, power) {
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return f.ONE;
  if (power === _1n2)
    return num;
  let p = f.ONE;
  let d = num;
  while (power > _0n2) {
    if (power & _1n2)
      p = f.mul(p, d);
    d = f.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(f, nums) {
  const tmp = new Array(nums.length);
  const lastMultiplied = nums.reduce((acc, num, i) => {
    if (f.is0(num))
      return acc;
    tmp[i] = acc;
    return f.mul(acc, num);
  }, f.ONE);
  const inverted = f.inv(lastMultiplied);
  nums.reduceRight((acc, num, i) => {
    if (f.is0(num))
      return acc;
    tmp[i] = f.mul(acc, tmp[i]);
    return f.mul(acc, num);
  }, inverted);
  return tmp;
}
function nLength(n, nBitLength) {
  const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, bitLen2, isLE = false, redef = {}) {
  if (ORDER <= _0n2)
    throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
  const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen2);
  if (BYTES > 2048)
    throw new Error("invalid field: expected ORDER of <= 2048 bytes");
  let sqrtP;
  const f = Object.freeze({
    ORDER,
    isLE,
    BITS,
    BYTES,
    MASK: bitMask(BITS),
    ZERO: _0n2,
    ONE: _1n2,
    create: (num) => mod(num, ORDER),
    isValid: (num) => {
      if (typeof num !== "bigint")
        throw new Error("invalid field element: expected bigint, got " + typeof num);
      return _0n2 <= num && num < ORDER;
    },
    is0: (num) => num === _0n2,
    isOdd: (num) => (num & _1n2) === _1n2,
    neg: (num) => mod(-num, ORDER),
    eql: (lhs, rhs) => lhs === rhs,
    sqr: (num) => mod(num * num, ORDER),
    add: (lhs, rhs) => mod(lhs + rhs, ORDER),
    sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
    mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
    pow: (num, power) => FpPow(f, num, power),
    div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
    sqrN: (num) => num * num,
    addN: (lhs, rhs) => lhs + rhs,
    subN: (lhs, rhs) => lhs - rhs,
    mulN: (lhs, rhs) => lhs * rhs,
    inv: (num) => invert(num, ORDER),
    sqrt: redef.sqrt || ((n) => {
      if (!sqrtP)
        sqrtP = FpSqrt(ORDER);
      return sqrtP(f, n);
    }),
    invertBatch: (lst) => FpInvertBatch(f, lst),
    cmov: (a, b, c) => c ? b : a,
    toBytes: (num) => isLE ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
    fromBytes: (bytes) => {
      if (bytes.length !== BYTES)
        throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
      return isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    }
  });
  return Object.freeze(f);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE = false) {
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num = isLE ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num, fieldOrder - _1n2) + _1n2;
  return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n2 = BigInt(0);
var _1n2 = BigInt(1);
var _2n2 = BigInt(2);
var _3n = BigInt(3);
var _4n = BigInt(4);
var _5n = BigInt(5);
var _8n = BigInt(8);
var _9n = BigInt(9);
var _16n = BigInt(16);
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];

// node_modules/trystero/node_modules/@noble/curves/esm/abstract/curve.js
var constTimeNegate = function(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
};
var validateW = function(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
};
var calcWOpts = function(W, bits) {
  validateW(W, bits);
  const windows = Math.ceil(bits / W) + 1;
  const windowSize = 2 ** (W - 1);
  return { windows, windowSize };
};
var validateMSMPoints = function(points, c) {
  if (!Array.isArray(points))
    throw new Error("array expected");
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error("invalid point at index " + i);
  });
};
var validateMSMScalars = function(scalars, field) {
  if (!Array.isArray(scalars))
    throw new Error("array of scalars expected");
  scalars.forEach((s, i) => {
    if (!field.isValid(s))
      throw new Error("invalid scalar at index " + i);
  });
};
var getW = function(P) {
  return pointWindowSizes.get(P) || 1;
};
function wNAF(c, bits) {
  return {
    constTimeNegate,
    hasPrecomputes(elm) {
      return getW(elm) !== 1;
    },
    unsafeLadder(elm, n, p = c.ZERO) {
      let d = elm;
      while (n > _0n3) {
        if (n & _1n3)
          p = p.add(d);
        d = d.double();
        n >>= _1n3;
      }
      return p;
    },
    precomputeWindow(elm, W) {
      const { windows, windowSize } = calcWOpts(W, bits);
      const points = [];
      let p = elm;
      let base = p;
      for (let window2 = 0;window2 < windows; window2++) {
        base = p;
        points.push(base);
        for (let i = 1;i < windowSize; i++) {
          base = base.add(p);
          points.push(base);
        }
        p = base.double();
      }
      return points;
    },
    wNAF(W, precomputes, n) {
      const { windows, windowSize } = calcWOpts(W, bits);
      let p = c.ZERO;
      let f = c.BASE;
      const mask = BigInt(2 ** W - 1);
      const maxNumber = 2 ** W;
      const shiftBy = BigInt(W);
      for (let window2 = 0;window2 < windows; window2++) {
        const offset = window2 * windowSize;
        let wbits = Number(n & mask);
        n >>= shiftBy;
        if (wbits > windowSize) {
          wbits -= maxNumber;
          n += _1n3;
        }
        const offset1 = offset;
        const offset2 = offset + Math.abs(wbits) - 1;
        const cond1 = window2 % 2 !== 0;
        const cond2 = wbits < 0;
        if (wbits === 0) {
          f = f.add(constTimeNegate(cond1, precomputes[offset1]));
        } else {
          p = p.add(constTimeNegate(cond2, precomputes[offset2]));
        }
      }
      return { p, f };
    },
    wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
      const { windows, windowSize } = calcWOpts(W, bits);
      const mask = BigInt(2 ** W - 1);
      const maxNumber = 2 ** W;
      const shiftBy = BigInt(W);
      for (let window2 = 0;window2 < windows; window2++) {
        const offset = window2 * windowSize;
        if (n === _0n3)
          break;
        let wbits = Number(n & mask);
        n >>= shiftBy;
        if (wbits > windowSize) {
          wbits -= maxNumber;
          n += _1n3;
        }
        if (wbits === 0)
          continue;
        let curr = precomputes[offset + Math.abs(wbits) - 1];
        if (wbits < 0)
          curr = curr.negate();
        acc = acc.add(curr);
      }
      return acc;
    },
    getPrecomputes(W, P, transform) {
      let comp = pointPrecomputes.get(P);
      if (!comp) {
        comp = this.precomputeWindow(P, W);
        if (W !== 1)
          pointPrecomputes.set(P, transform(comp));
      }
      return comp;
    },
    wNAFCached(P, n, transform) {
      const W = getW(P);
      return this.wNAF(W, this.getPrecomputes(W, P, transform), n);
    },
    wNAFCachedUnsafe(P, n, transform, prev) {
      const W = getW(P);
      if (W === 1)
        return this.unsafeLadder(P, n, prev);
      return this.wNAFUnsafe(W, this.getPrecomputes(W, P, transform), n, prev);
    },
    setWindowSize(P, W) {
      validateW(W, bits);
      pointWindowSizes.set(P, W);
      pointPrecomputes.delete(P);
    }
  };
}
function pippenger(c, fieldN, points, scalars) {
  validateMSMPoints(points, c);
  validateMSMScalars(scalars, fieldN);
  if (points.length !== scalars.length)
    throw new Error("arrays of points and scalars must have equal length");
  const zero2 = c.ZERO;
  const wbits = bitLen(BigInt(points.length));
  const windowSize = wbits > 12 ? wbits - 3 : wbits > 4 ? wbits - 2 : wbits ? 2 : 1;
  const MASK = (1 << windowSize) - 1;
  const buckets = new Array(MASK + 1).fill(zero2);
  const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
  let sum = zero2;
  for (let i = lastBits;i >= 0; i -= windowSize) {
    buckets.fill(zero2);
    for (let j = 0;j < scalars.length; j++) {
      const scalar = scalars[j];
      const wbits2 = Number(scalar >> BigInt(i) & BigInt(MASK));
      buckets[wbits2] = buckets[wbits2].add(points[j]);
    }
    let resI = zero2;
    for (let j = buckets.length - 1, sumI = zero2;j > 0; j--) {
      sumI = sumI.add(buckets[j]);
      resI = resI.add(sumI);
    }
    sum = sum.add(resI);
    if (i !== 0)
      for (let j = 0;j < windowSize; j++)
        sum = sum.double();
  }
  return sum;
}
function validateBasic(curve) {
  validateField(curve.Fp);
  validateObject(curve, {
    n: "bigint",
    h: "bigint",
    Gx: "field",
    Gy: "field"
  }, {
    nBitLength: "isSafeInteger",
    nByteLength: "isSafeInteger"
  });
  return Object.freeze({
    ...nLength(curve.n, curve.nBitLength),
    ...curve,
    ...{ p: curve.Fp.ORDER }
  });
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n3 = BigInt(0);
var _1n3 = BigInt(1);
var pointPrecomputes = new WeakMap;
var pointWindowSizes = new WeakMap;

// node_modules/trystero/node_modules/@noble/curves/esm/abstract/weierstrass.js
var validateSigVerOpts = function(opts) {
  if (opts.lowS !== undefined)
    abool("lowS", opts.lowS);
  if (opts.prehash !== undefined)
    abool("prehash", opts.prehash);
};
var validatePointOpts = function(curve2) {
  const opts = validateBasic(curve2);
  validateObject(opts, {
    a: "field",
    b: "field"
  }, {
    allowedPrivateKeyLengths: "array",
    wrapPrivateKey: "boolean",
    isTorsionFree: "function",
    clearCofactor: "function",
    allowInfinityPoint: "boolean",
    fromBytes: "function",
    toBytes: "function"
  });
  const { endo, Fp, a } = opts;
  if (endo) {
    if (!Fp.eql(a, Fp.ZERO)) {
      throw new Error("invalid endomorphism, can only be defined for Koblitz curves that have a=0");
    }
    if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
      throw new Error("invalid endomorphism, expected beta: bigint and splitScalar: function");
    }
  }
  return Object.freeze({ ...opts });
};
function weierstrassPoints(opts) {
  const CURVE = validatePointOpts(opts);
  const { Fp } = CURVE;
  const Fn = Field(CURVE.n, CURVE.nBitLength);
  const toBytes2 = CURVE.toBytes || ((_c, point, _isCompressed) => {
    const a = point.toAffine();
    return concatBytes2(Uint8Array.from([4]), Fp.toBytes(a.x), Fp.toBytes(a.y));
  });
  const fromBytes = CURVE.fromBytes || ((bytes) => {
    const tail = bytes.subarray(1);
    const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
    const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
    return { x, y };
  });
  function weierstrassEquation(x) {
    const { a, b } = CURVE;
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
  }
  if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx)))
    throw new Error("bad generator point: equation left != right");
  function isWithinCurveOrder(num) {
    return inRange(num, _1n4, CURVE.n);
  }
  function normPrivateKeyToScalar(key) {
    const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE;
    if (lengths && typeof key !== "bigint") {
      if (isBytes2(key))
        key = bytesToHex(key);
      if (typeof key !== "string" || !lengths.includes(key.length))
        throw new Error("invalid private key");
      key = key.padStart(nByteLength * 2, "0");
    }
    let num;
    try {
      num = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
    } catch (error) {
      throw new Error("invalid private key, expected hex or " + nByteLength + " bytes, got " + typeof key);
    }
    if (wrapPrivateKey)
      num = mod(num, N);
    aInRange("private key", num, _1n4, N);
    return num;
  }
  function assertPrjPoint(other) {
    if (!(other instanceof Point))
      throw new Error("ProjectivePoint expected");
  }
  const toAffineMemo = memoized((p, iz) => {
    const { px: x, py: y, pz: z } = p;
    if (Fp.eql(z, Fp.ONE))
      return { x, y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(z);
    const ax = Fp.mul(x, iz);
    const ay = Fp.mul(y, iz);
    const zz = Fp.mul(z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x: ax, y: ay };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (CURVE.allowInfinityPoint && !Fp.is0(p.py))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not FE");
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    if (!Fp.eql(left, right))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });

  class Point {
    constructor(px, py, pz) {
      this.px = px;
      this.py = py;
      this.pz = pz;
      if (px == null || !Fp.isValid(px))
        throw new Error("x required");
      if (py == null || !Fp.isValid(py))
        throw new Error("y required");
      if (pz == null || !Fp.isValid(pz))
        throw new Error("z required");
      Object.freeze(this);
    }
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point)
        throw new Error("projective point not allowed");
      const is0 = (i) => Fp.eql(i, Fp.ZERO);
      if (is0(x) && is0(y))
        return Point.ZERO;
      return new Point(x, y, Fp.ONE);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    static normalizeZ(points) {
      const toInv = Fp.invertBatch(points.map((p) => p.pz));
      return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
    }
    static fromHex(hex) {
      const P = Point.fromAffine(fromBytes(ensureBytes("pointHex", hex)));
      P.assertValidity();
      return P;
    }
    static fromPrivateKey(privateKey) {
      return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
    }
    static msm(points, scalars) {
      return pippenger(Point, Fn, points, scalars);
    }
    _setWindowSize(windowSize) {
      wnaf.setWindowSize(this, windowSize);
    }
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (Fp.isOdd)
        return !Fp.isOdd(y);
      throw new Error("Field doesn't support isOdd");
    }
    equals(other) {
      assertPrjPoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    negate() {
      return new Point(this.px, Fp.neg(this.py), this.pz);
    }
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { px: X1, py: Y1, pz: Z1 } = this;
      let { ZERO: X3, ZERO: Y3, ZERO: Z3 } = Fp;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point(X3, Y3, Z3);
    }
    add(other) {
      assertPrjPoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      let { ZERO: X3, ZERO: Y3, ZERO: Z3 } = Fp;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    wNAF(n) {
      return wnaf.wNAFCached(this, n, Point.normalizeZ);
    }
    multiplyUnsafe(sc) {
      const { endo, n: N } = CURVE;
      aInRange("scalar", sc, _0n4, N);
      const I = Point.ZERO;
      if (sc === _0n4)
        return I;
      if (this.is0() || sc === _1n4)
        return this;
      if (!endo || wnaf.hasPrecomputes(this))
        return wnaf.wNAFCachedUnsafe(this, sc, Point.normalizeZ);
      let { k1neg, k1, k2neg, k2 } = endo.splitScalar(sc);
      let k1p = I;
      let k2p = I;
      let d = this;
      while (k1 > _0n4 || k2 > _0n4) {
        if (k1 & _1n4)
          k1p = k1p.add(d);
        if (k2 & _1n4)
          k2p = k2p.add(d);
        d = d.double();
        k1 >>= _1n4;
        k2 >>= _1n4;
      }
      if (k1neg)
        k1p = k1p.negate();
      if (k2neg)
        k2p = k2p.negate();
      k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
      return k1p.add(k2p);
    }
    multiply(scalar) {
      const { endo, n: N } = CURVE;
      aInRange("scalar", scalar, _1n4, N);
      let point, fake;
      if (endo) {
        const { k1neg, k1, k2neg, k2 } = endo.splitScalar(scalar);
        let { p: k1p, f: f1p } = this.wNAF(k1);
        let { p: k2p, f: f2p } = this.wNAF(k2);
        k1p = wnaf.constTimeNegate(k1neg, k1p);
        k2p = wnaf.constTimeNegate(k2neg, k2p);
        k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
        point = k1p.add(k2p);
        fake = f1p.add(f2p);
      } else {
        const { p, f } = this.wNAF(scalar);
        point = p;
        fake = f;
      }
      return Point.normalizeZ([point, fake])[0];
    }
    multiplyAndAddUnsafe(Q, a, b) {
      const G = Point.BASE;
      const mul = (P, a2) => a2 === _0n4 || a2 === _1n4 || !P.equals(G) ? P.multiplyUnsafe(a2) : P.multiply(a2);
      const sum = mul(this, a).add(mul(Q, b));
      return sum.is0() ? undefined : sum;
    }
    toAffine(iz) {
      return toAffineMemo(this, iz);
    }
    isTorsionFree() {
      const { h: cofactor, isTorsionFree } = CURVE;
      if (cofactor === _1n4)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point, this);
      throw new Error("isTorsionFree() has not been declared for the elliptic curve");
    }
    clearCofactor() {
      const { h: cofactor, clearCofactor } = CURVE;
      if (cofactor === _1n4)
        return this;
      if (clearCofactor)
        return clearCofactor(Point, this);
      return this.multiplyUnsafe(CURVE.h);
    }
    toRawBytes(isCompressed = true) {
      abool("isCompressed", isCompressed);
      this.assertValidity();
      return toBytes2(Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      abool("isCompressed", isCompressed);
      return bytesToHex(this.toRawBytes(isCompressed));
    }
  }
  Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
  Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
  const _bits = CURVE.nBitLength;
  const wnaf = wNAF(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
  return {
    CURVE,
    ProjectivePoint: Point,
    normPrivateKeyToScalar,
    weierstrassEquation,
    isWithinCurveOrder
  };
}
var validateOpts = function(curve2) {
  const opts = validateBasic(curve2);
  validateObject(opts, {
    hash: "hash",
    hmac: "function",
    randomBytes: "function"
  }, {
    bits2int: "function",
    bits2int_modN: "function",
    lowS: "boolean"
  });
  return Object.freeze({ lowS: true, ...opts });
};
function weierstrass(curveDef) {
  const CURVE = validateOpts(curveDef);
  const { Fp, n: CURVE_ORDER } = CURVE;
  const compressedLen = Fp.BYTES + 1;
  const uncompressedLen = 2 * Fp.BYTES + 1;
  function modN(a) {
    return mod(a, CURVE_ORDER);
  }
  function invN(a) {
    return invert(a, CURVE_ORDER);
  }
  const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
    ...CURVE,
    toBytes(_c, point, isCompressed) {
      const a = point.toAffine();
      const x = Fp.toBytes(a.x);
      const cat = concatBytes2;
      abool("isCompressed", isCompressed);
      if (isCompressed) {
        return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
      } else {
        return cat(Uint8Array.from([4]), x, Fp.toBytes(a.y));
      }
    },
    fromBytes(bytes) {
      const len = bytes.length;
      const head = bytes[0];
      const tail = bytes.subarray(1);
      if (len === compressedLen && (head === 2 || head === 3)) {
        const x = bytesToNumberBE(tail);
        if (!inRange(x, _1n4, Fp.ORDER))
          throw new Error("Point is not on curve");
        const y2 = weierstrassEquation(x);
        let y;
        try {
          y = Fp.sqrt(y2);
        } catch (sqrtError) {
          const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
          throw new Error("Point is not on curve" + suffix);
        }
        const isYOdd = (y & _1n4) === _1n4;
        const isHeadOdd = (head & 1) === 1;
        if (isHeadOdd !== isYOdd)
          y = Fp.neg(y);
        return { x, y };
      } else if (len === uncompressedLen && head === 4) {
        const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
        const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
        return { x, y };
      } else {
        const cl = compressedLen;
        const ul = uncompressedLen;
        throw new Error("invalid Point, expected length of " + cl + ", or uncompressed " + ul + ", got " + len);
      }
    }
  });
  const numToNByteStr = (num) => bytesToHex(numberToBytesBE(num, CURVE.nByteLength));
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER >> _1n4;
    return number > HALF;
  }
  function normalizeS(s) {
    return isBiggerThanHalfOrder(s) ? modN(-s) : s;
  }
  const slcNum = (b, from, to) => bytesToNumberBE(b.slice(from, to));

  class Signature {
    constructor(r, s, recovery) {
      this.r = r;
      this.s = s;
      this.recovery = recovery;
      this.assertValidity();
    }
    static fromCompact(hex) {
      const l = CURVE.nByteLength;
      hex = ensureBytes("compactSignature", hex, l * 2);
      return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
    }
    static fromDER(hex) {
      const { r, s } = DER.toSig(ensureBytes("DER", hex));
      return new Signature(r, s);
    }
    assertValidity() {
      aInRange("r", this.r, _1n4, CURVE_ORDER);
      aInRange("s", this.s, _1n4, CURVE_ORDER);
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(msgHash) {
      const { r, s, recovery: rec } = this;
      const h = bits2int_modN(ensureBytes("msgHash", msgHash));
      if (rec == null || ![0, 1, 2, 3].includes(rec))
        throw new Error("recovery id invalid");
      const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
      if (radj >= Fp.ORDER)
        throw new Error("recovery id 2 or 3 invalid");
      const prefix = (rec & 1) === 0 ? "02" : "03";
      const R = Point.fromHex(prefix + numToNByteStr(radj));
      const ir = invN(radj);
      const u1 = modN(-h * ir);
      const u2 = modN(s * ir);
      const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
      if (!Q)
        throw new Error("point at infinify");
      Q.assertValidity();
      return Q;
    }
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    normalizeS() {
      return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
    }
    toDERRawBytes() {
      return hexToBytes(this.toDERHex());
    }
    toDERHex() {
      return DER.hexFromSig({ r: this.r, s: this.s });
    }
    toCompactRawBytes() {
      return hexToBytes(this.toCompactHex());
    }
    toCompactHex() {
      return numToNByteStr(this.r) + numToNByteStr(this.s);
    }
  }
  const utils7 = {
    isValidPrivateKey(privateKey) {
      try {
        normPrivateKeyToScalar(privateKey);
        return true;
      } catch (error) {
        return false;
      }
    },
    normPrivateKeyToScalar,
    randomPrivateKey: () => {
      const length = getMinHashLength(CURVE.n);
      return mapHashToField(CURVE.randomBytes(length), CURVE.n);
    },
    precompute(windowSize = 8, point = Point.BASE) {
      point._setWindowSize(windowSize);
      point.multiply(BigInt(3));
      return point;
    }
  };
  function getPublicKey(privateKey, isCompressed = true) {
    return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
  }
  function isProbPub(item) {
    const arr = isBytes2(item);
    const str = typeof item === "string";
    const len = (arr || str) && item.length;
    if (arr)
      return len === compressedLen || len === uncompressedLen;
    if (str)
      return len === 2 * compressedLen || len === 2 * uncompressedLen;
    if (item instanceof Point)
      return true;
    return false;
  }
  function getSharedSecret(privateA, publicB, isCompressed = true) {
    if (isProbPub(privateA))
      throw new Error("first arg must be private key");
    if (!isProbPub(publicB))
      throw new Error("second arg must be public key");
    const b = Point.fromHex(publicB);
    return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
  }
  const bits2int = CURVE.bits2int || function(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - CURVE.nBitLength;
    return delta > 0 ? num >> BigInt(delta) : num;
  };
  const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
    return modN(bits2int(bytes));
  };
  const ORDER_MASK = bitMask(CURVE.nBitLength);
  function int2octets(num) {
    aInRange("num < 2^" + CURVE.nBitLength, num, _0n4, ORDER_MASK);
    return numberToBytesBE(num, CURVE.nByteLength);
  }
  function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
    if (["recovered", "canonical"].some((k) => (k in opts)))
      throw new Error("sign() legacy options not supported");
    const { hash, randomBytes: randomBytes2 } = CURVE;
    let { lowS, prehash, extraEntropy: ent } = opts;
    if (lowS == null)
      lowS = true;
    msgHash = ensureBytes("msgHash", msgHash);
    validateSigVerOpts(opts);
    if (prehash)
      msgHash = ensureBytes("prehashed msgHash", hash(msgHash));
    const h1int = bits2int_modN(msgHash);
    const d = normPrivateKeyToScalar(privateKey);
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (ent != null && ent !== false) {
      const e = ent === true ? randomBytes2(Fp.BYTES) : ent;
      seedArgs.push(ensureBytes("extraEntropy", e));
    }
    const seed = concatBytes2(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!isWithinCurveOrder(k))
        return;
      const ik = invN(k);
      const q = Point.BASE.multiply(k).toAffine();
      const r = modN(q.x);
      if (r === _0n4)
        return;
      const s = modN(ik * modN(m + r * d));
      if (s === _0n4)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = normalizeS(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, recovery);
    }
    return { seed, k2sig };
  }
  const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
  const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
  function sign(msgHash, privKey, opts = defaultSigOpts) {
    const { seed, k2sig } = prepSig(msgHash, privKey, opts);
    const C = CURVE;
    const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
    return drbg(seed, k2sig);
  }
  Point.BASE._setWindowSize(8);
  function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
    const sg = signature;
    msgHash = ensureBytes("msgHash", msgHash);
    publicKey = ensureBytes("publicKey", publicKey);
    const { lowS, prehash, format } = opts;
    validateSigVerOpts(opts);
    if ("strict" in opts)
      throw new Error("options.strict was renamed to lowS");
    if (format !== undefined && format !== "compact" && format !== "der")
      throw new Error("format must be compact or der");
    const isHex = typeof sg === "string" || isBytes2(sg);
    const isObj = !isHex && !format && typeof sg === "object" && sg !== null && typeof sg.r === "bigint" && typeof sg.s === "bigint";
    if (!isHex && !isObj)
      throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
    let _sig = undefined;
    let P;
    try {
      if (isObj)
        _sig = new Signature(sg.r, sg.s);
      if (isHex) {
        try {
          if (format !== "compact")
            _sig = Signature.fromDER(sg);
        } catch (derError) {
          if (!(derError instanceof DER.Err))
            throw derError;
        }
        if (!_sig && format !== "der")
          _sig = Signature.fromCompact(sg);
      }
      P = Point.fromHex(publicKey);
    } catch (error) {
      return false;
    }
    if (!_sig)
      return false;
    if (lowS && _sig.hasHighS())
      return false;
    if (prehash)
      msgHash = CURVE.hash(msgHash);
    const { r, s } = _sig;
    const h = bits2int_modN(msgHash);
    const is = invN(s);
    const u1 = modN(h * is);
    const u2 = modN(r * is);
    const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
    if (!R)
      return false;
    const v = modN(R.x);
    return v === r;
  }
  return {
    CURVE,
    getPublicKey,
    getSharedSecret,
    sign,
    verify,
    ProjectivePoint: Point,
    Signature,
    utils: utils7
  };
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var { bytesToNumberBE: b2n, hexToBytes: h2b } = exports_utils;

class DERErr extends Error {
  constructor(m = "") {
    super(m);
  }
}
var DER = {
  Err: DERErr,
  _tlv: {
    encode: (tag, data) => {
      const { Err: E } = DER;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      const t = numberToHexUnpadded(tag);
      return t + lenLen + len + data;
    },
    decode(tag, data) {
      const { Err: E } = DER;
      let pos = 0;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length < 2 || data[pos++] !== tag)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos++];
      const isLong = !!(first & 128);
      let length = 0;
      if (!isLong)
        length = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos, pos + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length = length << 8 | b;
        pos += lenLen;
        if (length < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos, pos + length);
      if (v.length !== length)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos + length) };
    }
  },
  _int: {
    encode(num) {
      const { Err: E } = DER;
      if (num < _0n4)
        throw new E("integer: negative integers are not allowed");
      let hex = numberToHexUnpadded(num);
      if (Number.parseInt(hex[0], 16) & 8)
        hex = "00" + hex;
      if (hex.length & 1)
        throw new E("unexpected DER parsing assertion: unpadded hex");
      return hex;
    },
    decode(data) {
      const { Err: E } = DER;
      if (data[0] & 128)
        throw new E("invalid signature integer: negative");
      if (data[0] === 0 && !(data[1] & 128))
        throw new E("invalid signature integer: unnecessary leading zero");
      return b2n(data);
    }
  },
  toSig(hex) {
    const { Err: E, _int: int4, _tlv: tlv } = DER;
    const data = typeof hex === "string" ? h2b(hex) : hex;
    abytes2(data);
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    return { r: int4.decode(rBytes), s: int4.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int4 } = DER;
    const rs = tlv.encode(2, int4.encode(sig.r));
    const ss = tlv.encode(2, int4.encode(sig.s));
    const seq = rs + ss;
    return tlv.encode(48, seq);
  }
};
var _0n4 = BigInt(0);
var _1n4 = BigInt(1);
var _2n3 = BigInt(2);
var _3n2 = BigInt(3);
var _4n2 = BigInt(4);

// node_modules/trystero/node_modules/@noble/curves/esm/_shortw_utils.js
function getHash(hash) {
  return {
    hash,
    hmac: (key, ...msgs) => hmac(hash, key, concatBytes(...msgs)),
    randomBytes
  };
}
function createCurve(curveDef, defHash) {
  const create = (hash) => weierstrass({ ...curveDef, ...getHash(hash) });
  return { ...create(defHash), create };
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */

// node_modules/trystero/node_modules/@noble/curves/esm/secp256k1.js
var sqrtMod = function(y) {
  const P = secp256k1P;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n3, P) * b3 % P;
  const b9 = pow2(b6, _3n3, P) * b3 % P;
  const b11 = pow2(b9, _2n4, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n3, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n4, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
};
var taggedHash = function(tag, ...messages2) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === undefined) {
    const tagH = sha256(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
    tagP = concatBytes2(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes2(tagP, ...messages2));
};
var schnorrGetExtPubKey = function(priv) {
  let d_ = secp256k1.utils.normPrivateKeyToScalar(priv);
  let p = Point.fromPrivateKey(d_);
  const scalar = p.hasEvenY() ? d_ : modN(-d_);
  return { scalar, bytes: pointToBytes(p) };
};
var lift_x = function(x) {
  aInRange("x", x, _1n5, secp256k1P);
  const xx = modP(x * x);
  const c = modP(xx * x + BigInt(7));
  let y = sqrtMod(c);
  if (y % _2n4 !== _0n5)
    y = modP(-y);
  const p = new Point(x, y, _1n5);
  p.assertValidity();
  return p;
};
var challenge = function(...args) {
  return modN(num(taggedHash("BIP0340/challenge", ...args)));
};
var schnorrGetPublicKey = function(privateKey) {
  return schnorrGetExtPubKey(privateKey).bytes;
};
var schnorrSign = function(message, privateKey, auxRand = randomBytes(32)) {
  const m = ensureBytes("message", message);
  const { bytes: px, scalar: d } = schnorrGetExtPubKey(privateKey);
  const a = ensureBytes("auxRand", auxRand, 32);
  const t = numTo32b(d ^ num(taggedHash("BIP0340/aux", a)));
  const rand = taggedHash("BIP0340/nonce", t, px, m);
  const k_ = modN(num(rand));
  if (k_ === _0n5)
    throw new Error("sign failed: k is zero");
  const { bytes: rx, scalar: k } = schnorrGetExtPubKey(k_);
  const e = challenge(rx, px, m);
  const sig = new Uint8Array(64);
  sig.set(rx, 0);
  sig.set(numTo32b(modN(k + e * d)), 32);
  if (!schnorrVerify(sig, m, px))
    throw new Error("sign: Invalid signature produced");
  return sig;
};
var schnorrVerify = function(signature, message, publicKey) {
  const sig = ensureBytes("signature", signature, 64);
  const m = ensureBytes("message", message);
  const pub = ensureBytes("publicKey", publicKey, 32);
  try {
    const P = lift_x(num(pub));
    const r = num(sig.subarray(0, 32));
    if (!inRange(r, _1n5, secp256k1P))
      return false;
    const s = num(sig.subarray(32, 64));
    if (!inRange(s, _1n5, secp256k1N))
      return false;
    const e = challenge(numTo32b(r), pointToBytes(P), m);
    const R = GmulAdd(P, s, modN(-e));
    if (!R || !R.hasEvenY() || R.toAffine().x !== r)
      return false;
    return true;
  } catch (error) {
    return false;
  }
};
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
var secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
var _1n5 = BigInt(1);
var _2n4 = BigInt(2);
var divNearest = (a, b) => (a + b / _2n4) / b;
var Fpk1 = Field(secp256k1P, undefined, undefined, { sqrt: sqrtMod });
var secp256k1 = createCurve({
  a: BigInt(0),
  b: BigInt(7),
  Fp: Fpk1,
  n: secp256k1N,
  Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
  Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
  h: BigInt(1),
  lowS: true,
  endo: {
    beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
    splitScalar: (k) => {
      const n = secp256k1N;
      const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
      const b1 = -_1n5 * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
      const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
      const b2 = a1;
      const POW_2_128 = BigInt("0x100000000000000000000000000000000");
      const c1 = divNearest(b2 * k, n);
      const c2 = divNearest(-b1 * k, n);
      let k1 = mod(k - c1 * a1 - c2 * a2, n);
      let k2 = mod(-c1 * b1 - c2 * b2, n);
      const k1neg = k1 > POW_2_128;
      const k2neg = k2 > POW_2_128;
      if (k1neg)
        k1 = n - k1;
      if (k2neg)
        k2 = n - k2;
      if (k1 > POW_2_128 || k2 > POW_2_128) {
        throw new Error("splitScalar: Endomorphism failed, k=" + k);
      }
      return { k1neg, k1, k2neg, k2 };
    }
  }
}, sha256);
var _0n5 = BigInt(0);
var TAGGED_HASH_PREFIXES = {};
var pointToBytes = (point) => point.toRawBytes(true).slice(1);
var numTo32b = (n) => numberToBytesBE(n, 32);
var modP = (x) => mod(x, secp256k1P);
var modN = (x) => mod(x, secp256k1N);
var Point = secp256k1.ProjectivePoint;
var GmulAdd = (Q, a, b) => Point.BASE.multiplyAndAddUnsafe(Q, a, b);
var num = bytesToNumberBE;
var schnorr = (() => ({
  getPublicKey: schnorrGetPublicKey,
  sign: schnorrSign,
  verify: schnorrVerify,
  utils: {
    randomPrivateKey: secp256k1.utils.randomPrivateKey,
    lift_x,
    pointToBytes,
    numberToBytesBE,
    bytesToNumberBE,
    taggedHash,
    mod
  }
}))();

// node_modules/trystero/src/utils.js
var { floor, random, sin } = Math;
var libName = "Trystero";
var alloc = (n, f) => Array(n).fill().map(f);
var charSet = "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
var genId = (n) => alloc(n, () => charSet[floor(random() * charSet.length)]).join("");
var selfId = genId(20);
var all = Promise.all.bind(Promise);
var isBrowser = typeof window !== "undefined";
var { entries, fromEntries, keys } = Object;
var noOp = () => {
};
var mkErr = (msg) => new Error(`${libName}: ${msg}`);
var encoder = new TextEncoder;
var decoder = new TextDecoder;
var encodeBytes = (txt) => encoder.encode(txt);
var decodeBytes = (buffer) => decoder.decode(buffer);
var toHex = (buffer) => buffer.reduce((a, c) => a + c.toString(16).padStart(2, "0"), "");
var topicPath = (...parts) => parts.join("@");
var shuffle = (xs, seed) => {
  const a = [...xs];
  const rand = () => {
    const x = sin(seed++) * 1e4;
    return x - floor(x);
  };
  let i = a.length;
  while (i) {
    const j = floor(rand() * i--);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
var getRelays = (config, defaults, defaultN, deriveFromAppId) => {
  const relayUrls = config.relayUrls || (deriveFromAppId ? shuffle(defaults, strToNum(config.appId)) : defaults);
  return relayUrls.slice(0, config.relayUrls ? config.relayUrls.length : config.relayRedundancy || defaultN);
};
var toJson = JSON.stringify;
var fromJson = JSON.parse;
var strToNum = (str, limit = Number.MAX_SAFE_INTEGER) => str.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % limit;
var defaultRetryMs = 3333;
var socketRetryPeriods = {};
var makeSocket = (url, onMessage) => {
  const client = {};
  const init = () => {
    const socket = new WebSocket(url);
    socket.onclose = () => {
      socketRetryPeriods[url] ??= defaultRetryMs;
      setTimeout(init, socketRetryPeriods[url]);
      socketRetryPeriods[url] *= 2;
    };
    socket.onmessage = (e) => onMessage(e.data);
    client.socket = socket;
    client.url = socket.url;
    client.ready = new Promise((res) => socket.onopen = () => {
      res(client);
      socketRetryPeriods[url] = defaultRetryMs;
    });
    client.send = (data) => {
      if (socket.readyState === 1) {
        socket.send(data);
      }
    };
  };
  init();
  return client;
};
var socketGetter = (clientMap) => () => fromEntries(entries(clientMap).map(([url, client]) => [url, client.socket]));

// node_modules/trystero/src/crypto.js
var algo = "AES-GCM";
var strToSha1 = {};
var pack = (buff) => btoa(String.fromCharCode.apply(null, new Uint8Array(buff)));
var unpack = (packed) => {
  const str = atob(packed);
  return new Uint8Array(str.length).map((_, i) => str.charCodeAt(i)).buffer;
};
var sha1 = async (str) => {
  if (strToSha1[str]) {
    return strToSha1[str];
  }
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", encodeBytes(str)))).map((b) => b.toString(36)).join("");
  strToSha1[str] = hash;
  return hash;
};
var genKey = async (secret, appId, roomId) => crypto.subtle.importKey("raw", await crypto.subtle.digest({ name: "SHA-256" }, encodeBytes(`${secret}:${appId}:${roomId}`)), { name: algo }, false, ["encrypt", "decrypt"]);
var joinChar = "$";
var ivJoinChar = ",";
var encrypt = async (keyP, plaintext) => {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  return iv.join(ivJoinChar) + joinChar + pack(await crypto.subtle.encrypt({ name: algo, iv }, await keyP, encodeBytes(plaintext)));
};
var decrypt = async (keyP, raw) => {
  const [iv, c] = raw.split(joinChar);
  return decodeBytes(await crypto.subtle.decrypt({ name: algo, iv: new Uint8Array(iv.split(ivJoinChar)) }, await keyP, unpack(c)));
};

// node_modules/@thaunknown/simple-peer/lite.js
var import_debug = __toESM(require_browser(), 1);

// node_modules/webrtc-polyfill/browser.js
var scope = typeof window !== "undefined" ? window : self;
var RTCPeerConnection = scope.RTCPeerConnection || scope.mozRTCPeerConnection || scope.webkitRTCPeerConnection;
var RTCSessionDescription = scope.RTCSessionDescription || scope.mozRTCSessionDescription || scope.webkitRTCSessionDescription;
var RTCIceCandidate = scope.RTCIceCandidate || scope.mozRTCIceCandidate || scope.webkitRTCIceCandidate;
var RTCIceTransport = scope.RTCIceTransport;
var RTCDataChannel = scope.RTCDataChannel;
var RTCSctpTransport = scope.RTCSctpTransport;
var RTCDtlsTransport = scope.RTCDtlsTransport;
var RTCCertificate = scope.RTCCertificate;
var MediaStream = scope.MediaStream;
var MediaStreamTrack = scope.MediaStreamTrack;
var MediaStreamTrackEvent = scope.MediaStreamTrackEvent;
var RTCPeerConnectionIceEvent = scope.RTCPeerConnectionIceEvent;
var RTCDataChannelEvent = scope.RTCDataChannelEvent;
var RTCTrackEvent = scope.RTCTrackEvent;
var RTCError = scope.RTCError;
var RTCErrorEvent = scope.RTCErrorEvent;
var RTCRtpTransceiver = scope.RTCRtpTransceiver;
var RTCRtpReceiver = scope.RTCRtpReceiver;
var RTCRtpSender = scope.RTCRtpSender;

// node_modules/@thaunknown/simple-peer/lite.js
var import_streamx = __toESM(require_streamx(), 1);
var import_err_code = __toESM(require_err_code(), 1);

// node_modules/uint8-util/util.js
var alphabet = "0123456789abcdef";
var encodeLookup = [];
var decodeLookup = [];
for (let i = 0;i < 256; i++) {
  encodeLookup[i] = alphabet[i >> 4 & 15] + alphabet[i & 15];
  if (i < 16) {
    if (i < 10) {
      decodeLookup[48 + i] = i;
    } else {
      decodeLookup[97 - 10 + i] = i;
    }
  }
}
var arr2hex = (data) => {
  const length = data.length;
  let string = "";
  let i = 0;
  while (i < length) {
    string += encodeLookup[data[i++]];
  }
  return string;
};

// node_modules/base64-arraybuffer/dist/base64-arraybuffer.es5.js
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
for (i = 0;i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}
var i;

// node_modules/uint8-util/browser.js
var decoder2 = new TextDecoder;
var encoder2 = new TextEncoder;
var text2arr = (str) => encoder2.encode(str);
var scope2 = typeof window !== "undefined" ? window : self;
var crypto4 = scope2.crypto || scope2.msCrypto || {};
var subtle = crypto4.subtle || crypto4.webkitSubtle;
var randomBytes2 = (size) => {
  const view = new Uint8Array(size);
  return crypto4.getRandomValues(view);
};

// node_modules/@thaunknown/simple-peer/lite.js
var filterTrickle = function(sdp) {
  return sdp.replace(/a=ice-options:trickle\s\n/g, "");
};
var warn = function(message) {
  console.warn(message);
};
/*! simple-peer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
var Debug = import_debug.default("simple-peer");
var MAX_BUFFERED_AMOUNT = 64 * 1024;
var ICECOMPLETE_TIMEOUT = 5 * 1000;
var CHANNEL_CLOSING_TIMEOUT = 5 * 1000;

class Peer extends import_streamx.Duplex {
  _pc;
  constructor(opts) {
    opts = Object.assign({
      allowHalfOpen: false
    }, opts);
    super(opts);
    this.__objectMode = !!opts.objectMode;
    this._id = arr2hex(randomBytes2(4)).slice(0, 7);
    this._debug("new peer %o", opts);
    this.channelName = opts.initiator ? opts.channelName || arr2hex(randomBytes2(20)) : null;
    this.initiator = opts.initiator || false;
    this.channelConfig = opts.channelConfig || Peer.channelConfig;
    this.channelNegotiated = this.channelConfig.negotiated;
    this.config = Object.assign({}, Peer.config, opts.config);
    this.offerOptions = opts.offerOptions || {};
    this.answerOptions = opts.answerOptions || {};
    this.sdpTransform = opts.sdpTransform || ((sdp) => sdp);
    this.trickle = opts.trickle !== undefined ? opts.trickle : true;
    this.allowHalfTrickle = opts.allowHalfTrickle !== undefined ? opts.allowHalfTrickle : false;
    this.iceCompleteTimeout = opts.iceCompleteTimeout || ICECOMPLETE_TIMEOUT;
    this._destroying = false;
    this._connected = false;
    this.remoteAddress = undefined;
    this.remoteFamily = undefined;
    this.remotePort = undefined;
    this.localAddress = undefined;
    this.localFamily = undefined;
    this.localPort = undefined;
    if (!RTCPeerConnection) {
      if (typeof window === "undefined") {
        throw import_err_code.default(new Error("No WebRTC support: Specify `opts.wrtc` option in this environment"), "ERR_WEBRTC_SUPPORT");
      } else {
        throw import_err_code.default(new Error("No WebRTC support: Not a supported browser"), "ERR_WEBRTC_SUPPORT");
      }
    }
    this._pcReady = false;
    this._channelReady = false;
    this._iceComplete = false;
    this._iceCompleteTimer = null;
    this._channel = null;
    this._pendingCandidates = [];
    this._isNegotiating = false;
    this._firstNegotiation = true;
    this._batchedNegotiation = false;
    this._queuedNegotiation = false;
    this._sendersAwaitingStable = [];
    this._closingInterval = null;
    this._remoteTracks = [];
    this._remoteStreams = [];
    this._chunk = null;
    this._cb = null;
    this._interval = null;
    try {
      this._pc = new RTCPeerConnection(this.config);
    } catch (err2) {
      this.__destroy(import_err_code.default(err2, "ERR_PC_CONSTRUCTOR"));
      return;
    }
    this._isReactNativeWebrtc = typeof this._pc._peerConnectionId === "number";
    this._pc.oniceconnectionstatechange = () => {
      this._onIceStateChange();
    };
    this._pc.onicegatheringstatechange = () => {
      this._onIceStateChange();
    };
    this._pc.onconnectionstatechange = () => {
      this._onConnectionStateChange();
    };
    this._pc.onsignalingstatechange = () => {
      this._onSignalingStateChange();
    };
    this._pc.onicecandidate = (event) => {
      this._onIceCandidate(event);
    };
    if (typeof this._pc.peerIdentity === "object") {
      this._pc.peerIdentity.catch((err2) => {
        this.__destroy(import_err_code.default(err2, "ERR_PC_PEER_IDENTITY"));
      });
    }
    if (this.initiator || this.channelNegotiated) {
      this._setupData({
        channel: this._pc.createDataChannel(this.channelName, this.channelConfig)
      });
    } else {
      this._pc.ondatachannel = (event) => {
        this._setupData(event);
      };
    }
    this._debug("initial negotiation");
    this._needsNegotiation();
    this._onFinishBound = () => {
      this._onFinish();
    };
    this.once("finish", this._onFinishBound);
  }
  get bufferSize() {
    return this._channel && this._channel.bufferedAmount || 0;
  }
  get connected() {
    return this._connected && this._channel.readyState === "open";
  }
  address() {
    return { port: this.localPort, family: this.localFamily, address: this.localAddress };
  }
  signal(data) {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code.default(new Error("cannot signal after peer is destroyed"), "ERR_DESTROYED");
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err2) {
        data = {};
      }
    }
    this._debug("signal()");
    if (data.renegotiate && this.initiator) {
      this._debug("got request to renegotiate");
      this._needsNegotiation();
    }
    if (data.transceiverRequest && this.initiator) {
      this._debug("got request for transceiver");
      this.addTransceiver(data.transceiverRequest.kind, data.transceiverRequest.init);
    }
    if (data.candidate) {
      if (this._pc.remoteDescription && this._pc.remoteDescription.type) {
        this._addIceCandidate(data.candidate);
      } else {
        this._pendingCandidates.push(data.candidate);
      }
    }
    if (data.sdp) {
      this._pc.setRemoteDescription(new RTCSessionDescription(data)).then(() => {
        if (this.destroyed)
          return;
        this._pendingCandidates.forEach((candidate) => {
          this._addIceCandidate(candidate);
        });
        this._pendingCandidates = [];
        if (this._pc.remoteDescription.type === "offer")
          this._createAnswer();
      }).catch((err2) => {
        this.__destroy(import_err_code.default(err2, "ERR_SET_REMOTE_DESCRIPTION"));
      });
    }
    if (!data.sdp && !data.candidate && !data.renegotiate && !data.transceiverRequest) {
      this.__destroy(import_err_code.default(new Error("signal() called with invalid signal data"), "ERR_SIGNALING"));
    }
  }
  _addIceCandidate(candidate) {
    const iceCandidateObj = new RTCIceCandidate(candidate);
    this._pc.addIceCandidate(iceCandidateObj).catch((err2) => {
      if (!iceCandidateObj.address || iceCandidateObj.address.endsWith(".local")) {
        warn("Ignoring unsupported ICE candidate.");
      } else {
        this.__destroy(import_err_code.default(err2, "ERR_ADD_ICE_CANDIDATE"));
      }
    });
  }
  send(chunk) {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code.default(new Error("cannot send after peer is destroyed"), "ERR_DESTROYED");
    this._channel.send(chunk);
  }
  _needsNegotiation() {
    this._debug("_needsNegotiation");
    if (this._batchedNegotiation)
      return;
    this._batchedNegotiation = true;
    queueMicrotask(() => {
      this._batchedNegotiation = false;
      if (this.initiator || !this._firstNegotiation) {
        this._debug("starting batched negotiation");
        this.negotiate();
      } else {
        this._debug("non-initiator initial negotiation request discarded");
      }
      this._firstNegotiation = false;
    });
  }
  negotiate() {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code.default(new Error("cannot negotiate after peer is destroyed"), "ERR_DESTROYED");
    if (this.initiator) {
      if (this._isNegotiating) {
        this._queuedNegotiation = true;
        this._debug("already negotiating, queueing");
      } else {
        this._debug("start negotiation");
        setTimeout(() => {
          this._createOffer();
        }, 0);
      }
    } else {
      if (this._isNegotiating) {
        this._queuedNegotiation = true;
        this._debug("already negotiating, queueing");
      } else {
        this._debug("requesting negotiation from initiator");
        this.emit("signal", {
          type: "renegotiate",
          renegotiate: true
        });
      }
    }
    this._isNegotiating = true;
  }
  _final(cb) {
    if (!this._readableState.ended)
      this.push(null);
    cb(null);
  }
  __destroy(err2) {
    this.end();
    this._destroy(() => {
    }, err2);
  }
  _destroy(cb, err2) {
    if (this.destroyed || this._destroying)
      return;
    this._destroying = true;
    this._debug("destroying (error: %s)", err2 && (err2.message || err2));
    setTimeout(() => {
      this._connected = false;
      this._pcReady = false;
      this._channelReady = false;
      this._remoteTracks = null;
      this._remoteStreams = null;
      this._senderMap = null;
      clearInterval(this._closingInterval);
      this._closingInterval = null;
      clearInterval(this._interval);
      this._interval = null;
      this._chunk = null;
      this._cb = null;
      if (this._onFinishBound)
        this.removeListener("finish", this._onFinishBound);
      this._onFinishBound = null;
      if (this._channel) {
        try {
          this._channel.close();
        } catch (err3) {
        }
        this._channel.onmessage = null;
        this._channel.onopen = null;
        this._channel.onclose = null;
        this._channel.onerror = null;
      }
      if (this._pc) {
        try {
          this._pc.close();
        } catch (err3) {
        }
        this._pc.oniceconnectionstatechange = null;
        this._pc.onicegatheringstatechange = null;
        this._pc.onsignalingstatechange = null;
        this._pc.onicecandidate = null;
        this._pc.ontrack = null;
        this._pc.ondatachannel = null;
      }
      this._pc = null;
      this._channel = null;
      if (err2)
        this.emit("error", err2);
      cb();
    }, 0);
  }
  _setupData(event) {
    if (!event.channel) {
      return this.__destroy(import_err_code.default(new Error("Data channel event is missing `channel` property"), "ERR_DATA_CHANNEL"));
    }
    this._channel = event.channel;
    this._channel.binaryType = "arraybuffer";
    if (typeof this._channel.bufferedAmountLowThreshold === "number") {
      this._channel.bufferedAmountLowThreshold = MAX_BUFFERED_AMOUNT;
    }
    this.channelName = this._channel.label;
    this._channel.onmessage = (event2) => {
      this._onChannelMessage(event2);
    };
    this._channel.onbufferedamountlow = () => {
      this._onChannelBufferedAmountLow();
    };
    this._channel.onopen = () => {
      this._onChannelOpen();
    };
    this._channel.onclose = () => {
      this._onChannelClose();
    };
    this._channel.onerror = (event2) => {
      const err2 = event2.error instanceof Error ? event2.error : new Error(`Datachannel error: ${event2.message} ${event2.filename}:${event2.lineno}:${event2.colno}`);
      this.__destroy(import_err_code.default(err2, "ERR_DATA_CHANNEL"));
    };
    let isClosing = false;
    this._closingInterval = setInterval(() => {
      if (this._channel && this._channel.readyState === "closing") {
        if (isClosing)
          this._onChannelClose();
        isClosing = true;
      } else {
        isClosing = false;
      }
    }, CHANNEL_CLOSING_TIMEOUT);
  }
  _write(chunk, cb) {
    if (this.destroyed)
      return cb(import_err_code.default(new Error("cannot write after peer is destroyed"), "ERR_DATA_CHANNEL"));
    if (this._connected) {
      try {
        this.send(chunk);
      } catch (err2) {
        return this.__destroy(import_err_code.default(err2, "ERR_DATA_CHANNEL"));
      }
      if (this._channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
        this._debug("start backpressure: bufferedAmount %d", this._channel.bufferedAmount);
        this._cb = cb;
      } else {
        cb(null);
      }
    } else {
      this._debug("write before connect");
      this._chunk = chunk;
      this._cb = cb;
    }
  }
  _onFinish() {
    if (this.destroyed)
      return;
    const destroySoon = () => {
      setTimeout(() => this.__destroy(), 1000);
    };
    if (this._connected) {
      destroySoon();
    } else {
      this.once("connect", destroySoon);
    }
  }
  _startIceCompleteTimeout() {
    if (this.destroyed)
      return;
    if (this._iceCompleteTimer)
      return;
    this._debug("started iceComplete timeout");
    this._iceCompleteTimer = setTimeout(() => {
      if (!this._iceComplete) {
        this._iceComplete = true;
        this._debug("iceComplete timeout completed");
        this.emit("iceTimeout");
        this.emit("_iceComplete");
      }
    }, this.iceCompleteTimeout);
  }
  _createOffer() {
    if (this.destroyed)
      return;
    this._pc.createOffer(this.offerOptions).then((offer) => {
      if (this.destroyed)
        return;
      if (!this.trickle && !this.allowHalfTrickle)
        offer.sdp = filterTrickle(offer.sdp);
      offer.sdp = this.sdpTransform(offer.sdp);
      const sendOffer = () => {
        if (this.destroyed)
          return;
        const signal = this._pc.localDescription || offer;
        this._debug("signal");
        this.emit("signal", {
          type: signal.type,
          sdp: signal.sdp
        });
      };
      const onSuccess = () => {
        this._debug("createOffer success");
        if (this.destroyed)
          return;
        if (this.trickle || this._iceComplete)
          sendOffer();
        else
          this.once("_iceComplete", sendOffer);
      };
      const onError = (err2) => {
        this.__destroy(import_err_code.default(err2, "ERR_SET_LOCAL_DESCRIPTION"));
      };
      this._pc.setLocalDescription(offer).then(onSuccess).catch(onError);
    }).catch((err2) => {
      this.__destroy(import_err_code.default(err2, "ERR_CREATE_OFFER"));
    });
  }
  _createAnswer() {
    if (this.destroyed)
      return;
    this._pc.createAnswer(this.answerOptions).then((answer) => {
      if (this.destroyed)
        return;
      if (!this.trickle && !this.allowHalfTrickle)
        answer.sdp = filterTrickle(answer.sdp);
      answer.sdp = this.sdpTransform(answer.sdp);
      const sendAnswer = () => {
        if (this.destroyed)
          return;
        const signal = this._pc.localDescription || answer;
        this._debug("signal");
        this.emit("signal", {
          type: signal.type,
          sdp: signal.sdp
        });
        if (!this.initiator)
          this._requestMissingTransceivers?.();
      };
      const onSuccess = () => {
        if (this.destroyed)
          return;
        if (this.trickle || this._iceComplete)
          sendAnswer();
        else
          this.once("_iceComplete", sendAnswer);
      };
      const onError = (err2) => {
        this.__destroy(import_err_code.default(err2, "ERR_SET_LOCAL_DESCRIPTION"));
      };
      this._pc.setLocalDescription(answer).then(onSuccess).catch(onError);
    }).catch((err2) => {
      this.__destroy(import_err_code.default(err2, "ERR_CREATE_ANSWER"));
    });
  }
  _onConnectionStateChange() {
    if (this.destroyed || this._destroying)
      return;
    if (this._pc.connectionState === "failed") {
      this.__destroy(import_err_code.default(new Error("Connection failed."), "ERR_CONNECTION_FAILURE"));
    }
  }
  _onIceStateChange() {
    if (this.destroyed)
      return;
    const iceConnectionState = this._pc.iceConnectionState;
    const iceGatheringState = this._pc.iceGatheringState;
    this._debug("iceStateChange (connection: %s) (gathering: %s)", iceConnectionState, iceGatheringState);
    this.emit("iceStateChange", iceConnectionState, iceGatheringState);
    if (iceConnectionState === "connected" || iceConnectionState === "completed") {
      this._pcReady = true;
      this._maybeReady();
    }
    if (iceConnectionState === "failed") {
      this.__destroy(import_err_code.default(new Error("Ice connection failed."), "ERR_ICE_CONNECTION_FAILURE"));
    }
    if (iceConnectionState === "closed") {
      this.__destroy(import_err_code.default(new Error("Ice connection closed."), "ERR_ICE_CONNECTION_CLOSED"));
    }
  }
  getStats(cb) {
    const flattenValues = (report) => {
      if (Object.prototype.toString.call(report.values) === "[object Array]") {
        report.values.forEach((value) => {
          Object.assign(report, value);
        });
      }
      return report;
    };
    if (this._pc.getStats.length === 0 || this._isReactNativeWebrtc) {
      this._pc.getStats().then((res) => {
        const reports = [];
        res.forEach((report) => {
          reports.push(flattenValues(report));
        });
        cb(null, reports);
      }, (err2) => cb(err2));
    } else if (this._pc.getStats.length > 0) {
      this._pc.getStats((res) => {
        if (this.destroyed)
          return;
        const reports = [];
        res.result().forEach((result) => {
          const report = {};
          result.names().forEach((name) => {
            report[name] = result.stat(name);
          });
          report.id = result.id;
          report.type = result.type;
          report.timestamp = result.timestamp;
          reports.push(flattenValues(report));
        });
        cb(null, reports);
      }, (err2) => cb(err2));
    } else {
      cb(null, []);
    }
  }
  _maybeReady() {
    this._debug("maybeReady pc %s channel %s", this._pcReady, this._channelReady);
    if (this._connected || this._connecting || !this._pcReady || !this._channelReady)
      return;
    this._connecting = true;
    const findCandidatePair = () => {
      if (this.destroyed || this._destroying)
        return;
      this.getStats((err2, items) => {
        if (this.destroyed || this._destroying)
          return;
        if (err2)
          items = [];
        const remoteCandidates = {};
        const localCandidates = {};
        const candidatePairs = {};
        let foundSelectedCandidatePair = false;
        items.forEach((item) => {
          if (item.type === "remotecandidate" || item.type === "remote-candidate") {
            remoteCandidates[item.id] = item;
          }
          if (item.type === "localcandidate" || item.type === "local-candidate") {
            localCandidates[item.id] = item;
          }
          if (item.type === "candidatepair" || item.type === "candidate-pair") {
            candidatePairs[item.id] = item;
          }
        });
        const setSelectedCandidatePair = (selectedCandidatePair) => {
          foundSelectedCandidatePair = true;
          let local = localCandidates[selectedCandidatePair.localCandidateId];
          if (local && (local.ip || local.address)) {
            this.localAddress = local.ip || local.address;
            this.localPort = Number(local.port);
          } else if (local && local.ipAddress) {
            this.localAddress = local.ipAddress;
            this.localPort = Number(local.portNumber);
          } else if (typeof selectedCandidatePair.googLocalAddress === "string") {
            local = selectedCandidatePair.googLocalAddress.split(":");
            this.localAddress = local[0];
            this.localPort = Number(local[1]);
          }
          if (this.localAddress) {
            this.localFamily = this.localAddress.includes(":") ? "IPv6" : "IPv4";
          }
          let remote = remoteCandidates[selectedCandidatePair.remoteCandidateId];
          if (remote && (remote.ip || remote.address)) {
            this.remoteAddress = remote.ip || remote.address;
            this.remotePort = Number(remote.port);
          } else if (remote && remote.ipAddress) {
            this.remoteAddress = remote.ipAddress;
            this.remotePort = Number(remote.portNumber);
          } else if (typeof selectedCandidatePair.googRemoteAddress === "string") {
            remote = selectedCandidatePair.googRemoteAddress.split(":");
            this.remoteAddress = remote[0];
            this.remotePort = Number(remote[1]);
          }
          if (this.remoteAddress) {
            this.remoteFamily = this.remoteAddress.includes(":") ? "IPv6" : "IPv4";
          }
          this._debug("connect local: %s:%s remote: %s:%s", this.localAddress, this.localPort, this.remoteAddress, this.remotePort);
        };
        items.forEach((item) => {
          if (item.type === "transport" && item.selectedCandidatePairId) {
            setSelectedCandidatePair(candidatePairs[item.selectedCandidatePairId]);
          }
          if (item.type === "googCandidatePair" && item.googActiveConnection === "true" || (item.type === "candidatepair" || item.type === "candidate-pair") && item.selected) {
            setSelectedCandidatePair(item);
          }
        });
        if (!foundSelectedCandidatePair && (!Object.keys(candidatePairs).length || Object.keys(localCandidates).length)) {
          setTimeout(findCandidatePair, 100);
          return;
        } else {
          this._connecting = false;
          this._connected = true;
        }
        if (this._chunk) {
          try {
            this.send(this._chunk);
          } catch (err3) {
            return this.__destroy(import_err_code.default(err3, "ERR_DATA_CHANNEL"));
          }
          this._chunk = null;
          this._debug('sent chunk from "write before connect"');
          const cb = this._cb;
          this._cb = null;
          cb(null);
        }
        if (typeof this._channel.bufferedAmountLowThreshold !== "number") {
          this._interval = setInterval(() => this._onInterval(), 150);
          if (this._interval.unref)
            this._interval.unref();
        }
        this._debug("connect");
        this.emit("connect");
      });
    };
    findCandidatePair();
  }
  _onInterval() {
    if (!this._cb || !this._channel || this._channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      return;
    }
    this._onChannelBufferedAmountLow();
  }
  _onSignalingStateChange() {
    if (this.destroyed)
      return;
    if (this._pc.signalingState === "stable") {
      this._isNegotiating = false;
      this._debug("flushing sender queue", this._sendersAwaitingStable);
      this._sendersAwaitingStable.forEach((sender) => {
        this._pc.removeTrack(sender);
        this._queuedNegotiation = true;
      });
      this._sendersAwaitingStable = [];
      if (this._queuedNegotiation) {
        this._debug("flushing negotiation queue");
        this._queuedNegotiation = false;
        this._needsNegotiation();
      } else {
        this._debug("negotiated");
        this.emit("negotiated");
      }
    }
    this._debug("signalingStateChange %s", this._pc.signalingState);
    this.emit("signalingStateChange", this._pc.signalingState);
  }
  _onIceCandidate(event) {
    if (this.destroyed)
      return;
    if (event.candidate && this.trickle) {
      this.emit("signal", {
        type: "candidate",
        candidate: {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        }
      });
    } else if (!event.candidate && !this._iceComplete) {
      this._iceComplete = true;
      this.emit("_iceComplete");
    }
    if (event.candidate) {
      this._startIceCompleteTimeout();
    }
  }
  _onChannelMessage(event) {
    if (this.destroyed)
      return;
    let data = event.data;
    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data);
    } else if (this.__objectMode === false) {
      data = text2arr(data);
    }
    this.push(data);
  }
  _onChannelBufferedAmountLow() {
    if (this.destroyed || !this._cb)
      return;
    this._debug("ending backpressure: bufferedAmount %d", this._channel.bufferedAmount);
    const cb = this._cb;
    this._cb = null;
    cb(null);
  }
  _onChannelOpen() {
    if (this._connected || this.destroyed)
      return;
    this._debug("on channel open");
    this._channelReady = true;
    this._maybeReady();
  }
  _onChannelClose() {
    if (this.destroyed)
      return;
    this._debug("on channel close");
    this.__destroy();
  }
  _debug() {
    const args = [].slice.call(arguments);
    args[0] = "[" + this._id + "] " + args[0];
    Debug.apply(null, args);
  }
}
Peer.WEBRTC_SUPPORT = !!RTCPeerConnection;
Peer.config = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:global.stun.twilio.com:3478"
      ]
    }
  ],
  sdpSemantics: "unified-plan"
};
Peer.channelConfig = {};
var lite_default = Peer;

// node_modules/@thaunknown/simple-peer/index.js
var import_err_code2 = __toESM(require_err_code(), 1);
/*! simple-peer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

class Peer2 extends lite_default {
  constructor(opts = {}) {
    super(opts);
    if (!this._pc)
      return;
    this.streams = opts.streams || (opts.stream ? [opts.stream] : []);
    this._senderMap = new Map;
    if (this.streams) {
      this.streams.forEach((stream) => {
        this.addStream(stream);
      });
    }
    this._pc.ontrack = (event) => {
      this._onTrack(event);
    };
  }
  addTransceiver(kind, init) {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code2.default(new Error("cannot addTransceiver after peer is destroyed"), "ERR_DESTROYED");
    this._debug("addTransceiver()");
    if (this.initiator) {
      try {
        this._pc.addTransceiver(kind, init);
        this._needsNegotiation();
      } catch (err2) {
        this.__destroy(import_err_code2.default(err2, "ERR_ADD_TRANSCEIVER"));
      }
    } else {
      this.emit("signal", {
        type: "transceiverRequest",
        transceiverRequest: { kind, init }
      });
    }
  }
  addStream(stream) {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code2.default(new Error("cannot addStream after peer is destroyed"), "ERR_DESTROYED");
    this._debug("addStream()");
    stream.getTracks().forEach((track) => {
      this.addTrack(track, stream);
    });
  }
  addTrack(track, stream) {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code2.default(new Error("cannot addTrack after peer is destroyed"), "ERR_DESTROYED");
    this._debug("addTrack()");
    const submap = this._senderMap.get(track) || new Map;
    let sender = submap.get(stream);
    if (!sender) {
      sender = this._pc.addTrack(track, stream);
      submap.set(stream, sender);
      this._senderMap.set(track, submap);
      this._needsNegotiation();
    } else if (sender.removed) {
      throw import_err_code2.default(new Error("Track has been removed. You should enable/disable tracks that you want to re-add."), "ERR_SENDER_REMOVED");
    } else {
      throw import_err_code2.default(new Error("Track has already been added to that stream."), "ERR_SENDER_ALREADY_ADDED");
    }
  }
  replaceTrack(oldTrack, newTrack, stream) {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code2.default(new Error("cannot replaceTrack after peer is destroyed"), "ERR_DESTROYED");
    this._debug("replaceTrack()");
    const submap = this._senderMap.get(oldTrack);
    const sender = submap ? submap.get(stream) : null;
    if (!sender) {
      throw import_err_code2.default(new Error("Cannot replace track that was never added."), "ERR_TRACK_NOT_ADDED");
    }
    if (newTrack)
      this._senderMap.set(newTrack, submap);
    if (sender.replaceTrack != null) {
      sender.replaceTrack(newTrack);
    } else {
      this.__destroy(import_err_code2.default(new Error("replaceTrack is not supported in this browser"), "ERR_UNSUPPORTED_REPLACETRACK"));
    }
  }
  removeTrack(track, stream) {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code2.default(new Error("cannot removeTrack after peer is destroyed"), "ERR_DESTROYED");
    this._debug("removeSender()");
    const submap = this._senderMap.get(track);
    const sender = submap ? submap.get(stream) : null;
    if (!sender) {
      throw import_err_code2.default(new Error("Cannot remove track that was never added."), "ERR_TRACK_NOT_ADDED");
    }
    try {
      sender.removed = true;
      this._pc.removeTrack(sender);
    } catch (err2) {
      if (err2.name === "NS_ERROR_UNEXPECTED") {
        this._sendersAwaitingStable.push(sender);
      } else {
        this.__destroy(import_err_code2.default(err2, "ERR_REMOVE_TRACK"));
      }
    }
    this._needsNegotiation();
  }
  removeStream(stream) {
    if (this._destroying)
      return;
    if (this.destroyed)
      throw import_err_code2.default(new Error("cannot removeStream after peer is destroyed"), "ERR_DESTROYED");
    this._debug("removeSenders()");
    stream.getTracks().forEach((track) => {
      this.removeTrack(track, stream);
    });
  }
  _requestMissingTransceivers() {
    if (this._pc.getTransceivers) {
      this._pc.getTransceivers().forEach((transceiver) => {
        if (!transceiver.mid && transceiver.sender.track && !transceiver.requested) {
          transceiver.requested = true;
          this.addTransceiver(transceiver.sender.track.kind);
        }
      });
    }
  }
  _onTrack(event) {
    if (this.destroyed)
      return;
    event.streams.forEach((eventStream) => {
      this._debug("on track");
      this.emit("track", event.track, eventStream);
      this._remoteTracks.push({
        track: event.track,
        stream: eventStream
      });
      if (this._remoteStreams.some((remoteStream) => {
        return remoteStream.id === eventStream.id;
      }))
        return;
      this._remoteStreams.push(eventStream);
      queueMicrotask(() => {
        this._debug("on stream");
        this.emit("stream", eventStream);
      });
    });
  }
}
var simple_peer_default = Peer2;

// node_modules/trystero/src/peer.js
var dataEvent = "data";
var signalEvent = "signal";
var peer_default = (initiator, config) => {
  const peer = new simple_peer_default({
    ...{ iceServers: [{ urls: defaultIceServers }] },
    ...config,
    initiator,
    trickle: false
  });
  const onData = (d2) => earlyDataBuffer.push(d2);
  let earlyDataBuffer = [];
  peer.on(dataEvent, onData);
  return {
    id: peer._id,
    created: Date.now(),
    connection: peer._pc,
    get channel() {
      return peer._channel;
    },
    get isDead() {
      return peer.destroyed;
    },
    signal: (sdp) => new Promise((res) => {
      if (!initiator) {
        peer.on(signalEvent, res);
      }
      peer.signal(sdp);
    }),
    sendData: (data) => peer.send(data),
    destroy: () => peer.destroy(),
    setHandlers: (handlers) => Object.entries(handlers).forEach(([event, fn]) => peer.on(event, fn)),
    offerPromise: initiator ? new Promise((res) => peer.on(signalEvent, res)) : Promise.resolve(),
    addStream: (stream) => peer.addStream(stream),
    removeStream: (stream) => peer.removeStream(stream),
    addTrack: (track, stream) => peer.addTrack(track, stream),
    removeTrack: (track, stream) => peer.removeTrack(track, stream),
    replaceTrack: (oldTrack, newTrack, stream) => peer.replaceTrack(oldTrack, newTrack, stream),
    drainEarlyData: (f) => {
      peer.off(dataEvent, onData);
      earlyDataBuffer.forEach(f);
      earlyDataBuffer = null;
    }
  };
};
var defaultIceServers = [
  ...alloc(5, (_2, i) => `stun:stun${i || ""}.l.google.com:19302`),
  "stun:global.stun.twilio.com:3478"
];

// node_modules/trystero/src/room.js
var TypedArray = Object.getPrototypeOf(Uint8Array);
var typeByteLimit = 12;
var typeIndex = 0;
var nonceIndex = typeIndex + typeByteLimit;
var tagIndex = nonceIndex + 1;
var progressIndex = tagIndex + 1;
var payloadIndex = progressIndex + 1;
var chunkSize = 16 * 2 ** 10 - payloadIndex;
var oneByteMax = 255;
var buffLowEvent = "bufferedamountlow";
var internalNs = (ns) => "@_" + ns;
var room_default = (onPeer, onPeerLeave, onSelfLeave) => {
  const peerMap = {};
  const actions = {};
  const actionsCache = {};
  const pendingTransmissions = {};
  const pendingPongs = {};
  const pendingStreamMetas = {};
  const pendingTrackMetas = {};
  const listeners = {
    onPeerJoin: noOp,
    onPeerLeave: noOp,
    onPeerStream: noOp,
    onPeerTrack: noOp
  };
  const iterate = (targets, f) => (targets ? Array.isArray(targets) ? targets : [targets] : keys(peerMap)).flatMap((id) => {
    const peer = peerMap[id];
    if (!peer) {
      console.warn(`${libName}: no peer with id ${id} found`);
      return [];
    }
    return f(id, peer);
  });
  const exitPeer = (id) => {
    if (!peerMap[id]) {
      return;
    }
    delete peerMap[id];
    delete pendingTransmissions[id];
    delete pendingPongs[id];
    listeners.onPeerLeave(id);
    onPeerLeave(id);
  };
  const makeAction = (type) => {
    if (actions[type]) {
      return actionsCache[type];
    }
    if (!type) {
      throw mkErr("action type argument is required");
    }
    const typeBytes = encodeBytes(type);
    if (typeBytes.byteLength > typeByteLimit) {
      throw mkErr(`action type string "${type}" (${typeBytes.byteLength}b) exceeds ` + `byte limit (${typeByteLimit}). Hint: choose a shorter name.`);
    }
    const typeBytesPadded = new Uint8Array(typeByteLimit);
    typeBytesPadded.set(typeBytes);
    let nonce = 0;
    actions[type] = {
      onComplete: noOp,
      onProgress: noOp,
      setOnComplete: (f) => actions[type] = { ...actions[type], onComplete: f },
      setOnProgress: (f) => actions[type] = { ...actions[type], onProgress: f },
      send: async (data, targets, meta, onProgress) => {
        if (meta && typeof meta !== "object") {
          throw mkErr("action meta argument must be an object");
        }
        const dataType = typeof data;
        if (dataType === "undefined") {
          throw mkErr("action data cannot be undefined");
        }
        const isJson = dataType !== "string";
        const isBlob = data instanceof Blob;
        const isBinary = isBlob || data instanceof ArrayBuffer || data instanceof TypedArray;
        if (meta && !isBinary) {
          throw mkErr("action meta argument can only be used with binary data");
        }
        const buffer = isBinary ? new Uint8Array(isBlob ? await data.arrayBuffer() : data) : encodeBytes(isJson ? toJson(data) : data);
        const metaEncoded = meta ? encodeBytes(toJson(meta)) : null;
        const chunkTotal = Math.ceil(buffer.byteLength / chunkSize) + (meta ? 1 : 0) || 1;
        const chunks = alloc(chunkTotal, (_2, i) => {
          const isLast = i === chunkTotal - 1;
          const isMeta = meta && i === 0;
          const chunk = new Uint8Array(payloadIndex + (isMeta ? metaEncoded.byteLength : isLast ? buffer.byteLength - chunkSize * (chunkTotal - (meta ? 2 : 1)) : chunkSize));
          chunk.set(typeBytesPadded);
          chunk.set([nonce], nonceIndex);
          chunk.set([isLast | isMeta << 1 | isBinary << 2 | isJson << 3], tagIndex);
          chunk.set([Math.round((i + 1) / chunkTotal * oneByteMax)], progressIndex);
          chunk.set(meta ? isMeta ? metaEncoded : buffer.subarray((i - 1) * chunkSize, i * chunkSize) : buffer.subarray(i * chunkSize, (i + 1) * chunkSize), payloadIndex);
          return chunk;
        });
        nonce = nonce + 1 & oneByteMax;
        return all(iterate(targets, async (id, peer) => {
          const { channel } = peer;
          let chunkN = 0;
          while (chunkN < chunkTotal) {
            const chunk = chunks[chunkN];
            if (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
              await new Promise((res) => {
                const next = () => {
                  channel.removeEventListener(buffLowEvent, next);
                  res();
                };
                channel.addEventListener(buffLowEvent, next);
              });
            }
            if (!peerMap[id]) {
              break;
            }
            peer.sendData(chunk);
            chunkN++;
            onProgress?.(chunk[progressIndex] / oneByteMax, id, meta);
          }
        }));
      }
    };
    return actionsCache[type] ||= [
      actions[type].send,
      actions[type].setOnComplete,
      actions[type].setOnProgress
    ];
  };
  const handleData = (id, data) => {
    const buffer = new Uint8Array(data);
    const type = decodeBytes(buffer.subarray(typeIndex, nonceIndex)).replaceAll("\0", "");
    const [nonce] = buffer.subarray(nonceIndex, tagIndex);
    const [tag] = buffer.subarray(tagIndex, progressIndex);
    const [progress] = buffer.subarray(progressIndex, payloadIndex);
    const payload = buffer.subarray(payloadIndex);
    const isLast = !!(tag & 1);
    const isMeta = !!(tag & 1 << 1);
    const isBinary = !!(tag & 1 << 2);
    const isJson = !!(tag & 1 << 3);
    if (!actions[type]) {
      console.warn(`${libName}: received message with unregistered type (${type})`);
      return;
    }
    pendingTransmissions[id] ||= {};
    pendingTransmissions[id][type] ||= {};
    const target = pendingTransmissions[id][type][nonce] ||= { chunks: [] };
    if (isMeta) {
      target.meta = fromJson(decodeBytes(payload));
    } else {
      target.chunks.push(payload);
    }
    actions[type].onProgress(progress / oneByteMax, id, target.meta);
    if (!isLast) {
      return;
    }
    const full = new Uint8Array(target.chunks.reduce((a2, c) => a2 + c.byteLength, 0));
    target.chunks.reduce((a2, c) => {
      full.set(c, a2);
      return a2 + c.byteLength;
    }, 0);
    delete pendingTransmissions[id][type][nonce];
    if (isBinary) {
      actions[type].onComplete(full, id, target.meta);
    } else {
      const text = decodeBytes(full);
      actions[type].onComplete(isJson ? fromJson(text) : text, id);
    }
  };
  const leave = async () => {
    await sendLeave("");
    await new Promise((res) => setTimeout(res, 99));
    entries(peerMap).forEach(([id, peer]) => {
      peer.destroy();
      delete peerMap[id];
    });
    onSelfLeave();
  };
  const [sendPing, getPing] = makeAction(internalNs("ping"));
  const [sendPong, getPong] = makeAction(internalNs("pong"));
  const [sendSignal, getSignal] = makeAction(internalNs("signal"));
  const [sendStreamMeta, getStreamMeta] = makeAction(internalNs("stream"));
  const [sendTrackMeta, getTrackMeta] = makeAction(internalNs("track"));
  const [sendLeave, getLeave] = makeAction(internalNs("leave"));
  onPeer((peer, id) => {
    if (peerMap[id]) {
      return;
    }
    peerMap[id] = peer;
    peer.setHandlers({
      data: (d2) => handleData(id, d2),
      stream: (stream) => {
        listeners.onPeerStream(stream, id, pendingStreamMetas[id]);
        delete pendingStreamMetas[id];
      },
      track: (track, stream) => {
        listeners.onPeerTrack(track, stream, id, pendingTrackMetas[id]);
        delete pendingTrackMetas[id];
      },
      signal: (sdp) => sendSignal(sdp, id),
      close: () => exitPeer(id),
      error: () => exitPeer(id)
    });
    listeners.onPeerJoin(id);
    peer.drainEarlyData?.((d2) => handleData(id, d2));
  });
  getPing((_2, id) => sendPong("", id));
  getPong((_2, id) => {
    pendingPongs[id]?.();
    delete pendingPongs[id];
  });
  getSignal((sdp, id) => peerMap[id]?.signal(sdp));
  getStreamMeta((meta, id) => pendingStreamMetas[id] = meta);
  getTrackMeta((meta, id) => pendingTrackMetas[id] = meta);
  getLeave((_2, id) => exitPeer(id));
  if (isBrowser) {
    addEventListener("beforeunload", leave);
  }
  return {
    makeAction,
    leave,
    ping: async (id) => {
      if (!id) {
        throw mkErr("ping() must be called with target peer ID");
      }
      const start = Date.now();
      sendPing("", id);
      await new Promise((res) => pendingPongs[id] = res);
      return Date.now() - start;
    },
    getPeers: () => fromEntries(entries(peerMap).map(([id, peer]) => [id, peer.connection])),
    addStream: (stream, targets, meta) => iterate(targets, async (id, peer) => {
      if (meta) {
        await sendStreamMeta(meta, id);
      }
      peer.addStream(stream);
    }),
    removeStream: (stream, targets) => iterate(targets, (_2, peer) => peer.removeStream(stream)),
    addTrack: (track, stream, targets, meta) => iterate(targets, async (id, peer) => {
      if (meta) {
        await sendTrackMeta(meta, id);
      }
      peer.addTrack(track, stream);
    }),
    removeTrack: (track, stream, targets) => iterate(targets, (_2, peer) => peer.removeTrack(track, stream)),
    replaceTrack: (oldTrack, newTrack, stream, targets, meta) => iterate(targets, async (id, peer) => {
      if (meta) {
        await sendTrackMeta(meta, id);
      }
      peer.replaceTrack(oldTrack, newTrack, stream);
    }),
    onPeerJoin: (f) => listeners.onPeerJoin = f,
    onPeerLeave: (f) => listeners.onPeerLeave = f,
    onPeerStream: (f) => listeners.onPeerStream = f,
    onPeerTrack: (f) => listeners.onPeerTrack = f
  };
};

// node_modules/trystero/src/strategy.js
var poolSize = 20;
var announceIntervalMs = 5333;
var offerTtl = 57333;
var strategy_default = ({ init, subscribe, announce }) => {
  const occupiedRooms = {};
  let didInit = false;
  let initPromises;
  let offerPool;
  let offerCleanupTimer;
  return (config, roomId, onJoinError) => {
    const { appId } = config;
    if (occupiedRooms[appId]?.[roomId]) {
      return occupiedRooms[appId][roomId];
    }
    const pendingOffers = {};
    const connectedPeers = {};
    const rootTopicPlaintext = topicPath(libName, appId, roomId);
    const rootTopicP = sha1(rootTopicPlaintext);
    const selfTopicP = sha1(topicPath(rootTopicPlaintext, selfId));
    const key = genKey(config.password || "", appId, roomId);
    const withKey = (f) => async (signal) => ({
      type: signal.type,
      sdp: await f(key, signal.sdp)
    });
    const toPlain = withKey(decrypt);
    const toCipher = withKey(encrypt);
    const makeOffer = () => peer_default(true, config.rtcConfig);
    const connectPeer = (peer2, peerId, clientId) => {
      if (connectedPeers[peerId]) {
        if (connectedPeers[peerId] !== peer2) {
          peer2.destroy();
        }
        return;
      }
      connectedPeers[peerId] = peer2;
      onPeerConnect(peer2, peerId);
      pendingOffers[peerId]?.forEach((peer3, i) => {
        if (i !== clientId) {
          peer3.destroy();
        }
      });
      delete pendingOffers[peerId];
    };
    const disconnectPeer = (peer2, peerId) => {
      if (connectedPeers[peerId] === peer2) {
        delete connectedPeers[peerId];
      }
    };
    const prunePendingOffer = (peerId, clientId) => {
      if (connectedPeers[peerId]) {
        return;
      }
      const offer = pendingOffers[peerId]?.[clientId];
      if (offer) {
        delete pendingOffers[peerId][clientId];
        offer.destroy();
      }
    };
    const getOffers = (n) => {
      offerPool.push(...alloc(n, makeOffer));
      return all(offerPool.splice(0, n).map((peer2) => peer2.offerPromise.then(toCipher).then((offer) => ({ peer: peer2, offer }))));
    };
    const handleJoinError = (peerId, sdpType) => onJoinError?.({
      error: `incorrect password (${config.password}) when decrypting ${sdpType}`,
      appId,
      peerId,
      roomId
    });
    const handleMessage = (clientId) => async (topic, msg, signalPeer) => {
      const [rootTopic, selfTopic] = await all([rootTopicP, selfTopicP]);
      if (topic !== rootTopic && topic !== selfTopic) {
        return;
      }
      const { peerId, offer, answer, peer: peer2 } = typeof msg === "string" ? fromJson(msg) : msg;
      if (peerId === selfId || connectedPeers[peerId]) {
        return;
      }
      if (peerId && !offer && !answer) {
        if (pendingOffers[peerId]?.[clientId]) {
          return;
        }
        const [[{ peer: peer3, offer: offer2 }], topic2] = await all([
          getOffers(1),
          sha1(topicPath(rootTopicPlaintext, peerId))
        ]);
        pendingOffers[peerId] ||= [];
        pendingOffers[peerId][clientId] = peer3;
        setTimeout(() => prunePendingOffer(peerId, clientId), announceIntervals[clientId] * 0.9);
        peer3.setHandlers({
          connect: () => connectPeer(peer3, peerId, clientId),
          close: () => disconnectPeer(peer3, peerId)
        });
        signalPeer(topic2, toJson({ peerId: selfId, offer: offer2 }));
      } else if (offer) {
        const myOffer = pendingOffers[peerId]?.[clientId];
        if (myOffer && selfId > peerId) {
          return;
        }
        const peer3 = peer_default(false, config.rtcConfig);
        peer3.setHandlers({
          connect: () => connectPeer(peer3, peerId, clientId),
          close: () => disconnectPeer(peer3, peerId)
        });
        let plainOffer;
        try {
          plainOffer = await toPlain(offer);
        } catch {
          handleJoinError(peerId, "offer");
          return;
        }
        if (peer3.isDead) {
          return;
        }
        const [topic2, answer2] = await all([
          sha1(topicPath(rootTopicPlaintext, peerId)),
          peer3.signal(plainOffer)
        ]);
        signalPeer(topic2, toJson({ peerId: selfId, answer: await toCipher(answer2) }));
      } else if (answer) {
        let plainAnswer;
        try {
          plainAnswer = await toPlain(answer);
        } catch (e) {
          handleJoinError(peerId, "answer");
          return;
        }
        if (peer2) {
          peer2.setHandlers({
            connect: () => connectPeer(peer2, peerId, clientId),
            close: () => disconnectPeer(peer2, peerId)
          });
          peer2.signal(plainAnswer);
        } else {
          const peer3 = pendingOffers[peerId]?.[clientId];
          if (peer3 && !peer3.isDead) {
            peer3.signal(plainAnswer);
          }
        }
      }
    };
    if (!config) {
      throw mkErr("requires a config map as the first argument");
    }
    if (!appId && !config.firebaseApp) {
      throw mkErr("config map is missing appId field");
    }
    if (!roomId) {
      throw mkErr("roomId argument required");
    }
    if (!didInit) {
      const initRes = init(config);
      offerPool = alloc(poolSize, makeOffer);
      initPromises = Array.isArray(initRes) ? initRes : [initRes];
      didInit = true;
      offerCleanupTimer = setInterval(() => offerPool = offerPool.filter((peer2) => {
        const shouldLive = Date.now() - peer2.created < offerTtl;
        if (!shouldLive) {
          peer2.destroy();
        }
        return shouldLive;
      }), offerTtl * 1.03);
    }
    const announceIntervals = initPromises.map(() => announceIntervalMs);
    const announceTimeouts = [];
    const unsubFns = initPromises.map(async (clientP, i) => subscribe(await clientP, await rootTopicP, await selfTopicP, handleMessage(i), getOffers));
    all([rootTopicP, selfTopicP]).then(([rootTopic, selfTopic]) => {
      const queueAnnounce = async (client, i) => {
        const ms = await announce(client, rootTopic, selfTopic);
        if (typeof ms === "number") {
          announceIntervals[i] = ms;
        }
        announceTimeouts[i] = setTimeout(() => queueAnnounce(client, i), announceIntervals[i]);
      };
      unsubFns.forEach(async (didSub, i) => {
        await didSub;
        queueAnnounce(await initPromises[i], i);
      });
    });
    let onPeerConnect = noOp;
    occupiedRooms[appId] ||= {};
    return occupiedRooms[appId][roomId] = room_default((f) => onPeerConnect = f, (id) => delete connectedPeers[id], () => {
      delete occupiedRooms[appId][roomId];
      announceTimeouts.forEach(clearTimeout);
      unsubFns.forEach(async (f) => (await f)());
      clearInterval(offerCleanupTimer);
    });
  };
};

// node_modules/trystero/src/nostr.js
var clients = {};
var defaultRedundancy = 5;
var tag = "x";
var eventMsgType = "EVENT";
var privateKey = isBrowser && schnorr.utils.randomPrivateKey();
var publicKey = isBrowser && toHex(schnorr.getPublicKey(privateKey));
var subIdToTopic = {};
var msgHandlers = {};
var kindCache = {};
var now = () => Math.floor(Date.now() / 1000);
var topicToKind = (topic) => kindCache[topic] ?? (kindCache[topic] = strToNum(topic, 1e4) + 20000);
var createEvent = async (topic, content) => {
  const payload = {
    kind: topicToKind(topic),
    content,
    pubkey: publicKey,
    created_at: now(),
    tags: [[tag, topic]]
  };
  const id = toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encodeBytes(toJson([
    0,
    payload.pubkey,
    payload.created_at,
    payload.kind,
    payload.tags,
    payload.content
  ])))));
  return toJson([
    eventMsgType,
    {
      ...payload,
      id,
      sig: toHex(await schnorr.sign(id, privateKey))
    }
  ]);
};
var subscribe = (subId, topic) => {
  subIdToTopic[subId] = topic;
  return toJson([
    "REQ",
    subId,
    {
      kinds: [topicToKind(topic)],
      since: now(),
      ["#" + tag]: [topic]
    }
  ]);
};
var unsubscribe = (subId) => {
  delete subIdToTopic[subId];
  return toJson(["CLOSE", subId]);
};
var joinRoom = strategy_default({
  init: (config) => getRelays(config, defaultRelayUrls, defaultRedundancy, true).map((url) => {
    const client = makeSocket(url, (data) => {
      const [msgType, subId, payload, relayMsg] = fromJson(data);
      if (msgType !== eventMsgType) {
        const prefix = `${libName}: relay failure from ${client.url} - `;
        if (msgType === "NOTICE") {
          console.warn(prefix + subId);
        } else if (msgType === "OK" && !payload) {
          console.warn(prefix + relayMsg);
        }
        return;
      }
      msgHandlers[subId]?.(subIdToTopic[subId], payload.content);
    });
    clients[url] = client;
    return client.ready;
  }),
  subscribe: (client, rootTopic, selfTopic, onMessage) => {
    const rootSubId = genId(64);
    const selfSubId = genId(64);
    msgHandlers[rootSubId] = msgHandlers[selfSubId] = (topic, data) => onMessage(topic, data, async (peerTopic, signal) => client.send(await createEvent(peerTopic, signal)));
    client.send(subscribe(rootSubId, rootTopic));
    client.send(subscribe(selfSubId, selfTopic));
    return () => {
      client.send(unsubscribe(rootSubId));
      client.send(unsubscribe(selfSubId));
      delete msgHandlers[rootSubId];
      delete msgHandlers[selfSubId];
    };
  },
  announce: async (client, rootTopic) => client.send(await createEvent(rootTopic, toJson({ peerId: selfId })))
});
var getRelaySockets = socketGetter(clients);
var defaultRelayUrls = [
  "eu.purplerelay.com",
  "ftp.halifax.rwth-aachen.de/nostr",
  "longhorn.bgp.rodeo",
  "multiplexer.huszonegy.world",
  "nfdb.noswhere.com",
  "nostr-verified.wellorder.net",
  "nostr.cool110.xyz",
  "nostr.data.haus",
  "nostr.grooveix.com",
  "nostr.huszonegy.world",
  "nostr.mom",
  "nostr.openhoofd.nl",
  "nostr.petrkr.net/strfry",
  "nostr.sathoarder.com",
  "nostr.stakey.net",
  "nostr.vulpem.com",
  "nostr2.sanhauf.com",
  "nostrelay.circum.space",
  "relay.fountain.fm",
  "relay.nostraddress.com",
  "relay.nostromo.social",
  "relay.snort.social",
  "relay.verified-nostr.com",
  "strfry.openhoofd.nl",
  "yabu.me/v2"
].map((url) => "wss://" + url);
// lib/components/conflictResolver.js
var resolveConflict = (currentNode, incomingChange) => {
  if (!currentNode || !currentNode.timestamp) {
    return { resolved: true, value: incomingChange.newValue, timestamp: incomingChange.timestamp };
  }
  if (currentNode.timestamp < incomingChange.timestamp) {
    return { resolved: true, value: incomingChange.newValue, timestamp: incomingChange.timestamp };
  }
  return { resolved: false };
};

// lib/components/workerCode.js
var workerCode = () => {
  const loadFile = async (fileName) => {
    try {
      const accessHandle = await (await navigator.storage.getDirectory()).getFileHandle(fileName, { create: false }).then((fh) => fh.createSyncAccessHandle());
      const buffer = new Uint8Array(accessHandle.getSize());
      accessHandle.read(buffer, { at: 0 });
      accessHandle.close();
      return { type: "loaded", name: fileName, data: buffer };
    } catch (error) {
      return { type: "error", name: fileName, message: error.message || "File not found" };
    }
  };
  const saveFile = async (fileName, content) => {
    if (!(content instanceof Uint8Array))
      throw new Error("Content must be a Uint8Array");
    try {
      const accessHandle = await (await navigator.storage.getDirectory()).getFileHandle(fileName, { create: true }).then((fh) => fh.createSyncAccessHandle());
      accessHandle.write(content, { at: 0 });
      accessHandle.truncate(content.byteLength);
      accessHandle.close();
      return { type: "saved", name: fileName };
    } catch (error) {
      return { type: "error", name: fileName, message: error.message || "Error saving the file" };
    }
  };
  self.onmessage = async ({ data: { type, name, content } }) => {
    try {
      const result = type === "load" ? await loadFile(name) : type === "save" ? await saveFile(name, content) : { type: "error", message: "Unrecognized action" };
      self.postMessage(result);
    } catch (error) {
      self.postMessage({ type: "error", message: error.message || "Unexpected error" });
    }
  };
};
var workerCode_default = workerCode;

// lib/components/gdb.js
async function checkOPFS() {
  console.log("\u26A1 GDB-P2P: Empowering distributed graph databases with real-time synchronization and scalability. Learn more: https://github.com/estebanrfp/gdb \u26A1");
  if (navigator?.storage?.getDirectory) {
    const root = await navigator.storage.getDirectory();
    console.log("OPFS is enabled.");
  } else {
    console.log("OPFS is not available.");
  }
}
if (Symbol.dispose === undefined) {
  Object.defineProperty(Symbol, "dispose", { value: Symbol.for("Symbol.dispose") });
}

class Graph {
  constructor() {
    this.nodes = {};
  }
  insert(id, value) {
    this.nodes[id] = { id, value, edges: [], timestamp: Date.now() };
  }
  get(id) {
    return this.nodes[id] || null;
  }
  link(sourceId, targetId) {
    const sourceNode = this.nodes[sourceId];
    const targetNode = this.nodes[targetId];
    if (sourceNode && targetNode && !sourceNode.edges.includes(targetId)) {
      sourceNode.edges.push(targetId);
    }
  }
  getAllNodes() {
    return Object.values(this.nodes);
  }
  serialize() {
    return pako.deflate(encode(this.nodes));
  }
  deserialize(data) {
    this.nodes = decode(pako.inflate(new Uint8Array(data)));
  }
}

class GraphDB {
  constructor(name, { password } = {}) {
    this.name = name;
    this.password = password;
    this.graph = new Graph;
    this.eventListeners = [];
    this.localHash;
    this.localTime = Date.now();
    this.initWorker();
    this.ready = this.loadGraphFromOPFS();
    const key = `graph-sync-room-${this.name}`;
    const roomConfig = { appId: "1234", ...this.password && { password: this.password } };
    const room2 = joinRoom(roomConfig, key);
    this.room = room2;
    window.addEventListener("online", async () => {
      console.log("\u2705 Reconnected to the network.");
      this.sendData([{ type: "sync", hash: this.localHash, ts: this.localTime }]);
    });
    window.addEventListener("offline", async () => {
      console.log("\u274C Disconnected from the network.");
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.log("La pesta\xF1a es visible nuevamente.");
        this.sendData([{ type: "sync", hash: this.localHash, ts: this.localTime }]);
      } else if (document.visibilityState === "hidden") {
        console.log("La pesta\xF1a ya no es visible.");
      }
    });
    checkOPFS();
    room2.onPeerJoin(async (peerId) => {
      console.log("\u26A1 New pair connected:", peerId);
      this.sendData([{ type: "sync", hash: this.localHash, ts: this.localTime }]);
    });
    room2.onPeerLeave((peerId) => {
      console.log("\u26A1 Pair disconnected:", peerId);
    });
    const [sendData, getData] = room2.makeAction("syncGraph");
    this.sendData = sendData;
    getData((data) => this.receiveChanges(data));
    this.channel = new BroadcastChannel(`graphdb_sync_${this.name}`);
    this.channel.onmessage = async (event) => {
      if (event.data === "update") {
        console.log("\uD83D\uDD04 Update received from another tab...");
        await this.loadGraphFromOPFS();
        this.emit();
      }
    };
  }
  initWorker = async () => {
    try {
      const blob = new Blob([`(${workerCode_default.toString()})()`], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      this.worker = new Worker(url);
      URL.revokeObjectURL(url);
      this.worker.addEventListener("message", (event) => {
        console.log("Worker message:", `${event.data.name} ${event.data.type}`);
      });
      console.log("Worker inicializado correctamente.");
    } catch (error) {
      console.error("Error al inicializar el worker:", error.message);
    }
  };
  emit() {
    const currentNodes = this.graph.getAllNodes();
    this.eventListeners.forEach((listener) => listener(currentNodes));
  }
  on(callback) {
    this.eventListeners.push(callback);
  }
  off(callback) {
    if (callback) {
      this.eventListeners = this.eventListeners.filter((listener) => listener !== callback);
    } else {
      this.eventListeners = [];
    }
  }
  async getAllNodes() {
    await this.ready;
    return this.graph.getAllNodes();
  }
  async generateHash() {
    return crypto.randomUUID();
  }
  async hashValue(value) {
    const data = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  async generateGraphHash() {
    const serializedGraph = this.graph.serialize();
    return await this.hashValue(serializedGraph);
  }
  async loadGraphFromOPFS() {
    try {
      const loadFileFromWorker = (fileName) => {
        return new Promise((resolve, reject) => {
          this.worker.postMessage({ type: "load", name: fileName });
          const handleMessage = (event) => {
            if (event.data.type === "loaded" && event.data.name === fileName) {
              this.worker.removeEventListener("message", handleMessage);
              resolve(new Uint8Array(event.data.data));
            } else if (event.data.type === "error") {
              this.worker.removeEventListener("message", handleMessage);
              reject(new Error(event.data.message || "Error desconocido al cargar el archivo."));
            }
          };
          this.worker.addEventListener("message", handleMessage);
        });
      };
      const graphContent = await loadFileFromWorker(`${this.name}_graph.msgpack`).catch(() => new Uint8Array);
      if (graphContent.byteLength > 0) {
        this.graph.deserialize(graphContent);
      } else {
        console.warn("The file '_graph.msgpack' is empty or could not be loaded.");
      }
      console.log(`Graph loaded from OPFS: [ ${this.graph.getAllNodes().length} nodes ]`);
    } catch (error) {
      console.error("General error loading the graph from OPFS:", error.message);
    }
  }
  async saveGraphToOPFS() {
    try {
      console.log("graph hash: ", await this.generateGraphHash());
      const serializedGraph = this.graph.serialize();
      const saveFile = (fileName, content) => new Promise((resolve, reject) => {
        this.worker.postMessage({ type: "save", name: fileName, content });
        const handleMessage = ({ data }) => {
          if (data.type === "saved" && data.name === fileName) {
            this.worker.removeEventListener("message", handleMessage);
            resolve();
          } else if (data.type === "error") {
            this.worker.removeEventListener("message", handleMessage);
            reject(new Error(data.message || "Error al guardar"));
          }
        };
        this.worker.addEventListener("message", handleMessage);
      });
      await saveFile(`${this.name}_graph.msgpack`, serializedGraph);
      this.localHash = await this.generateGraphHash();
      this.localTime = Date.now();
      this.channel.postMessage("update");
      return true;
    } catch (error) {
      console.error("Error guardando:", error);
      throw new Error("Guardado fallido");
    }
  }
  async put(value, id) {
    await this.ready;
    id ??= await this.generateHash(encode(value));
    const node = this.graph.get(id);
    this.graph.insert(id, value);
    await this.saveGraphToOPFS();
    this.sendData([{ type: "insert", id, value, timestamp: Date.now() }]);
    this.emit();
    return id;
  }
  async get(idOrQuery, callback = null) {
    await this.ready;
    let resultNode = null;
    let isQuery = false;
    if (typeof idOrQuery === "object" && idOrQuery !== null) {
      isQuery = true;
      const allNodes = this.graph.getAllNodes();
      const matches = allNodes.filter((node) => {
        return Object.entries(idOrQuery).every(([key, value]) => {
          return encode(node.value[key]).equals(encode(value));
        });
      });
      resultNode = matches.sort((a2, b2) => b2.timestamp - a2.timestamp)[0] || null;
    } else {
      const id = idOrQuery;
      resultNode = this.graph.get(id);
      if (!resultNode) {
        console.error(`Node with ID '${id}' not found.`);
        return { result: null };
      }
    }
    if (!callback) {
      return { result: resultNode };
    }
    callback(resultNode);
    const listener = (nodes) => {
      let newResult = null;
      if (isQuery) {
        const newMatches = nodes.filter((node) => {
          return Object.entries(idOrQuery).every(([key, value]) => {
            return encode(node.value[key]).equals(encode(value));
          });
        });
        newResult = newMatches.sort((a2, b2) => b2.timestamp - a2.timestamp)[0] || null;
      } else {
        newResult = nodes.find((n) => n.id === idOrQuery);
      }
      if (newResult) {
        resultNode = newResult;
        callback(newResult);
      }
    };
    this.eventListeners.push(listener);
    return {
      result: resultNode,
      ...callback && {
        unsubscribe: () => {
          const index = this.eventListeners.indexOf(listener);
          if (index > -1) {
            this.eventListeners.splice(index, 1);
          }
        }
      }
    };
  }
  async map(...args) {
    await this.ready;
    const defaultOptions = {
      realtime: false,
      query: {},
      field: null,
      order: "asc",
      $limit: null,
      $after: null,
      $before: null,
      strictMode: false
    };
    let options = { ...defaultOptions };
    let callback = null;
    let explicitRealtime = false;
    args.forEach((arg) => {
      if (typeof arg === "function") {
        callback = arg;
      } else if (arg && typeof arg === "object") {
        if ("realtime" in arg)
          explicitRealtime = true;
        Object.assign(options, arg);
      }
    });
    if (callback && !explicitRealtime) {
      options.realtime = true;
    }
    const operators = {
      $eq: (a2, b2) => a2 === b2,
      $ne: (a2, b2) => a2 !== b2,
      $gt: (a2, b2) => a2 > b2,
      $gte: (a2, b2) => a2 >= b2,
      $lt: (a2, b2) => a2 < b2,
      $lte: (a2, b2) => a2 <= b2,
      $in: (a2, b2) => Array.isArray(b2) && b2.includes(a2),
      $between: (a2, [min, max]) => a2 >= min && a2 <= max,
      $exists: (val, shouldExist) => shouldExist ? val !== undefined : val === undefined,
      $text: {
        global: (nodeValue, search) => {
          const normalize = (str) => String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\w\s]/g, "");
          const searchNormalized = normalize(search);
          return Object.values(nodeValue).some((value) => {
            if (typeof value === "object")
              return this.fieldSearch(value, searchNormalized);
            return normalize(value).includes(searchNormalized);
          });
        },
        field: (fieldValue, search) => {
          const normalize = (str) => String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\w\s]/g, "");
          return Array.isArray(fieldValue) ? fieldValue.some((v2) => normalize(v2).includes(normalize(search))) : normalize(fieldValue).includes(normalize(search));
        }
      },
      $like: (nodeValue, pattern) => {
        if (typeof nodeValue !== "string" || typeof pattern !== "string")
          return false;
        const regex = new RegExp(`^${pattern.replace(/%/g, ".*").replace(/_/g, ".")}\$`, "i");
        return regex.test(nodeValue);
      },
      $regex: (nodeValue, query) => typeof nodeValue === "string" && new RegExp(query.$regex || query, "i").test(nodeValue),
      $and: (node, conditions, ctx) => conditions.every((cond) => {
        const subFilter = ctx.createFilter(cond);
        return subFilter(node);
      }),
      $or: (node, conditions, ctx) => conditions.some((cond) => {
        const subFilter = ctx.createFilter(cond);
        return subFilter(node);
      }),
      $not: (node, condition, ctx) => {
        const subFilter = ctx.createFilter(condition);
        return !subFilter(node);
      }
    };
    const getNestedValue = (obj, path) => {
      try {
        return path.split(".").reduce((acc, key) => {
          if (acc && typeof acc === "object" && (key in acc))
            return acc[key];
          if (options.strictMode)
            throw new Error(`Campo no encontrado: ${path}`);
          return;
        }, obj);
      } catch (error) {
        if (options.strictMode)
          throw error;
        return;
      }
    };
    const createFilter = (currentQuery) => {
      const filterNode = (node) => {
        return Object.entries(currentQuery).every(([key, condition]) => {
          if (key.startsWith("$")) {
            return operators[key](node, condition, {
              filterNode,
              createFilter
            });
          }
          const nodeValue = getNestedValue(node.value, key);
          if (typeof condition !== "object" || condition === null) {
            return operators.$eq(nodeValue, condition);
          }
          return Object.entries(condition).every(([op, value]) => {
            if (op === "$text") {
              return operators.$text.field(nodeValue, value);
            }
            if (op === "$between" && value.every((v2) => v2 instanceof Date)) {
              const nodeDate = new Date(nodeValue);
              return operators.$between(nodeDate, value);
            }
            return operators[op]?.(nodeValue, value) ?? false;
          });
        });
      };
      return filterNode;
    };
    const filter = createFilter(options.query);
    function arraysEqual(a2, b2) {
      if (a2.length !== b2.length)
        return false;
      for (let i = 0;i < a2.length; i++) {
        if (a2[i] !== b2[i])
          return false;
      }
      return true;
    }
    const processNodes = (nodes) => {
      let results = Object.values(nodes).filter(filter);
      if (options.field) {
        results.sort((a2, b2) => {
          const aVal = getNestedValue(a2.value, options.field);
          const bVal = getNestedValue(b2.value, options.field);
          const dir = options.order === "asc" ? 1 : -1;
          if (typeof aVal === "string" && typeof bVal === "string") {
            return aVal.localeCompare(bVal) * dir;
          }
          return ((aVal ?? 0) - (bVal ?? 0)) * dir;
        });
      }
      if (options.$after) {
        const index = results.findIndex((n) => n.id === options.$after);
        results = index >= 0 ? results.slice(index + 1) : [];
      }
      if (options.$before) {
        const index = results.findIndex((n) => n.id === options.$before);
        results = index >= 0 ? results.slice(0, index) : [];
      }
      return options.$limit ? results.slice(0, options.$limit) : results;
    };
    let currentResults = processNodes(this.graph.nodes);
    let handler = null;
    const notifyChanges = (newResults) => {
      const added = newResults.filter((n) => !currentResults.some((c) => c.id === n.id));
      const removed = currentResults.filter((c) => !newResults.some((n) => n.id === c.id));
      const updated = newResults.filter((n) => {
        const oldNode = currentResults.find((c) => c.id === n.id);
        return oldNode && !arraysEqual(encode(n.value), encode(oldNode.value));
      });
      if (callback) {
        if (callback.length > 1) {
          added.forEach((n) => callback(n.id, n.value, "added"));
          removed.forEach((n) => callback(n.id, null, "removed"));
          updated.forEach((n) => callback(n.id, n.value, "updated"));
        } else {
          callback(newResults);
        }
      }
    };
    if (callback) {
      if (callback.length > 1) {
        currentResults.forEach((n) => callback(n.id, n.value, "initial"));
      } else {
        callback(currentResults);
      }
      if (options.realtime) {
        handler = (newNodes) => {
          const newResults = processNodes(newNodes);
          if (!arraysEqual(encode(newResults), encode(currentResults))) {
            notifyChanges(newResults);
            currentResults = newResults;
          }
        };
        this.on(handler);
      }
    }
    return {
      results: currentResults,
      ...options.realtime && { unsubscribe: () => handler && this.off(handler) }
    };
  }
  async remove(id) {
    await this.ready;
    const node = this.graph.get(id);
    if (!node)
      return console.error(`Nodo con ID '${id}' no encontrado.`);
    delete this.graph.nodes[id];
    for (const otherNode of Object.values(this.graph.nodes)) {
      otherNode.edges = otherNode.edges.filter((edgeId) => edgeId !== id);
    }
    await this.saveGraphToOPFS();
    this.sendData([{ type: "remove", id, value: node.value, timestamp: Date.now() }]);
    this.emit();
  }
  async clear() {
    await this.ready;
    this.graph.nodes = {};
    const rootDirectory = await navigator.storage.getDirectory();
    try {
      await rootDirectory.removeEntry(`${this.name}_graph.msgpack`);
    } catch (error) {
      console.warn(`Error deleting _graph.msgpack: ${error.message}`);
    }
    console.log("All data has been deleted.");
  }
  async link(sourceId, targetId) {
    await this.ready;
    if (!this.graph.nodes[sourceId] || !this.graph.nodes[targetId]) {
      console.error(`Uno o ambos nodos (${sourceId}, ${targetId}) no existen.`);
      return;
    }
    this.graph.link(sourceId, targetId);
    await this.saveGraphToOPFS();
    this.sendData([{ type: "link", sourceId, targetId, timestamp: Date.now() }]);
    this.emit();
  }
  async applyFullGraph(remoteGraph) {
    try {
      this.graph.nodes = {};
      for (const [id, node] of Object.entries(remoteGraph.nodes)) {
        this.graph.nodes[id] = node;
      }
      await this.saveGraphToOPFS();
    } catch (error) {
      console.error("Error applying the full graph:", error.message);
    }
  }
  async receiveChanges(changes) {
    for (const change of changes) {
      if (change.type === "insert") {
        this.graph.insert(change.id, change.value);
      } else if (change.type === "update") {
        const node = this.graph.get(change.id);
        const resolution = resolveConflict(node, change);
        if (resolution.resolved) {
          node.value = resolution.value;
          node.timestamp = resolution.timestamp;
        }
      } else if (change.type === "remove") {
        delete this.graph.nodes[change.id];
      } else if (change.type === "link") {
        this.graph.link(change.sourceId, change.targetId);
      } else if (change.type === "sync") {
        if (this.localHash !== change.hash) {
          if (this.localTime > change.ts) {
            console.log("Sending recent data to remote node.");
            this.sendData([{ type: "syncReceive", graph: this.graph }]);
          }
        }
      } else if (change.type === "syncReceive") {
        await this.applyFullGraph(change.graph);
      }
    }
    await this.saveGraphToOPFS();
    this.emit();
  }
}

// lib/components/rbac.js
function setCustomRoles(customRoles) {
  if (typeof customRoles !== "object" || customRoles === null) {
    throw new Error("Los roles personalizados deben ser un objeto v\xE1lido.");
  }
  defaultRoles = customRoles;
}
function can(role, operation, visitedRoles = new Set) {
  const rolesConfig = defaultRoles;
  if (!rolesConfig[role])
    return false;
  if (visitedRoles.has(role))
    return false;
  visitedRoles.add(role);
  if (rolesConfig[role].can.includes(operation))
    return true;
  if (rolesConfig[role].inherits) {
    return rolesConfig[role].inherits.some((childRole) => can(childRole, operation, visitedRoles));
  }
  return false;
}
async function assignRole(db, userAddress, role, expiresAt = null) {
  await db.ready;
  if (!defaultRoles[role]) {
    throw new Error(`El rol '${role}' no existe.`);
  }
  const userNodeKey = `user:${userAddress}`;
  const existingNode = db.graph.get(userNodeKey);
  const userData = {
    role,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
  };
  if (!existingNode) {
    db.graph.insert(userNodeKey, userData);
  } else {
    existingNode.value = userData;
    existingNode.timestamp = Date.now();
  }
  await db.saveGraphToOPFS();
  console.log(`Rol '${role}' asignado al usuario '${userAddress}'${expiresAt ? ` con caducidad en ${expiresAt}` : ""}.`);
}
async function checkMetamaskConnection() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Metamask no est\xE1 instalado o no est\xE1 conectado.");
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (accounts.length === 0) {
    throw new Error("No hay cuentas conectadas en Metamask.");
  }
  return accounts[0];
}
async function verifyUserRole(db, userAddress) {
  const userNodeKey = `user:${userAddress}`;
  const userNode = db.graph.get(userNodeKey);
  if (!userNode) {
    throw new Error("No tienes un rol asignado.");
  }
  if (userNode.value.expiresAt && new Date(userNode.value.expiresAt) < new Date) {
    throw new Error("Tu rol ha caducado.");
  }
  return userNode.value.role;
}
async function verifyUserPermission(db, userAddress, operation) {
  const role = await verifyUserRole(db, userAddress);
  if (!can(role, operation)) {
    throw new Error(`No tienes permiso para realizar la operaci\xF3n '${operation}'.`);
  }
}
async function executeWithPermission(db, operation, action) {
  let userAddress = await checkMetamaskConnection();
  await verifyUserPermission(db, userAddress, operation);
  return userAddress;
}
var defaultRoles = {
  superadmin: { can: ["assignRole"], inherits: ["admin"] },
  admin: { can: ["delete"], inherits: ["manager"] },
  manager: { can: ["publish"], inherits: ["user"] },
  user: { can: ["write"], inherits: ["guest"] },
  guest: { can: ["read"] }
};
export {
  setCustomRoles,
  executeWithPermission,
  assignRole,
  GraphDB
};
