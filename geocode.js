'use strict';
window.addEventListener('message', function(event) {
    const data      = event.data;
    const latlng    = new google.maps.LatLng(data.latitude, data.longitude);
    const geocoder  = new google.maps.Geocoder();

    geocoder.geocode({location: latlng}, function(results, status) {
        let   origin    = event.origin;
        const msg       = {status:status, results:results};

        /* :XXX: If we don't JSON.stringify() here, the script fails with
         *       a 'cannot encode object' error.
         */
        event.source.postMessage(JSON.stringify(msg), origin);
    });
});

console.log('geocode.js: loaded');
