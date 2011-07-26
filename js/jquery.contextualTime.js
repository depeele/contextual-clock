/** @file
 *
 *  Using a <canvas>, render the month/day in terms of the earth's rotation
 *  around the sun and the moon's rotation around the earth respectively.
 */
(function($) {

var PI2     = Math.PI*2;

$.fn.contextualTime = function(options) {
    options = options || {};

    return this.each(function() {
        var $el = $(this);
        options.canvas = $el;

        $el.data('contextualTime', new $.ContextualTime( options ));
    });
};

$.ContextualTime = function(options) {
    return this.init(options);
};

$.ContextualTime.prototype = {
    options: {
        latitude:       null,
        longitude:      null,

        ctx:            null,       // The 2d context of the target canvas
        canvas:         '#canvas',  // OR a DOM selector for the target canvas

        width:          150,
        height:         150,

        centerX:        75,
        centerY:        70,

        radius:         45,
  
        sun:    {
            src:        'images/sun.png',
            size:       40
        },

        /* If non-null, the number of milliseconds to use for an interval
         * timer.  If this is null, the caller is expected to invoke
         * this.render() at a regular interval.
         */
        interval:   null,
        test:       false
    },

    /** @brief  Initialize this instance
     *  @param  options     Initialization options.
     *
     *  @return this
     */
    init: function(options) {
        this.options = $.extend(true, {}, this.options, options);
        this.$info   = $('#info .Time');

        var opts    = this.options;

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

        // Create the needed images
        opts.sun.img   = new Image(); opts.sun.img.src   = opts.sun.src;

        if (opts.interval > 0)
        {
            var self    = this;
            setInterval(function() {
                var now = new Date();

                self.render( now );
            }, opts.interval);
        }

        return this;
    },

    geoStr: function() {
        var self        = this;
        var opts        = self.options;

        if ((opts.longitude === null) || (opts.latitude === null))
        {
            return 'Not yet set';
        }

        var latitude    = opts.latitude;
        var longitude   = opts.longitude;
        var latStr      = 'N';
        var longStr     = 'W';

        if (latitude < 0)
        {
            latitude = -latitude;
            latStr   = 'S';
        }
        if (longitude < 0)
        {
            longitude = -longitude;
            longStr   = 'E';
        }

        return   latitude.toPrecision(4)  +"&deg; "+ latStr +', '
               + longitude.toPrecision(4) +"&deg; "+ longStr;
    },

    setCoords: function( latitude, longitude) {
        var self        = this;
        var opts        = self.options;

        opts.latitude  = latitude;
        opts.longitude = longitude;

        return this;
    },

    /** @brief  Convert a floating point hour value (0.00 .. 23.99)
     *          into radians (-PI/4 .. +3*PI/4)
     *  @param  hour    The floating point hour value.
     *
     *  @return The equivalent radian value.
     */
    h2rad: function( hour ) {
        return -Math.PI / 2 + (hour / 24.0) * PI2;
    },

    /** @brief given a Date instance, render this MonthDate clock
     *  @param  now     The Date instance to render.
     *
     *  @return this for a fluent interface.
     */
    render: function( now ) {
        var self        = this;
        var opts        = self.options;
        var offset      = -now.getTimezoneOffset() / 60;
        var hourNow     = now.getHours()
                        + (now.getMinutes() / 60)
                        + (now.getSeconds() / 3600);
        var ctx         = opts.ctx;
        var srss        = new SunriseSunset(now.getFullYear(),
                                            now.getMonth() + 1,
                                            now.getDate()  + 1,
                                            opts.latitude,
                                            opts.longitude);
        var rise        = srss.sunriseLocalHours(offset);
        var set         = srss.sunsetLocalHours(offset);
        var idex;

        if (hourNow > set)
        {
            // Use tomorrow
            var tomorrow    = new Date( now.getTime() + 1000 * 60 * 60 * 24 );

            srss = new SunriseSunset(tomorrow.getFullYear(),
                                     tomorrow.getMonth() + 1,
                                     tomorrow.getDate()  + 1,
                                     opts.latitude,
                                     opts.longitude);
            rise = srss.sunriseLocalHours(offset);
            set  = srss.sunsetLocalHours(offset);
        }

        // Handle the solstice
        if (isNaN(rise))    {   rise = 0.00; }
        if (isNaN(set))     {   set  = 0.00; }

        self.$info.html(  'Location: '+ self.geoStr() +'<br />'
                        + 'Hour Now: '+ hourNow +'<br />'
                        + 'Local: '+ rise +' - '+ set);
  
        ctx.globalCompositeOperation = 'destination-over';
      
        ctx.save(); // {
         ctx.fillStyle   = 'rgba(0,0,0,0.5)';
         ctx.strokeStyle = 'rgba(0,153,255,0.75)';
         ctx.lineCap     = 'round';
         ctx.lineWidth   = 3;

          // clear canvas
         /*
         ctx.clearRect(0, 0,
                       opts.width, opts.height);
         // */

         /* Highlight the drawing area
         ctx.fillStyle = 'rgba(255,255,255,0.5)';
         ctx.fillRect(0, 0,
                      opts.width, opts.height);
         // */

         ctx.translate(opts.centerX, opts.centerY);
         
         // Hour marks/ticks
         ctx.save();   // {
          ctx.beginPath();
          //ctx.rotate(-(Math.PI / 2.4));
          ctx.rotate( (PI2 / 24) + (PI2 / 4));
          for (idex = 0; idex < 24; idex++)
          {
             var size = ((idex % 3)
                            ? 0.5   //(idex / 12) + 0.1
                            : 3);   //((idex == 0) ? 5 : 1);

             ctx.rotate( -(PI2 / 24) );
             ctx.moveTo( opts.radius - size, 0);
             ctx.lineTo( opts.radius + size, 0);
          }
          ctx.stroke();
         ctx.restore();    // }

         // Hour labels
         ctx.save();   // {
          ctx.fillStyle   = 'rgba(255,255,255,0.5)';
          //ctx.fillStyle = 'rgba(0,153,255,0.8)';
          ctx.textAlign = 'center';
          ctx.font = 'bold 17px sans-serif';

          for (idex = 0; idex < 24; idex += 3)
          {
              var aTime = this.h2rad(idex);
              var str   = idex;
              switch (idex)
              {
              case 0:
                str = 'midnite';
                break;

              case 12:
                str = 'noon';
                break;

              default:
                var ap;
                if (idex > 12)
                {
                    str = (idex - 12);
                    ap  = 'p';
                }
                else
                {
                    str = idex;
                    ap  = 'a';
                }
                if (str !== 6)
                {
                    str += ap;
                }
              }

              ctx.fillText(str,
                           (opts.radius + 20) * Math.cos(  aTime ),
                           (opts.radius + 20) * Math.sin( -aTime ) + 10);
          }
         ctx.restore();    // }

         // Sunrise / Sunset -- lines
         var aRise = this.h2rad(rise);
         var aSet  = this.h2rad(set);
         ctx.lineWidth   = 2;
         ctx.save();   // {
          ctx.moveTo(0,0);
          ctx.lineTo( opts.radius * Math.cos( aRise ),
                      opts.radius * Math.sin( -aRise ));
          ctx.moveTo(0,0);
          ctx.lineTo( opts.radius * Math.cos( aSet ),
                      opts.radius * Math.sin( -aSet ));

          ctx.stroke();
         ctx.restore();    // }

         // Sunrise / Sunset -- nighttime
         ctx.save();   // {
          ctx.beginPath();
          ctx.moveTo(0,0);
          ctx.arc(0,0, opts.radius + (opts.sun.size / 2), -aSet, -aRise, true);
          ctx.closePath();
          ctx.fill();
         ctx.restore();    // }

         // Sun
         ctx.save();   // {
          var a = this.h2rad(hourNow);
          ctx.translate( opts.radius * Math.cos( a ),
                         opts.radius * Math.sin( -a ));
          ctx.drawImage(opts.sun.img,
                        -(opts.sun.size/2), -(opts.sun.size/2),
                          opts.sun.size,      opts.sun.size);
         ctx.restore();    // }

         // Sunrise / Sunset -- daytime
         /*
         ctx.save();   // {
          ctx.beginPath();
          ctx.moveTo(0,0);
          ctx.arc(0,0, opts.radius / 2, -aSet,  -aRise, false);
          ctx.closePath();

          if (false)    //daytimeSun !== undefined)
          {
              ctx.clip();
              ctx.drawImage(opts.sun.img,
                            -(opts.sun.size), -(opts.sun.size),
                              opts.sun.size * 2,      opts.sun.size * 2);
          }
          else
          {
            ctx.fillStyle   = 'rgba(255,255,255,0.88)';
            ctx.fill();
          }
         ctx.restore();    // }
         // */


         // Clock outline
         ctx.save();   // {
          ctx.beginPath();

          // Just the sunrise - sunset area
          ctx.arc(0,0, opts.radius, -aSet,  -aRise, false);
          /*
          ctx.arc(0, 0, opts.radius,
                  0, Math.PI*2, false);
          // */
          ctx.stroke();
         ctx.restore();    // }
        ctx.restore();  // }

        return this;
    }
};

}(jQuery));
