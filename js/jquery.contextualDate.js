/** @file
 *
 *  Using a <canvas>, render the month/day in terms of the earth's rotation
 *  around the sun and the moon's rotation around the earth respectively.
 */
(function($) {

var PI2     = Math.PI*2;

$.fn.contextualDate = function(options) {
    options = options || {};

    return this.each(function() {
        var $el = $(this);
        options.canvas = $el;

        $el.data('contextualDate', new $.ContextualDate( options ));
    });
};

$.ContextualDate = function(options) {
    return this.init(options);
};

$.ContextualDate.prototype = {
    options: {
        ctx:            null,       // The 2d context of the target canvas
        canvas:         '#canvas',  // OR a DOM selector for the target canvas


        canvasWidth:    80,
        canvasHeight:   80,
        offsetX:        0,
        offsetY:        0,
        centerX:        80,
        centerY:        80,
  
        scale:          0.35,

        sun:    {
            src:        'images/sun.png',
            offsetX:    0,
            offsetY:    6,
            size:       90
        },

        earth:  {
            src:        'images/earth.png',
            offset:     50,
            size:       21,
  
            shadow:     38
        },

        moon:   {
            src:        'images/moon.png',
            offset:     15,
            size:       7
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
        this.$info   = $('#info .Date');

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
        opts.earth.img = new Image(); opts.earth.img.src = opts.earth.src;
        opts.moon.img  = new Image(); opts.moon.img.src  = opts.moon.src;

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
            setInterval(function() {
                if (opts.test !== true)
                {
                    now = new Date();
                }

                self.render( now );

                if (opts.test === true)
                {
                    now.setDate( now.getDate() + 1 );
                }

            }, opts.interval);
        }

        return this;
    },

    /** @brief given a Date instance, render this MonthDate clock
     *  @param  now     The Date instance to render.
     *
     *  @return this for a fluent interface.
     */
    render: function( now ) {
        var self        = this;
        var opts        = self.options;
        var year        = now.getFullYear();
        var month       = now.getMonth();
        var day         = now.getDate() - 1;
        var hour        = now.getHours();
        var min         = now.getMinutes();
        var sec         = now.getSeconds();
        var monthLen    = (($.inArray(month, [0,2,4,6,7,9,11]) >= 0)
                            ? 31
                            : (month === 1
                                ? 28
                                : 30));
        var ctx         = opts.ctx;

        self.$info.html(  'year [ '+  year     +' ]<br />'
                        + 'month[ '+ (month+1) +' ], '+ monthLen +' days<br />'
                        + 'day  [ '+ (day+1)   +' ]<br />'
                        + 'hour [ '+ hour      +' ]<br />'
                        + 'min  [ '+ min       +' ]<br />'
                        + 'sec  [ '+ sec       +' ]<br />');

  
        ctx.globalCompositeOperation = 'destination-over';
      
        // clear canvas
        ctx.clearRect(opts.offsetX, opts.offsetY,
                      opts.canvasWidth, opts.canvasHeight);

        ctx.save();
         ctx.scale(opts.scale, opts.scale);
         ctx.translate(opts.centerX, opts.centerY);
      
         ctx.fillStyle   = 'rgba(0,0,0,0.2)';
         ctx.strokeStyle = 'rgba(0,153,255,0.4)';
         ctx.lineWidth   = 5;
         ctx.save();
       
          // Earth
          var nDays = 365;
          ctx.rotate( ((PI2 /             12  ) * month) + // months  / year
                      ((PI2 /          nDays  ) * day)   + // days    / year
                      ((PI2 / (   24 * nDays) ) * hour)  + // hours   / year
                      ((PI2 / ( 1440 * nDays) ) * min)   + // minutes / year
                      ((PI2 / (86400 * nDays) ) * sec)   - // seconds / year
                      (Math.PI / 3) // Back it up to the clock-1 position
          );
          ctx.translate(opts.earth.offset, 0);
       
          // Earth shadow
          ctx.fillRect(0, -(opts.earth.size / 2),
                       opts.earth.shadow, opts.earth.size);
       
          ctx.drawImage(opts.earth.img,
                          -(opts.earth.size / 2),
                          -(opts.earth.size / 2),
                          opts.earth.size, opts.earth.size);
       
          // Moon
          ctx.save();
           nDays = monthLen;
           ctx.rotate( ((PI2 /          nDays  ) * day)   + // days    / month
                       ((PI2 / (   24 * nDays) ) * hour)  + // hours   / month
                       ((PI2 / ( 1440 * nDays) ) * min)   + // minutes / month
                       ((PI2 / (86400 * nDays) ) * sec)   - // seconds / month
                       Math.PI  // Back it up to the clock-12 position
           );

           ctx.translate(opts.moon.offset, 0);
       
           ctx.drawImage(opts.moon.img,
                           -(opts.moon.size / 2),
                           -(opts.moon.size / 2),
                           opts.moon.size, opts.moon.size);
          ctx.restore();
         ctx.restore();
        
         // Earth orbit
         ctx.beginPath();
         ctx.arc(0, 0, opts.earth.offset, 0, Math.PI*2, false);
         ctx.stroke();
       
         // Sun
         ctx.drawImage(opts.sun.img,
                         opts.sun.offsetX - (opts.sun.size / 2),
                         opts.sun.offsetY - (opts.sun.size / 2),
                         opts.sun.size,   opts.sun.size);
      
         /*
         ctx.fillStyle   = 'rgba(0,0,0,1.0)';
         ctx.fillRect(0, 0, opts.canvasWidth, opts.canvasHeight);
         // */
        ctx.restore();
      
        return this;
    }
};

}(jQuery));
