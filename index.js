"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getColorTheme = exports.setColorTheme = exports.condensedJsonOutput = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /* "color-term-console" - console polyfills and colorized output */

var _cliColor = require("cli-color");

var _cliColor2 = _interopRequireDefault(_cliColor);

var _jsonStringifyPrettyCompact = require("json-stringify-pretty-compact");

var _jsonStringifyPrettyCompact2 = _interopRequireDefault(_jsonStringifyPrettyCompact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

_global = global || window;
var console = _global.console;

/* We consider to be in terminal if the original console.clear() method does not exist */
var inTerm = typeof (_global._console || console).clear === "undefined";

var noop = function noop() {};
var hr = "-".repeat(80); // 80 char column
var clear = "\n".repeat(12); // six empty lines


var _compactJson = false;
var condensedJsonOutput = exports.condensedJsonOutput = function condensedJsonOutput(value) {
	if (typeof value === "boolean") _compactJson = value;
	return _compactJson;
};

// helper functions:
var perf = _global.performance;
var now = perf && (perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow);
var getTime = function getTime() {
	return now && now.call(perf) || new Date().getTime();
};

var _colorTheme = {
	// json lexical types
	number: "olive",
	key: "blue",
	string: "green",
	boolean: "blue",
	null: "gray",
	// message types
	log: "white",
	debug: "gray",
	info: "cyan",
	warn: "yellow",
	error: "red",
	dir: "pink",
	dirxml: "pink"
};
var setColorTheme = exports.setColorTheme = function setColorTheme(value) {
	if ((typeof value === "undefined" ? "undefined" : _typeof(value)) === "object") _colorTheme = _extends({}, _colorTheme, value);
	return _colorTheme;
};
var getColorTheme = exports.getColorTheme = function getColorTheme() {
	return _colorTheme;
};

var _groupIndent = 4;
var _collapsed = false;
var groups = [],
    times = {},
    counts = {};

var printToTerm = function printToTerm(method) {
	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	var colors = {
		black: "black",
		white: "whiteBright",
		grey: "white",
		gray: "white",
		red: "red",
		tomato: "redBright",
		green: "green",
		acidgreen: "greenBright",
		yellow: "yellowBright",
		olive: "yellow",
		blue: "blueBright",
		navy: "blue",
		magenta: "magenta",
		pink: "magentaBright",
		cyan: "cyanBright",
		darkcyan: "cyan"
	};

	var syntaxHighlight = function syntaxHighlight(json) {
		if (!json) return _cliColor2.default[colors[_colorTheme["null"]]]("undefined");
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
			var type = "number";
			if (/^"/.test(match)) {
				if (/:$/.test(match)) type = "key";else type = "string";
			} else if (/true|false/.test(match)) type = "boolean";else if (/null/.test(match)) type = "null";

			return _cliColor2.default[colors[_colorTheme[type]]](match);
		});
	};

	/* Do nothing if the current group is collapsed */
	/* WARNING: There is a risk that some other process writes to the console while in a group  */
	// TODO: Prevent the possible output conflict
	if (_collapsed) return;

	var message = "";
	for (var a = 0; a < args.length; a++) {
		var arg = args[a];
		var messagePart = "";
		if (typeof arg !== "string") {
			var json = _compactJson ? (0, _jsonStringifyPrettyCompact2.default)(arg, { maxLength: 80, indent: 2 }) : JSON.stringify(arg, undefined, 4);
			messagePart = syntaxHighlight(json);
		} else {
			var parts = arg.split("%c");
			for (var p = 1; p < parts.length; p++) {
				var objString = ("{ " + (args[a + 1] || "") + " }").replace(/;+/g, ",") // change ; to ,
				.replace(/\s*([{}\[\]:,])\s*/g, '$1$1') // remove spaces and double delimiters
				.replace(/([{\[:,])['"]?([a-zA-Z0-9_\-\s]+)['"]?([}\]:,])/g, '$1"$2"$3').replace(/{+/g, "{") // remove double }
				.replace(/}+/g, "}") // remove double }
				.replace(/\[+/g, "[") // remove double [
				.replace(/\]+/g, "]") // remove double ]
				.replace(/:+/g, ":") // remove double :
				.replace(/,+/g, ",") // remove double comma
				.replace(/,([}\]])/g, "$1"); // remove comma in the end of the list
				var style = void 0;
				try {
					style = JSON.parse(objString);
				} catch (e) {
					style = {};
				}

				for (var key in style) {
					var value = style[key].toLowerCase();
					switch (key.toLowerCase().replace("-", "")) {
						case "color":
							value = colors[value];
							break;
						case "textdecoration":
						case "fontstyle":
						case "fontweight":
							break;
						case "backgroundcolor":
							value = colors[value];
							value = "bg" + value[0].toUpperCase() + value.slice(1);
							break;
					}
					if (_cliColor2.default[value]) parts[p] = _cliColor2.default[value](parts[p]);
				}
				a++;
			}
			messagePart = parts.join("");
		}
		message += (message.length && messagePart.length ? " " : "") + messagePart;
	}

	/* Indent when within a group */
	if (groups.length) {
		var indent = _cliColor2.default[colors["gray"]]((" ".repeat(_groupIndent - 1) + "·").repeat(groups.length));
		message = indent + message.replace(/\n/g, "\n" + indent);
	}

	_global._console[method]("\x1b[39m" + message.replace(/\n/g, "\x1b[37m\n\x1b[39m") + "\x1b[37m");
};

var methodLabel = function methodLabel(method) {
	return method === "log" ? [] : ["%c " + method + " ", "background-color: " + _colorTheme[method] + "; color: black;"];
};

/* Reassign methods only once */
if (typeof _global._console === "undefined") {
	(function () {
		var _console = {};
		_global._console = _console;

		/* These all do nothing if they aren't defined */
		var noopMethods = ["profile", "profileEnd", "trace", "table"];
		noopMethods.map(function (method) {
			return console[method] = console[method] || noop;
		});

		/* These all alias to console.log if they aren't defined */
		var loggingMethods = ["log", "debug", "info", "warn", "error", "dir", "dirxml"];
		loggingMethods.map(function (method) {
			/* Save original methods into _console.
      If the method does not exist, use log() or noop() instead.
     */
			_console[method] = console[method] || console.log || noop;

			/* Detect YellowBox and use the previously saved method for error() */
			if (method === "error" && console._errorOriginal) {
				_console.error = console._errorOriginal;
				console.errorBox = console.error;
			}

			/* Choose different output method for the browser console and terminal */
			// TODO: Check color support somehow
			var fn = inTerm ? function () {
				for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
					args[_key2] = arguments[_key2];
				}

				return printToTerm.apply(undefined, [method].concat(args));
			} : _console[method];

			var wrapper = function wrapper() {
				for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
					args[_key3] = arguments[_key3];
				}

				return fn.apply(undefined, _toConsumableArray(methodLabel(method)).concat(args));
			};
			/* Call the saved YellowBox method on error */
			if (method === "error" && console.errorBox) console._errorOriginal = wrapper;else console[method] = wrapper;
		});

		if (!console.timeStamp) console.timeStamp = function () {
			return console.log(getTime());
		};

		/* These mimic the appropriate behaviour if they are not defined */
		var _group = function _group(label, collapsed) {
			var closing = collapsed ? ["%c]]", "color: acidGreen"] : [];
			console.log.apply(console, ["%c[[ %c" + label, "color: acidGreen", "color: gray; text-decoration: underline;"].concat(closing));
			groups.push({ label: label, collapsed: collapsed, collapsedPrev: _collapsed });
			_collapsed = _collapsed || collapsed;
		};
		if (!console.group) console.group = function (label) {
			return _group(label, false);
		};
		if (!console.groupCollapsed) console.groupCollapsed = function (label) {
			return _group(label, true);
		};
		if (!console.groupEnd) console.groupEnd = function () {
			var _groups$pop = groups.pop();

			var label = _groups$pop.label;
			var collapsed = _groups$pop.collapsed;
			var collapsedPrev = _groups$pop.collapsedPrev;

			_collapsed = collapsedPrev;
			if (!collapsed) console.log("%c]]", "color: acidGreen");
		};

		if (!console.time) console.time = function (label) {
			return times[label] = getTime();
		};
		if (!console.timeEnd) console.timeEnd = function (label) {
			console.log(label + ":", (getTime() - times[label]).toFixed(3) + "ms");
			delete times[label];
		};

		if (!console.assert) console.assert = function (expression, label) {
			if (!expression) console.error("Assertion failed:", label);
		};
		if (!console.count) console.count = function (label) {
			if (!counts[label]) counts[label] = 0;
			counts[label]++;
			console.log(label + ":", counts[label]);
		};
		_console.clear = console.clear;
		if (!console.clear) console.clear = function () {
			return console.log(clear);
		};
	})();
}

console.log("\n\n%c" + hr + "\n", "color: gray");