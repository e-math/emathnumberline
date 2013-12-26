Emathnumberline
==============

See the [demo page](http://e-math.github.io/emathnumberline/).

What?
-----
A tool for creating numberlines with points, intervals and distances.

How?
----
Emathnumberline is a jQuery-plugin and can be embedded on any web page
by including `jquery.emathnumberline.js`-file and defining some html-element
as a numberline with: `$('#mydiv').emathnumberline(data)`.

Emathtable depends on external JavaScript libraries:
* jQuery
* JSXGraph

Who?
----
The tool was developed in EU-funded [E-Math -project](http://emath.eu) by
* Petri Salmela
* Petri Sallasmaa
and the copyrights are owned by [Four Ferries oy](http://fourferries.fi).

License?
--------
The tool is licensed under [GNU AGPL](http://www.gnu.org/licenses/agpl-3.0.html).
The tool depends on some publicly available open source components with other licenses:
* [jQuery](http://jquery.com) (MIT-license)
* [JSXGraph](http://jsxgraph.uni-bayreuth.de/) (GNU LGPL and MIT-license)



Usage
======
Initing a numberline
----
Init a new numberline with given data.
* Fised points
* Draggable points (gliders)
* Intervals (ranges)
* Distances (length), that show the distance of two points with biheaded arrow and a number.

```javascript
jQuery('#box').emathnumberline({
    text: "",
    startval: -10,
    endval: 10,
    points: {
        "-3": {
            ptype: "point",
            xcoord: -3,
            color: "red",
            fillcolor: "red",
            face: "o"
        },
        "A": {
            ptype: "glider",
            xcoord: 2,
            color: "green",
            fillcolor: "white",
            face: "o"
        },
        "B": {
            ptype: "glider",
            xcoord: -4.5,
            color: "blue",
            fillcolor: "blue",
            face: "x"
        }
    },
    ranges: {
        "interval1": {
            from: "-3",
            to: "A",
            color: "blue",
            rtype: "range"
        },
        "dist1": {
            from: "A",
            to: "B",
            color: "green",
            rtype: "length"
        }
    }
});
```
For more examples, see the [demo page](http://e-math.github.io/emathnumberline/).