/**
 * React-Safe jQuery Plugin Initialization
 * This script wraps jQuery plugin calls with safety checks
 * to work properly with React's dynamic rendering
 */

(function() {
    'use strict';

    // Wait for jQuery to be available
    if (typeof jQuery === 'undefined') {
        console.warn('jQuery not available for safe initialization');
        return;
    }

    const $ = jQuery;

    // Safe wrapper functions
    const safeInit = {
        // Safe counterUp initialization
        counterUp: function(selector, options) {
            if ($(selector).length > 0 && typeof $.fn.counterUp === 'function') {
                $(selector).counterUp(options);
            }
        },

        // Safe owlCarousel initialization
        owlCarousel: function(selector, options) {
            if ($(selector).length > 0 && typeof $.fn.owlCarousel === 'function') {
                try {
                    $(selector).owlCarousel(options);
                } catch (e) {
                    console.warn('OwlCarousel initialization failed for:', selector, e);
                }
            }
        },

        // Safe select2 initialization
        select2: function(selector, options) {
            if ($(selector).length > 0 && typeof $.fn.select2 === 'function') {
                try {
                    if (options) {
                        $(selector).select2(options);
                    } else {
                        $(selector).select2();
                    }
                } catch (e) {
                    console.warn('Select2 initialization failed for:', selector, e);
                }
            }
        },

        // Safe datetimepicker initialization
        datetimepicker: function(selector, options) {
            if ($(selector).length > 0 && typeof $.fn.datetimepicker === 'function') {
                try {
                    if (options) {
                        $(selector).datetimepicker(options);
                    } else {
                        $(selector).datetimepicker();
                    }
                } catch (e) {
                    console.warn('DateTimePicker initialization failed for:', selector, e);
                }
            }
        }
    };

    // Export to window for use in main-script.js
    window.safeInit = safeInit;

    // Override problematic counterUp calls
    document.addEventListener('DOMContentLoaded', function() {
        if ($('.counter').length > 0 && typeof $.fn.counterUp === 'function') {
            try {
                $('.counter').counterUp({
                    delay: 20,
                    time: 2000
                });
            } catch (e) {
                console.warn('Counter initialization failed:', e);
            }
        }
    });

})();
