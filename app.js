chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        /*
        state:          'normal' | 'fullscreen' | 'maximized' | 'minimized',
        alwaysOnTop:    false,
        focused:        false,
        hidden:         false,
        frame:          {
          type:         'chrome', | 'none'
          color:        activeColor,
          inactiveColor:inactiveColor,
        },
        // */
        frame:      {
            type:           'chrome',
            //color:          '#000000',
            //inactiveColor:  '#000000',
        },
        resizable:  false,
        outerBounds:{
            'width':    256,
            'height':   216
        }
    });
});
