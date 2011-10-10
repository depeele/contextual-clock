/** @file
 *
 *  Using a <canvas>, render the month/day in terms of the earth's rotation
 *  around the sun and the moon's rotation around the earth respectively.
 */
(function($) {

$.fn.contextualClock = function(options) {
    options = options || {};

    return this.each(function() {
        var $el = $(this);
        options.canvas = $el;

        $el.data('contextualClock', new $.ContextualClock( options ));
    });
};

$.ContextualClock = function(options) {
    return this.init(options);
};

$.ContextualClock.prototype = {
    options: {
        latitude:       null,   //38.9278,
        longitude:      null,   //-77.0136,
        location:       null,
        locationStr:    null,
        /*
        location:       [
            {},
            {"address_components":[{"long_name":"Children's Hospital","short_name":"Children's Hospital","types":["point_of_interest","establishment"]},{"long_name":"111","short_name":"111","types":["street_number"]},{"long_name":"Michigan Ave NW","short_name":"Michigan Ave NW","types":["route"]},{"long_name":"Washington D.C.","short_name":"Washington D.C.","types":["locality","political"]},{"long_name":"District of Columbia","short_name":"DC","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]},{"long_name":"20010","short_name":"20010","types":["postal_code"]}],"formatted_address":"Children's Hospital, 111 Michigan Ave NW, Washington D.C., DC 20010, USA","geometry":{"location":{"Ka":38.9276274,"La":-77.0141193},"location_type":"APPROXIMATE","viewport":{"pa":{"b":38.92447977931983,"d":38.93077502068017},"W":{"d":-77.01726692068019,"b":-77.01097167931982}}},"types":["point_of_interest","airport","airport","establishment"]},
            {"address_components":[{"long_name":"Washington DC","short_name":"Washington DC","types":["locality","political"]},{"long_name":"Hanover","short_name":"Hanover","types":["administrative_area_level_3","political"]},{"long_name":"Anne Arundel","short_name":"Anne Arundel","types":["administrative_area_level_2","political"]},{"long_name":"Washington DC","short_name":"DC","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"Fort Meade, MD, USA","geometry":{"bounds":{"pa":{"b":39.088709,"d":39.1306079},"W":{"d":-76.77574600000003,"b":-76.71329100000003}},"location":{"Ka":39.1088867,"La":-76.74326450000001},"location_type":"APPROXIMATE","viewport":{"pa":{"b":39.088709,"d":39.1306079},"W":{"d":-76.77574600000003,"b":-76.71329100000003}}},"types":["locality","political"]},
            {"address_components":[{"long_name":"Fort Meade","short_name":"Fort Meade","types":["locality","political"]},{"long_name":"Hanover","short_name":"Hanover","types":["administrative_area_level_3","political"]},{"long_name":"Anne Arundel","short_name":"Anne Arundel","types":["administrative_area_level_2","political"]},{"long_name":"Maryland","short_name":"MD","types":["administrative_area_level_1","political"]},{"long_name":"United States","short_name":"US","types":["country","political"]}],"formatted_address":"Fort Meade, MD, USA","geometry":{"bounds":{"pa":{"b":39.088709,"d":39.1306079},"W":{"d":-76.77574600000003,"b":-76.71329100000003}},"location":{"Ka":39.1088867,"La":-76.74326450000001},"location_type":"APPROXIMATE","viewport":{"pa":{"b":39.088709,"d":39.1306079},"W":{"d":-76.77574600000003,"b":-76.71329100000003}}},"types":["locality","political"]}
        ],
        // */

        ctx:            null,       // The 2d context of the target canvas
        canvas:         '#canvas',  // OR a DOM selector for the target canvas

        months:         [ 'january', 'february', 'march',
                          'april',   'may',      'june',
                          'july',    'august',   'september',
                          'october', 'november', 'december' ],

        /* If non-null, the number of milliseconds to use for an interval
         * timer.  If this is null, the caller is expected to invoke
         * this.render() at a regular interval.
         */
        interval:       null,
        test:           false
    },

    /** @brief  Initialize this instance
     *  @param  options     Initialization options.
     *
     *  @return this
     */
    init: function(options) {
        this.options = $.extend(true, {}, this.options, options);
        var opts     = this.options;
        
        this.$info   = $('#info');


        if (opts.ctx === null)
        {
            if (opts.canvas.jquery)
            {
                opts.ctx = opts.canvas[0].getContext('2d');
            }
            else
            {
                opts.ctx = opts.canvas.getContext('2d');
            }
        }

        // Initialize the canvas size to match the css-specified size
        opts.canvas[0].height = opts.canvas.height();
        opts.canvas[0].width  = opts.canvas.width();


        this.$date  = opts.canvas.contextualDate();
        this.date   = opts.canvas.data('contextualDate');
        var dOpts   = this.date.options;

        /* Offset the contextualTime widget by the full width of the
         * contextualTime widget.
         */
        this.$time  = opts.canvas.contextualTime();
        this.time   = opts.canvas.data('contextualTime');

        if (opts.interval > 0)
        {
            var self    = this;
            var now;
            if (opts.test === true)
            {
                now = new Date();
                now.setDate(1);
                now.setMonth(0);
                now.setHours(0);
                now.setMinutes(0);
                now.setSeconds(0);
            }

            //self.render( new Date() );
            // /*
            setInterval(function() {
                if (opts.test !== true)
                {
                    now = new Date();
                }

                self.render( now );

                if (opts.test === true)
                {
                    now.setDate( now.getDate() + 1 );
                    //now.setHours( now.getHours() + 1 );
                    now.setMinutes( now.getMinutes() + 5 );
                }

            }, opts.interval);
            // */
        }

        if (opts.latitude !== null)
        {
            this.setCoords(opts.latitude, opts.longitude);
        }

        return this;
    },

    /** @brief  Generate a string representing the latitude/longitued.
     *
     *  @return The string.
     */
    geoStr: function() {
        return this.time.geoStr();
    },

    /** @brief  Establish the latitude and longitude.
     *  @param  latitude    The latitude;
     *  @param  longitude   The longtitude;
     */
    setCoords: function( latitude, longitude ) {
        var self    = this;
        var opts    = self.options;

        this.time.setCoords( latitude, longitude );

        if (opts.location === null)
        {
            window._googleMaps_loaded = function() {
                opts.geocoder = new google.maps.Geocoder();
                opts.latlng   = new google.maps.LatLng(latitude, longitude);

                opts.geocoder
                    //.geocode({'latLng': opts.latlng},
                    .geocode({location: opts.latlng},
                             function(results, status) {
                                if (status !== google.maps.GeocoderStatus.OK)
                                {
                                    return;
                                }
                                self.setLocation(results);
                    });
            };

            // Load the google maps API
            $('<script />')
                .attr('type','text/javascript')
                .attr('src', 'https://maps.googleapis.com/maps/api/js'
                                    + '?sensor=false'
                                    + '&callback=_googleMaps_loaded')
                .appendTo('body');
        }


        return this;
    },

    /** @brief  Set the location from the google maps API.
     *  @param  location    The google maps API location result.
     *
     */
    setLocation: function( location ) {
        var self    = this;
        var opts    = self.options;
        var $info   = self.$info.find('.Geolocation');

        opts.location = location;

        /* Look through the incoming location data for those that have
         * a type of:
         *      'locality'
         *   or 'street_address'
         *
         * From this, pull the address components:
         *      'locality'                      - city
         *      'administrative_area_level_1'   - state
         */
        $info.empty();
        opts.locationStr = '';
        var choices = [];
        var pref    = 0;
        $.each(opts.location, function() {
            var addr       = this;
            var $div;
            
            $div = $('<div>'+ addr.formatted_address +'</div>')
                        .addClass('address');
            $info.append($div);
            $.each(addr.types, function(idex) {
                var type = this.toString();
                if ((type === 'locality') ||
                    (type === 'street_address'))
                {
                    if (type === 'locality') { pref = choices.length; }
                    choices.push(addr);
                }

                $div = $('<div>type #'+ idex +':'+ this +'</div>')
                            .addClass('type');

                $info.append($div);
            });
        });

        if (choices.length > 0)
        {
            var addrAr     = [];
            $.each(choices[pref].address_components, function() {
                switch (this.types[0])
                {
                case 'locality':
                case 'administrative_area_level_1':
                    if (this.short_name !== 'DC')
                    {
                        addrAr.push(this.short_name);
                    }
                    break; 
                }
            });

            if (addrAr.length > 0)
            {
                opts.locationStr = addrAr.join(', ');
            }
        }
    },

    /** @brief  Left pad the provided string to the specified number of
     *          characters using the provided padding character.
     *  @param  str         The string to pad;
     *  @param  numChars    The total number of charcters desired [ 2 ];
     *  @param  padChar     The desired padding character         [ '0' ];
     *
     *  @return A new, padded string.
     */
    padString: function(str, numChars, padChar) {
        numChars = numChars || 2;
        padChar  = padChar  || '0';

        // Ensure 'str' is actually a string
        str = ''+ str;

        while (str.length < numChars)
        {
            str = padChar + str;
        }

        return str;
    },

    /** @brief  Render the textual date.
     *  @param  now     The Date instance to render.
     *  @param  fontSize    The font size for Date (integer, in pixels).
     *                      The month will be .3 of this;
     *
     *  @return this for a fluent interface.
     */
    renderDate: function( now, fontSize ) {
        var self    = this;
        var opts    = self.options;
        var ctx     = opts.ctx;

        ctx.save(); // {
         ctx.textAlign = 'left';

         // Render the date
         var str    = now.getFullYear();
         ctx.font   = 'bold '+ fontSize +'px sans-serif';
         self.dim.year = ctx.measureText(str);

         /* Clear the textual area (include additional vertical space in order
          * to clear the 1's digit of the time).
         ctx.clearRect(0, 0, self.dim.year.width + 15, fontSize*2 + 2);
          */

         /* Highlight the drawing area
         ctx.fillStyle = 'rgba(255,255,255,0.5)';
         ctx.fillRect(0, 0,  self.dim.year.width + 15, fontSize*2 + 2);
         // */

         // Draw the year
         ctx.fillStyle = 'rgba(255,255,255,0.25)';
         ctx.fillText(str, 0, fontSize);

         // Draw the month
         var mFont  = Math.floor(fontSize * 0.3);

         ctx.fillStyle = 'rgba(255,255,255,0.8)';
         ctx.font      = 'bold '+ mFont +'px sans-serif';
         ctx.textAlign = 'center';
         str = opts.months[ now.getMonth() ] +' '+ now.getDate();
         self.dim.month = ctx.measureText(str);

         ctx.fillText( str,
                       (self.dim.year.width / 2),
                       fontSize - ((fontSize / 2) + (mFont / 2)),
                       self.dim.year.width);
        ctx.restore();  // }
    },

    /** @brief  Render the textual location.
     *  @param  fontSize    The font size (integer, in pixels).
     *
     *  @return this for a fluent interface.
     */
    renderLocation: function( fontSize ) {
        var self    = this;
        var opts    = self.options;
        var ctx     = opts.ctx;

        if (opts.locationStr === null)
        {
            return;
        }

        ctx.save();    // {
         // Render the location
         var str    = opts.locationStr;

         ctx.font          = 'bold '+ fontSize +'px sans-serif';
         ctx.textAlign     = 'center';
         self.dim.location = ctx.measureText(str);

         /* Clear the textual area
         ctx.clearRect(0, 0, self.dim.year.width, fontSize + 2);
         // */

         /* Highlight the drawing area
         ctx.fillStyle = 'rgba(255,255,255,0.5)';
         ctx.fillRect(0, 0,  self.dim.year.width, fontSize + 2);
         // */

         ctx.fillStyle = 'rgba(255,255,255,0.4)';
         ctx.fillText( str, (self.dim.year.width / 2), fontSize);

        ctx.restore(); // }
    },

    /** @brief  Render the textual time.
     *  @param  now     The Date instance to render.
     *  @param  x       The x offset;
     *  @param  y       The y offset;
     *
     *  @return this for a fluent interface.
     */
    renderTime: function( now, fontSize ) {
        var self    = this;
        var opts    = self.options;
        var ctx     = opts.ctx;
        var width   = fontSize * 5;

        ctx.save(); // {
         // Render the time
         var hour   = now.getHours();
         var ap     = 'am';
         var apFont = Math.floor(fontSize * 0.25);

         if (hour >= 12)        { ap = 'pm'; hour -= (hour === 12 ? 0 : 12); }
         else if (hour === 0)   { hour = 12; }
         
         var str = self.padString(hour, 2, ' ')
                 +      ':'+ self.padString(now.getMinutes());

         ctx.font      = 'bold '+ fontSize +'px sans-serif';
         self.dim.time = ctx.measureText(str);

         /* Clear the textual area (slightly offset so we don't clear the year)
          * AND clear the am/pm area
         ctx.clearRect(15, -apFont,
                       self.dim.time.width + (apFont*2),
                       fontSize + 10);
          */

         /* Highlight the drawing area
         ctx.fillStyle = 'rgba(255,255,255,0.5)';
         ctx.fillRect(15, -apFont,
                       self.dim.time.width + (apFont*2),
                       fontSize + 10);
         // */

         ctx.fillStyle = 'rgba(255,255,255,0.8)';
         ctx.textAlign = 'right';
         ctx.fillText( str, self.dim.year.width + 35, (fontSize * 0.75) );

         ctx.font      = 'bold '+ apFont +'px sans-serif';
         ctx.fillStyle = 'rgba(255,255,255,0.5)';

         self.dim.ap   = ctx.measureText(ap);

         ctx.fillText( ap,
                       self.dim.year.width + 40,
                       (fontSize * 0.75) + (apFont * 0.75) + 2);
                        /*
                       self.dim.time.width + 2,
                       fontSize - (apFont / 2));
                        // */

        ctx.restore();  // }
    },

    /** @brief given a Date instance, render this MonthDate clock
     *  @param  now     The Date instance to render.
     *
     *  @return this for a fluent interface.
     */
    render: function( now ) {
        var self    = this;
        var opts    = self.options;
        var ctx     = opts.ctx;
        var dOpts   = this.date.options;
        var tOpts   = this.time.options;
        var height  = opts.canvas[0].height;    //opts.canvas.height();
        var width   = opts.canvas[0].width;     //opts.canvas.width();
        var x       = 5;
        var yFont   = 42;
        var lFont   = 11;
        var tFont   = 52;
        var scale   = 1.0;

        // Initialize the dimensions object
        self.dim = {};

        /********************************************************************
         * Textual renderings
         *
         */
        // clear the entire canvas
        ctx.clearRect(0, 0, width, height);

        // Render the textual date
        ctx.save(); // {
         ctx.globalAlpha = 1.0;
         ctx.translate( 0, (tFont / 2) - (yFont / 2) + 4);

         self.renderDate( now, yFont );
        ctx.restore();  // }

        // Render the textual location
        ctx.save();    // {
         ctx.globalAlpha = 1.0;
         ctx.translate(0, height - (lFont * 1.2));

         self.renderLocation( lFont );
        ctx.restore(); // }

        // Render the textual time
        ctx.save(); // {
         ctx.globalAlpha = 1.0;
         ctx.translate(self.dim.year.width - 4, 0); //(tFont * .25));

         self.renderTime( now, tFont );

        ctx.restore();  // }

        // Render a divider / minute progress / seconds counter
        ctx.save(); // {
         ctx.lineCap     = 'round';

         ctx.translate( 0, (tFont / 2) - (yFont / 2) + yFont + 16);

         ctx.beginPath();
          ctx.strokeStyle = 'rgba(0,153,255,0.35)';
          ctx.lineWidth   = 4;
          ctx.moveTo( 0, 0 );
          ctx.lineTo( width, 0 );
          ctx.stroke();

         // Hour Progress
         var mn = (now.getSeconds() *  1000) +  // seconds in ms
                  (now.getMilliseconds());
         var hr = (now.getMinutes() * 60000) +  // minutes in ms
                  mn;

         ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth   = 2;
          ctx.moveTo( 0, 0 );
          ctx.lineTo( (width * (hr / 3600000)), 0);
          ctx.stroke();

         // Minute Progress
         ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth   = 4;
          ctx.moveTo( 0, 2 );
          ctx.lineTo( (width * (mn / 60000)), 2 );
          ctx.stroke();


        ctx.restore();  // }

        /********************************************************************
         * Contextual renderings
         *
         */

        // Render the contextual date
        // /*
        ctx.save(); // {
         scale  = 0.5;

         ctx.translate((self.dim.year.width / 2) - ((dOpts.width / 2) * scale),
                       yFont + (tFont / 4) + 16);
         ctx.scale(scale, scale);

         //ctx.globalAlpha = 0.9;
         this.date.render( now );
        ctx.restore();  // }

        // Render the contextual time
        ctx.save(); // {
         scale  = 0.6;

         ctx.globalAlpha = 0.9;
         ctx.translate(width  - (tOpts.width  * scale),
                       height - (tOpts.height * scale));
         ctx.scale(scale, scale);

         this.time.render( now );
        ctx.restore();  // }

        return this;
    }
};

}(jQuery));
