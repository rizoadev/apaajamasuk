/*
 * swipingSideMenu - v.1.0.1
 * https://github.com/trollwinner
 */

(function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports === 'object'
        && typeof module !== 'undefined'
        && typeof require === 'function'
    ) {
        module.exports = factory(require('jquery'));
    } else {
        factory(root.jQuery);
    }
})(this, function ($) {
    'use strict';
    
    var pluginName = 'swipingSideMenu';
    var defaults = {
        toggleElement: '[data-component="swiping-side-menu-toggle"]',
        closeElement: '[data-component="swiping-side-menu-close"]',
        openElement: '[data-component="swiping-side-menu-open"]',
        backdrop: '<div class="swiping-side-menu-backdrop" data-component="swiping-side-menu-close"></div>',
        body: document.body,
        swipeThreshold: 5,
        swipeToggleDuration: 200,
        swipeToggleDistance: 50
    };

    function Plugin(element, options) {
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this.init();
    }

    Plugin.prototype.init = function () {
        this.$backdrop = $(document.createElement('div')).html(this.settings.backdrop).contents();
        this.$element.after(this.$backdrop);
        this.$body = $(this.settings.body);
        this.$toggleElement = $(this.settings.toggleElement);
        this.$closeElement = $(this.settings.closeElement);
        this.$openElement = $(this.settings.openElement);

        this.triggers();
        this.delegating();
        this.dragging();

        if (typeof window.navigator !== 'undefined' && typeof window.navigator.userAgent !== 'undefined') {
            var userAgent = window.navigator.userAgent.toLowerCase();

            // prevent left-to-right swipe - not friendly with prev/next safari history swipe currently
            if (/iphone|ipod|ipad/.test(userAgent) && /safari/.test(userAgent)) {
                this.$element.addClass('is-safari');
            }
        }

        return this;
    };

    Plugin.prototype.open = function () {
        this.$body.addClass('swiping-side-menu-opened');
        this.$element.addClass('opened');
        this.$toggleElement.addClass('active');
        this.$openElement.addClass('active');
        this.$element.trigger('opened.swipingSideMenu');

        return this;
    };

    Plugin.prototype.close = function () {
        this.$body.removeClass('swiping-side-menu-opened');
        this.$element.removeClass('opened');
        this.$toggleElement.removeClass('active');
        this.$openElement.removeClass('active');
        this.$element.trigger('closed.swipingSideMenu');

        return this;
    };

    Plugin.prototype.toggle = function () {
        this.$body.toggleClass('swiping-side-menu-opened');
        this.$element.toggleClass('opened');
        this.$toggleElement.toggleClass('active');
        this.$openElement.toggleClass('active');
        this.$element.trigger('toggled.swipingSideMenu');

        return this;
    };

    Plugin.prototype.isOpened = function () {
        return this.$element.hasClass('opened');
    };

    Plugin.prototype.triggers = function () {
        var self = this;

        self.$element
            .on('close.swipingSideMenu', function () {
                self.close();
            })
            .on('open.swipingSideMenu', function () {
                self.open();
            })
            .on('toggle.swipingSideMenu', function () {
                self.toggle();
            });

        return this;
    };

    Plugin.prototype.delegating = function () {
        var self = this;

        self.$toggleElement.on('click', function (e) {
            e.preventDefault();
            self.$element.removeClass('dragged');
            self.$element.trigger('toggle.swipingSideMenu');
        });

        self.$closeElement.on('click', function (e) {
            e.preventDefault();
            self.$element.removeClass('dragged');
            self.$element.trigger('close.swipingSideMenu');
        });

        self.$openElement.on('click', function (e) {
            e.preventDefault();
            self.$element.removeClass('dragged');
            self.$element.trigger('open.swipingSideMenu');
        });

        return this;
    };

    Plugin.prototype.dragging = function () {
        var self = this;
        var element = this.$element;
        var elementWidth;
        var elementPointer;
        var currentPointer = {};
        var startPointer = {};
        var touchStartDate;

        element
            .add(self.$backdrop)
            .on('touchstart', function (e) {
                self.dragDirection = null;
                touchStartDate = +new Date();
                startPointer.x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
                startPointer.y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
                currentPointer.x = startPointer.x;
                currentPointer.y = startPointer.y;

                elementPointer = element.offset().left - startPointer.x;
                elementWidth = element.outerWidth();
                element.addClass('dragging');

                if (e.target === self.$backdrop[0]) {
                    elementPointer = -elementWidth;
                }
            })
            .on('touchmove', function (e) {
                currentPointer.x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
                currentPointer.y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;

                if ((currentPointer.x > elementWidth) || (currentPointer.x + elementPointer > 1)) {
                    return;
                }

                if (Math.abs(startPointer.x - currentPointer.x) > self.settings.swipeThreshold
                    && self.dragDirection !== 'y'
                ) {
                    self.dragDirection = 'x';
                    element.css({
                        transform: 'translate3d(' + (currentPointer.x + elementPointer + elementWidth) + 'px, 0px, 0px)'
                    });
                    self.$backdrop.css({
                        opacity: 1 - ((currentPointer.x + elementPointer) / -elementWidth)
                    });
                    e.preventDefault();
                }

                if (Math.abs(startPointer.y - currentPointer.y) > self.settings.swipeThreshold
                    && self.dragDirection !== 'x' && self.isOpened()
                ) {
                    self.dragDirection = 'y';
                }
            })
            .on('touchend', function () {
                if (self.dragDirection !== null) {
                    element.addClass('dragged');
                }

                self.dragDirection = null;
                if ((+new Date() - touchStartDate) <= self.settings.swipeToggleDuration) {
                    if ((startPointer.x < currentPointer.x)
                        && Math.abs(currentPointer.x - startPointer.x) >= self.settings.swipeToggleDistance
                    ) {
                        element.trigger('open.swipingSideMenu');
                    } else if ((startPointer.x - currentPointer.x) >= self.settings.swipeToggleDistance) {
                        element.trigger('close.swipingSideMenu');
                    }
                } else {
                    element.trigger(Math.abs(element.offset().left) < (elementWidth / 2)
                        ? 'open.swipingSideMenu'
                        : 'close.swipingSideMenu');
                }

                element
                    .removeClass('dragging')
                    .css({
                        transform: ''
                    });

                self.$backdrop
                    .css({
                        opacity: ''
                    });
            });

        return this;
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    };

    $(document)
        .on('ready init.swipingSideMenu', function () {
            $('[data-component="swiping-side-menu"]').swipingSideMenu();
        })
        .on('touchstart', function () {
            // backdrop swipe working wrong without it. bug?
        });
});
