/* "color-term-console" - console polyfills and colorized output */

import clc from "cli-color"
import stringify from "json-stringify-pretty-compact"

_global = global || window
const console = _global.console


/* We consider to be in terminal if the original console.clear() method does not exist */
const inTerm = typeof (_global._console || console).clear === "undefined"

const noop = () => {}
const hr = "-".repeat( 80 ) // 80 char column
const clear = "\n".repeat( 12 ) // six empty lines


let _compactJson = false
export const condensedJsonOutput = ( value ) => {
	if( typeof value === "boolean" ) _compactJson = value
	return _compactJson
}


// helper functions:
const perf = _global.performance
const now = perf && ( perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow )
const getTime = ()  => now && now.call( perf ) || ( new Date().getTime() )


let _colorTheme = {
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
	dirxml: "pink",
}
export const setColorTheme = ( value ) => {
	if( typeof value === "object" ) _colorTheme = { ..._colorTheme, ...value }
	return _colorTheme
}
export const getColorTheme = () => _colorTheme

let _groupIndent = 4
let _collapsed = false
var groups = [],
	times = {},
	counts = {}


const printToTerm = ( method, ...args ) => {
	const colors = {
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
		darkcyan: "cyan",
	}

	const syntaxHighlight  = json => {
		if( !json ) return clc[ colors[ _colorTheme[ "null" ] ] ]( "undefined" )
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
			let type = "number"
			if( /^"/.test(match) ) {
				if ( /:$/.test(match) ) type = "key"
				else type = "string"
			} else if ( /true|false/.test(match) ) type = "boolean"
			else if ( /null/.test(match) ) type = "null"

			return clc[ colors[ _colorTheme[ type ] ] ]( match )
		})
	}

	/* Do nothing if the current group is collapsed */
	/* WARNING: There is a risk that some other process writes to the console while in a group  */
	// TODO: Prevent the possible output conflict
	if( _collapsed ) return

	let message = ""
	for( let a = 0; a < args.length; a++ ) {
		const arg = args[a]
		let messagePart = ""
		if( typeof arg !== "string" ) {
			const json = _compactJson ? stringify( arg, { maxLength: 80, indent: 2 } )
				                      : JSON.stringify( arg, undefined, 4 )
			messagePart = syntaxHighlight( json )
		} else {
			const parts = arg.split("%c")
			for( let p = 1; p < parts.length; p++ ) {
				const objString = `{ ${args[a + 1] || ""} }`
					.replace( /;+/g, "," )        // change ; to ,
					.replace( /\s*([{}\[\]:,])\s*/g, '$1$1' )   // remove spaces and double delimiters
					.replace( /([{\[:,])['"]?([a-zA-Z0-9_\-\s]+)['"]?([}\]:,])/g, '$1"$2"$3' )
					.replace( /{+/g, "{" )        // remove double }
					.replace( /}+/g, "}" )        // remove double }
					.replace( /\[+/g, "[" )       // remove double [
					.replace( /\]+/g, "]" )       // remove double ]
					.replace( /:+/g, ":" )        // remove double :
					.replace( /,+/g, "," )        // remove double comma
					.replace( /,([}\]])/g, "$1" ) // remove comma in the end of the list
				let style
				try { style = JSON.parse( objString ) }
				catch(e) { style = {} }

				for( let key in style ) {
					let value = style[ key ].toLowerCase()
					switch( key.toLowerCase().replace( "-", "") ) {
						case "color":
							value = colors[ value ]
							break
						case "textdecoration":
						case "fontstyle":
						case "fontweight":
							break
						case "backgroundcolor":
							value = colors[ value ]
							value = "bg" + value[0].toUpperCase() + value.slice(1)
							break
					}
					if( clc[ value ] ) parts[p] = clc[ value ]( parts[p] )
				}
				a++
			}
			messagePart = parts.join("")
		}
		message += ( message.length && messagePart.length ? " " : "" ) + messagePart
	}

	/* Indent when within a group */
	if( groups.length ) {
		const indent = clc[ colors["gray"] ](
			( " ".repeat( _groupIndent - 1 ) + "·" ).repeat( groups.length )
		)
		message = indent + message.replace( /\n/g, "\n" + indent )
	}

	_global._console[ method ](
		"\x1b[39m" + message.replace( /\n/g, "\x1b[37m\n\x1b[39m" ) + "\x1b[37m"
	)
}


const methodLabel = ( method ) => method === "log" ? [] : [
	`%c ${ method } `,
	`background-color: ${ _colorTheme[ method ] }; color: black;`,
]

/* Reassign methods only once */
if( typeof _global._console === "undefined" ) {
	const _console = {}
	_global._console = _console

	/* These all do nothing if they aren't defined */
	let noopMethods = [ "profile", "profileEnd", "trace", "table" ]
	noopMethods.map( method => console[ method ] = console[ method ] || noop )

	/* These all alias to console.log if they aren't defined */
	const loggingMethods = [ "log", "debug", "info", "warn", "error", "dir", "dirxml" ]
	loggingMethods.map( method => {
		/* Save original methods into _console.
		   If the method does not exist, use log() or noop() instead.
	   */
		_console[ method ] = console[ method ] || console.log || noop

		/* Detect YellowBox and use the previously saved method for error() */
		if( method === "error" && console._errorOriginal ) {
			_console.error = console._errorOriginal
			console.errorBox = console.error
		}

		/* Choose different output method for the browser console and terminal */
		// TODO: Check color support somehow
		const fn = inTerm
			? ( ...args ) => printToTerm( method, ...args )
			: _console[ method ]

		const wrapper = (...args) => fn( ...methodLabel(method), ...args )
		/* Call the saved YellowBox method on error */
		if ( method === "error" && console.errorBox ) console._errorOriginal = wrapper
		else console[ method ] = wrapper
			
	} )

	if( !console.timeStamp ) console.timeStamp = () => console.log( getTime() )

	/* These mimic the appropriate behaviour if they are not defined */
	const _group = ( label, collapsed ) => {
		const closing = collapsed ? [ "%c]]", "color: acidGreen" ] : []
		console.log( `%c[[ %c${ label }`, "color: acidGreen", "color: gray; text-decoration: underline;", ...closing )
		groups.push( { label, collapsed, collapsedPrev: _collapsed } )
		_collapsed = _collapsed || collapsed
	}
	if( !console.group ) console.group = label => _group( label, false )
	if( !console.groupCollapsed ) console.groupCollapsed = label =>  _group( label, true )
	if( !console.groupEnd ) console.groupEnd = () => {
		const { label, collapsed, collapsedPrev } = groups.pop()
		_collapsed = collapsedPrev
		if( ! collapsed ) console.log("%c]]", "color: acidGreen" )
	}

	if( !console.time ) console.time = label => times[label] = getTime()
	if( !console.timeEnd ) console.timeEnd = label => {
		console.log( label + ":", ( getTime() - times[label]).toFixed(3) + "ms" )
		delete( times[label] )
	}

	if( !console.assert ) console.assert = (expression, label) => {
		if( !expression ) console.error( "Assertion failed:", label )
	}
	if( !console.count ) console.count = label => {
		if( !counts[label] ) counts[label] = 0
		counts[label]++
		console.log( label + ":", counts[label] )
	}
	_console.clear = console.clear
	if( !console.clear ) console.clear = () => console.log( clear )
}

console.log( `\n\n%c${hr}\n`, "color: gray" )
