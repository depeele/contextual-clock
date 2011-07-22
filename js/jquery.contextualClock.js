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
        this.$time  = opts.canvas.contextualTime({
                        offsetX:    (dOpts.width * dOpts.scale * 2)
                      });
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

        opts.location = location;

        /* Look through the incoming location data for those that have
         * a type of:
         *      'locality'  - city/state
         *
         * From this, pull the address components:
         *      'locality'                      - city
         *      'administrative_area_level_1'   - state
         */
        $.each(opts.location, function() {
            var addr       = this;
            var addrAr     = [];
            if (addr.types[0] !== 'locality') { return; }

            $.each(addr.address_components, function() {
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
                return false;
            }
        });
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

        // Render the contextual date/time
        ctx.globalAlpha = 0.9;
        ctx.save(); // {
         ctx.translate(20, 2);
         this.date.render( now );
        ctx.restore();  // }

        ctx.save(); // {
         ctx.translate( -(tOpts.radius * tOpts.scale), 0);
         this.time.render( now );
        ctx.restore();  // }

        ctx.globalAlpha = 1.0;

        // Render the textual date/time information (foreground)
        ctx.save(); // {
         ctx.translate(0, dOpts.height * dOpts.scale);
         ctx.textAlign = 'left';

         // Render the date
         var str    = now.getFullYear();
         var x      = 5;
         var y      = 42;
         var dim;

         ctx.font   = 'bold 32pt/34pt sans-serif';
         dim1       = ctx.measureText(str);

         /* Clear the textual area (include additional vertical space in order
          * to clear the 1's digit of the time).
          */
         ctx.clearRect(0, 0, dim1.width + x, y*2 + 2);

         /* Highlight the drawing area
         ctx.fillStyle = 'rgba(255,255,255,0.5)';
         ctx.fillRect(0, 0,  dim1.width + x, y*2 + 2);
         // */

         ctx.fillStyle = 'rgba(255,255,255,0.2)';
         ctx.fillText(str, x, y);

         ctx.fillStyle = 'rgba(255,255,255,0.8)';
         ctx.font      = 'bold 10pt/12pt sans-serif';
         ctx.textAlign = 'center';
         str = opts.months[ now.getMonth() ] +' '+ now.getDate();
         var dim2   = ctx.measureText(str);

         ctx.fillText( str, x + (dim1.width / 2), y - 28, dim1.width);
        ctx.restore();  // }

        // Render any location information
        if (opts.locationStr !== null)
        {
            ctx.save();    // {
             ctx.translate(0, dOpts.height * dOpts.scale + y);

             str           = opts.locationStr;
             ctx.font      = '8pt/10pt sans-serif';
             ctx.textAlign = 'center';
             dim2          = ctx.measureText(str);

             // Clear the textual area
             ctx.clearRect(0, 0, dim1.width + x, y + 2);

             /* Highlight the drawing area
             ctx.fillStyle = 'rgba(255,255,255,0.5)';
             ctx.fillRect(0, 0,  dim1.width + x, y + 2);
             // */

             ctx.fillStyle = 'rgba(255,255,255,0.4)';
             ctx.fillText( str, x + (dim1.width / 2), y - 8);

            ctx.restore(); // }
        }

        // Render the textual date/time information (foreground)
        ctx.save(); // {
         ctx.translate(tOpts.width * tOpts.scale - 25,
                       tOpts.height * tOpts.scale - 2);

         // Render the time
         var hour   = now.getHours();
         var ap     = 'am';
         x = dim1.width + 25;
         y = 30;
         if (hour >= 12)        { ap = 'pm'; hour -= (hour === 12 ? 0 : 12); }
         else if (hour === 0)   { hour = 12; }
         
         str = self.padString(hour, 2, ' ')
             +      ':'+ self.padString(now.getMinutes());
         ctx.font      = 'bold 36pt/38pt sans-serif';
         ctx.textAlign = 'right';
         dim2 = ctx.measureText(str);

         /* Clear the textual area (slightly offset so we don't clear the year)
          * AND clear the am/pm area
          */
         ctx.clearRect(15, 0, x, y + 10);

         /* Highlight the drawing area
         ctx.fillStyle = 'rgba(255,255,255,0.5)';
         ctx.fillRect(15, 0,  x, y + 10);
         // */

         ctx.fillStyle = 'rgba(255,255,255,0.8)';
         ctx.fillText( str, x, y );

         y += 7;
         x -= 7;
         ctx.font      = 'bold 8pt/10pt sans-serif';
         ctx.textAlign = 'left';
         ctx.fillStyle = 'rgba(255,255,255,0.5)';
         ctx.fillText( ap, x, y );

        ctx.restore();  // }

        // Perform the final fill (background)
        /*
        ctx.save(); // {
         ctx.strokeStyle = 'rgba(0,153,255,0.4)';
         ctx.lineWidth   = 5;

         ctx.fillRect(2, 2,
                      tOpts.offsetX + tOpts.width - 2,
                      tOpts.offsetY + tOpts.height - 2);

         ctx.strokeRect(0, 0,
                        tOpts.offsetX + tOpts.width,
                        tOpts.offsetY + tOpts.height);

        ctx.restore();  // }
        // */
      
        return this;
    }
};

}(jQuery));