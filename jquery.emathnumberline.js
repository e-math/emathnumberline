//{{{
/*********************************************************
 * jquery.emathnumberline.js
 * jQuery-plugin for drawing numberlines
 * Depends:
 *   jQuery
 *   jsxgraph
 * Petri Salmela
 * Petri Sallasmaa
 * 28.03.2013
 * v.0.1
 * License: AGPL
 ********************************************************/

var testilogit = {};
(function($){
    // jQuery plugin
    
    $.fn.emathnumberline = function(options){
        if (methods[options]){
            return methods[options].apply( this, Array.prototype.slice.call( arguments, 1));
        } else if (typeof(options) === 'object' || !options) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( 'Method ' +  method + ' does not exist on emathnumberline' );
            return this;
        }
    }

    var methods = {
        init: function( options ){
            var settings = $.extend({
                editable: false,
                text: "",
                startval: -10,
                endval: 10,
                points: {},
                ranges: {}
            }, options);

            return this.each(function(){
                var emnline = new EmathNumberline(this, settings);
                emnline.init();
            });
        },
        get: function(){
            // Return the data of numberline.
            this.trigger('getdata');
            return this.eq(0).data('emathnumberline');
        }
    };    
    
    
    

    var EmathNumberline = function(place, options){
        /*****************
         * Constructor for numberline
         *****************/
        this.place = $(place);
        this.text = options.text || '';
        this.startval = options.startval || -10;
        this.endval = options.endval || 10;
        this.points = {};
        this.pointobjects = {};
        this.ranges = {};
        this.rangeobjects = {};
        this.textobjects = {};
        this.options = options;
        // Add css styles if they don't exist already.
        if ($('head style#emathnumberlinestyle').length === 0){
            $('head').append('<style id="emathnumberlinestyle" type="text/css">'+EmathNumberline.strings['style']+'</style>');
        }
    }
    
    EmathNumberline.prototype.init = function(){
        /*****************
         * Init numberline with starting and ending values.
         *****************/
        this.create();
        var points = this.options.points;
        for (point in points) {
            var pointobj = points[point];
            this.addPoint(point, pointobj.xcoord, pointobj.color, pointobj.fillcolor, pointobj.face, pointobj.ptype);
        }
        for (range in this.options.ranges) {
            var rangeobj = this.options.ranges[range];
            this.addRange(range, rangeobj.from, rangeobj.to, rangeobj.color, rangeobj.rtype);
        }
        this.initHandlers();
        this.draw();
    }
    
    EmathNumberline.prototype.initHandlers = function(){
        var nline = this;
        this.place.unbind('getdata').bind('getdata', function(e){
            nline.place.data('emathnumberline', nline.getobject());
        });
        this.place.unbind('emnl_glidermoved').bind('emnl_glidermoved', function(e, name){
            nline.updateGliderFromBoard(name);
            nline.place.trigger('emnlchanged');
        })
    }
    
    EmathNumberline.prototype.addPoint = function(name, xcoord, color, fillcolor, face, ptype){
        /*****************
         * Add point to numberline.
         *****************/
        if (typeof(ptype) == 'undefined'){
            ptype = 'point';
        }
        if (ptype != 'point' && ptype != 'glider'){
            return false;
        }
        if (typeof(color) == 'undefined'){
            color = 'red';
        }
        if (typeof(fillcolor) == 'undefined'){
            fillcolor = color;
        }
        if (typeof(face) == 'undefined'){
            face = 'o';
        }
        var point = {xcoord: xcoord, color: color, fillcolor: fillcolor, face: face, ptype: ptype};
        this.points[name] = point;
        return true;
    }
    
    EmathNumberline.prototype.addGlider = function(name, xcoord, color, fillcolor, face){
        /*****************
         * Add point to numberline.
         *****************/
        this.addPoint(name, xcoord, color, fillcolor, face, 'glider');
    }
    
    EmathNumberline.prototype.addRange = function(name, rfrom, rto, color, rtype){
        /*****************
         * Add range to numberline.
         *****************/
        rtype = rtype || 'range';
        var range = {from: rfrom, to: rto, color: color, rtype: rtype};
        this.ranges[name] = range;
    }
    
    EmathNumberline.prototype.updatePoint = function(name, xcoord, color, fillcolor, face){
        /*****************
         * Update point on numberline.
         *****************/
        // TODO
        this.board.elementByName[name]
    }
    
    EmathNumberline.prototype.updateGliderFromBoard = function(name){
        /*****************
         * Updata xcoord of glider from the board
         *****************/
        if (this.points[name] && this.points[name].ptype === 'glider') {
            this.points[name].xcoord = Math.round(this.board.elementsByName[name].X() * 10)/10;
        }
    }
    
    EmathNumberline.prototype.create = function(element){
        /*****************
         * Create numberline into given html-element.
         *****************/
        if (typeof(element) === 'undefined') {
            element = this.place;
        }
        var elemname = 'emathnumberline_';
        var elemnumber = 0;
        while (jQuery('#'+elemname+elemnumber).length > 0 && elemnumber < 1000){
            elemnumber = elemnumber + 1;
        }
        if (elemnumber >= 1000){
            jQuery(element).append('<div class="error">Error: Too many numberlines.</div>');
            return false;
        } else {
            elemname = elemname + elemnumber;
        }
        jQuery(element).append('<div class="emathnumberline" id="'+elemname+'"></div>');
        this.elementname = elemname;
        return true;
    }
    
    EmathNumberline.prototype.update = function(elemname){
        /*****************
         * Update numberline into given html-element.
         *****************/
        this.draw(elemname);
    }
    
    EmathNumberline.prototype.draw = function(elemname){
        /*****************
         * Draw numberline into given html-element.
         *****************/
        if (typeof(elemname) == 'undefined'){
            elemname = this.elementname;
        }
        if (typeof(elemname) == 'undefined' || !elemname.match(/^emathnumberline_[0-9]+$/) || jQuery('#'+elemname).length == 0){
            // If given elemname is not required form or that element does not exist in dom.
            return false;
        }
        var nline = this;
        var element = jQuery('#'+elemname);
        element.empty();
        var elemwidth = jQuery(element).width();
        var elemheight = jQuery(element).height();
        var tbbounds = 0.51*elemheight* (this.endval - this.startval) / elemwidth;
        this.board = JXG.JSXGraph.initBoard(elemname, {boundingbox: [this.startval, tbbounds, this.endval, -tbbounds], axis:false, keepaspectratio: true, grid: false, showNavigation: false, showCopyright: false});
        jQuery('#'+elemname+' svg').css('width','100%');
        JXG.removeEvent(this.board.containerObj, 'mousewheel', this.board.mouseWheelListener, this.board);
        JXG.removeEvent(this.board.containerObj, 'DOMMouseScroll', this.board.mouseWheelListener, this.board);
        this.axis = this.board.create('axis', [[0,0],[1,0]], {strokeColor: 'red', shadow: true, fixed: true, ticks: false, grid: false, name:'axis'});
    //    this.axis.removeAllTicks();
        this.board.createElement('ticks',[this.axis,5], {minorTicks:4, majorHeight:30, minorHeight: 10, strokeWidth: 2, drawZero:true});
    //    this.origo = this.board.create('point',[0,0], {strokeColor: 'black', fillColor: 'black', face: 'o', size: 2, shadow: true, name: 'O', fixed: true});
    //    for (var i = 0; i < this.points.length; i++){
        for (var name in this.points){
            var coords = [this.points[name].xcoord,0];
            var isfixed = true;
            if (this.points[name].ptype == 'glider'){
                coords.push(this.axis);
                isfixed = false;
            }
            this.pointobjects[name] = this.board.create(
                this.points[name].ptype,
                coords,
                {
                    strokeColor: this.points[name].color,
                    fillColor: this.points[name].fillcolor,
                    face: this.points[name].face,
                    shadow: true,
                    name: name,
                    fixed: isfixed
                }
            );
            (this.points[name].ptype === 'glider' &&
             this.pointobjects[name].on('up', function(event){
                var name = this.name;
                $(nline.board.containerObj).trigger('emnl_glidermoved', [name]);
            }));
        }
        for (var rname in this.ranges){
            var rfrom = this.ranges[rname].from.replace(/,/g, '.');
            var rto = this.ranges[rname].to.replace(/,/g, '.');
            var rtype = this.ranges[rname].rtype;
            var ypos = 0;
            var firstarr = false;
            var lastarr = false;
            var swidth = 4;
            if (rtype == 'length'){
                ypos = -0.4*tbbounds;
                firstarr = true;
                lastarr = true;
                swidth = 2;
            }
            var fromxpos = (''+parseFloat(rfrom) == rfrom ? parseFloat(rfrom) : 'X('+rfrom+')');
            var toxpos = (''+parseFloat(rto) == rto ? parseFloat(rto) : 'X('+rto+')');
            var coordsfrom = [fromxpos, ypos];
            var coordsto = [toxpos, ypos];
            this.rangeobjects[rname] = this.board.create('line', [coordsfrom, coordsto], {strokeColor: this.ranges[rname].color, name: rname, straightFirst: false, straightLast: false, strokeWidth: swidth, shadow: true, firstArrow: firstarr, lastArrow: lastarr, fixed: true});
            var nlist = this;
            if (rtype == 'length'){
                var textxpos = (''+parseFloat(rfrom) == rfrom || ''+parseFloat(rto) == rto ? (parseFloat(rfrom) + parseFloat(rto))/2 : '(X('+rfrom+')+X('+rto+'))/2');
                this.textobjects[rname+'_label'] = this.board.create(
                    'text', [
                        textxpos,
                        2*ypos,
                        function(){
                            this.rfrom = this.rfrom || rfrom;
                            this.rto = this.rto || rto;
                            return (Math.round(10*Math.abs(nlist.pointobjects[this.rfrom].X() - nlist.pointobjects[this.rto].X())))/10;
                        }
                    ],
                    {display: 'html'}
                );
                this.textobjects[rname+'_label'].rfrom = rfrom;
                this.textobjects[rname+'_label'].rto = rto;
            }
        }
        return true;
    }
    
    EmathNumberline.prototype.getobject = function(){
        /*****************
         * Return data of numberline.
         *****************/
        var jsondata = {};
        jsondata.text = this.text;
        jsondata.startval = this.startval;
        jsondata.endval = this.endval;
        jsondata.points = this.points;
        jsondata.ranges = this.ranges;
        return JSON.parse(JSON.stringify(jsondata));
    }
    
    EmathNumberline.prototype.setdata = function(setobj){
        /*****************
         * Set data of numberline.
         *****************/
        if (typeof(setobj) == 'string'){
            try {
                setobj = JSON.parse(setobj);
            } catch (e) {
                return false;
            }
        }
        if (typeof(setobj) == 'object' &&
            typeof(setobj.text) == 'string' &&
            typeof(setobj.startval) == 'number' &&
            typeof(setobj.endval) == 'number' &&
            typeof(setobj.points) == 'object'){
            this.text = setobj.text;
            this.startval = setobj.startval;
            this.endval = setobj.endval;
            this.points = jQuery.extend({},setobj.points);
            return true;
        } else {
            return false;
        }
    }
    
    EmathNumberline.strings = {
        style: [
            '.emathnumberline {height: 70px;}',
        ].join('\n')
    }
    
})(jQuery);



if (typeof(config) !== 'undefined' && typeof(config.macros) !== 'undefined'){
    // Create macro for TiddlyWiki
    config.macros.ebooknumberline = {
        /**********************************************
         * marcro for numberline
         **********************************************/
        handler: function(place, macroName, params, wikifier, paramString, tiddler)
        {
            if (params.length < 1){
                wikify('{{sdalert{ebooknumberline: Missing numberline name.}}}',place);
                return false;
            }
            var savehere = false;
            var tiddlerName = params[0];
            var nlineName = 'nline0';
            if (params.length == 2 && params[1] == 'savehere'){
                savehere = true;
                nlineName = tiddlerName;
                tiddlerName = tiddler.title;
            }
            if (store.tiddlerExists(tiddlerName)){
                var allnlinedata = DataTiddler.getData(tiddlerName, "nline", {"nline0": {"startval": -10, "endval": 10, "points":[], "text": ""}});
                var nlinedata = allnlinedata[nlineName];
                var nline = new EmathbookNumberline();
                nline.init(nlinedata.startval, nlinedata.endval);
                for (var name in nlinedata.points){
                    nline.addPoint(name, nlinedata.points[name].xcoord, nlinedata.points[name].color, nlinedata.points[name].fillcolor, nlinedata.points[name].face, nlinedata.points[name].ptype);
                }
                for (var name in nlinedata.ranges){
                    nline.addRange(name, nlinedata.ranges[name].from,  nlinedata.ranges[name].to, nlinedata.ranges[name].color, nlinedata.ranges[name].rtype);
                }
                wikify('{{emathbooknumberlinecontainer{\n}}}{{emathbooknumberlinecaption{'+nlinedata.text+'}}}', place);
                nline.create(jQuery(place).find('.emathbooknumberlinecontainer:last')[0]);
            } else {
                wikify("{{sdalert{ebooknumberline: missing tiddler " + tiddlerName + "}}}", place);
                return false;
            }
        }
    }
}

//}}}