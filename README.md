# What?

This is the simple Node module, which implements a few polyfills for the 'console' object methods to be used within the server or mobile code for pretty terminal output. Log, info, warn, error, debug, group and others - all with colors, formatting and grouping support. Fully React Native compatible!

![Screenshot](screenshot1.png)

If you have a better screenshot, do not hesitate to make a PR or just email it to me.


# Why?

I have just been tired of the output given by React Native by default. Hope, you feel the same and will find this module useful.


# Features

- Log method type color labels;
- JSON objects formatting (condensed and normal) with customizable colors;
- Collapsable logs grouping (`console.group*` methods);
- Method labels and JSON output color theming;
- Support of the all with the same syntax you use in the browser consoin-browser logging syntax (e.g., `console.log( "%cSome text", "color: green;" )`)


# Install

Run from your projects directory:
```
npm i --save color-term-console
```


# How to use

You can just imprt the module once from your index file to enable it with the default settings:

```
import "color-term-console"
```
Remember to import it in front of other modules, which output to console.


To change the default behaviour:

```
import { condensedJsonOutput, setColorTheme } from "color-term-console"

...
condensedJsonOutput( true )

setColorTheme( {
	number: "tomato",
} )
...

```


# API

## condensedJsonOutput( *mode: Boolean* )
Switch between normal and condensed object output mode. In the condensed mode each line could contain several *key: value* pairs.

## setColorTheme( *theme: Object* )
Change color theming options.

*theme* if the plain object containing all the values to be changed. *Example*:
```
{
	number: "tomato",
	warn: "blue",
}
```

Default theme:
```
{
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
```

Currently available colors:
- black
- white
- grey
- gray
- red
- tomato
- green
- acidgreen
- yellow
- olive
- blue
- navy
- magenta
- pink
- cyan
- darkcyan
