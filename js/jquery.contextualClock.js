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
        latitude:       null,
        longitude:      null,

        ctx:            null,       // The 2d context of the target canvas
        canvas:         '#canvas',  // OR a DOM selector for the target canvas

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

        this.$date  = opts.canvas.contextualDate();
        this.date   = opts.canvas.data('contextualDate');
        var dOpts   = this.date.options;

        /* Offset the contextualTime widget by the full width of the
         * contextualTime widget.
         */
        this.$time  = opts.canvas.contextualTime({
                        offsetX: (dOpts.canvasWidth * dOpts.scale * 2)
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
        }

        return this;
    },

    geoStr: function() {
        return this.time.geoStr();
    },

    setCoords: function( longitude, latitude ) {
        this.time.setCoords( longitude, latitude );

        return this;
    },

    /** @brief given a Date instance, render this MonthDate clock
     *  @param  now     The Date instance to render.
     *
     *  @return this for a fluent interface.
     */
    render: function( now ) {
        this.date.render( now );
        this.time.render( now );

        // Perform the final fill
        var to  = this.time.options;
        var ctx = this.options.ctx;
        ctx.save();
         ctx.fillRect(0, 0,
                      to.offsetX + to.canvasWidth,
                      to.offsetY + to.canvasHeight);
        ctx.restore();
      
        return this;
    }
};

}(jQuery));
