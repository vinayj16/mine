/**
 * jQuery Plugin Safety Wrapper
 * Prevents errors when jQuery plugins are not loaded
 */

(function() {
    'use strict';

    const $ = jQuery;

    // Store original jQuery functions
    const originalFn = $.fn;

    // Create safe wrappers for plugins that might not be loaded
    const pluginWrappers = [
        'owlCarousel',
        'counterUp',
        'select2',
        'datetimepicker',
        'mask',
        'tooltip',
        'popover',
        'theiaStickySidebar',
        'countdown'
    ];

    // Wrap each plugin
    pluginWrappers.forEach(plugin => {
        if (!originalFn[plugin]) {
            originalFn[plugin] = function(options) {
                console.warn(`Plugin "${plugin}" is not loaded, skipping initialization`);
                return this;
            };
        }
    });

    // Also wrap common initialization patterns
    const originalInit = window.addEventListener;
    if (originalInit) {
        window.addEventListener('error', function(e) {
            if (e.message && e.message.includes('is not a function')) {
                console.warn('jQuery plugin not found:', e);
                e.preventDefault();
            }
        }, true);
    }
})();
