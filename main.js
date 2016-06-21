(function($) {
    'use strict';

    var geo = null;

    window.geocode = function(latitude, longitude) {
        let ifr = document.getElementById('geocode');

        if (geo == null) {
            geo = ifr.contentWindow;

        }
        
        const promise = new Promise(function(resolve, reject) {
            window.addEventListener('message', __onMessage);

            if (!ifr.status) {
                ifr._ifrloaded = function() {
                    geo = ifr.contentWindow;
                    __call();
                };

            } else {
                __call();
            }

            function __call() {
                geo.postMessage({latitude:latitude, longitude:longitude}, '*');
            }

            function __onMessage(event) {
                let data    = event.data;

                if (typeof data === 'string') {
                    data = JSON.parse( data );
                }

                window.removeEventListener('message', __onMessage);

                if (data.status !== 'OK') {
                    reject( data );

                } else {
                    resolve( data );

                }
            }
        });

        return promise;
    }

    /** @brief  When our location has been successfully established.
     *  @param  position    Our location.
     */
    function geoSuccess(position) {
        var clock   = $('#canvas').data('contextualClock');

        clock.setCoords(position.coords.latitude,
                        position.coords.longitude);

        $('#status').addClass('success')
                    .html( clock.geoStr() );
                    
        // http://maps.googleapis.com/maps/api/geocode/json?latlng=39.40,-76.94&sensor=true
    }

    /** @brief  When our location has been successfully established.
     *  @param  position    Our location.
     */
    function geoError(msg) {
        $('#status').addClass('error')
                    .html( ($.type(msg) === 'string' ? msg : 'failed') );
    }

    function _ready() {
        geo = document.getElementById('geocode').contentWindow;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(geoSuccess, geoError);

        } else {
            geoError('not supported');

        }

        //$('#canvas').contextualClock({interval:10, test:true});
        $('#canvas').contextualClock({interval:500});
        //$('#canvas').contextualClock({interval:2});
    }

    $(document).ready(function() {
        let ifr = document.getElementById('geocode');

        if (!ifr.status) {
            ifr.onload = function() {
                if (ifr._ifrloaded) { ifr._ifrloaded(); }
            };
        }

        _ready();

        /*
        let iframe  = document.getElementById('geocode');
        iframe.onload = function() { return _ready(); };
        // */

        /*
        $('<iframe/>', {
            id:     'geocode',
            src:    'geocode.html',
            style:  'display:none',
            load:   _ready
        }).appendTo('body');
        // */
    });
}(jQuery));
