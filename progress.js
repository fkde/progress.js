/**
 * ProgressJS
 *
 * @author  Florian Knapp <office@florianknapp.de>
 * @license MIT License
 */
(function() {

    'use strict';

    var _field = {
        instances: []
    };

    /* --- Private -------------------------------------------------------------------------------------------------- */

    var _private = {

        /**
         * Generate that shit
         *
         * @param {Progress} obj
         * @returns {Element}
         */
        generateBar: function (obj) {

            var namespace = 'http://www.w3.org/2000/svg';

            var radius = ((obj.width / 2) - obj.strokeWidth).toString();
            var circumference = 2 * Math.PI * radius;

            var svg = document.createElementNS(namespace, 'svg');
            svg.setAttributeNS('', 'class', 'progress');
            svg.setAttributeNS('', 'width', obj.width);
            svg.setAttributeNS('', 'height', obj.height);
            svg.setAttributeNS('', 'viewBox', '0 0 ' + obj.width + ' ' + obj.height);
            svg.style.transform = 'rotate(-90deg)';

            var circle1 = document.createElementNS(namespace, 'circle');
            circle1.setAttributeNS('', 'class', 'progress-meter');
            circle1.setAttributeNS('', 'stroke', obj.bgColor);
            circle1.setAttributeNS('', 'stroke-width', obj.strokeWidth);
            circle1.setAttributeNS('', 'fill', 'none');
            circle1.setAttributeNS('', 'cx', (obj.width / 2).toString());
            circle1.setAttributeNS('', 'cy', (obj.height / 2).toString());
            circle1.setAttributeNS('', 'r', radius);
            //circle1.style.filter = 'drop-shadow( -1px -1px -3px #000 )';

            var circle2 = document.createElementNS(namespace, 'circle');
            circle2.setAttributeNS('', 'class', 'progress-value');
            circle2.setAttributeNS('', 'stroke', obj.fgColor);
            circle2.setAttributeNS('', 'stroke-width', obj.strokeWidth);
            circle2.setAttributeNS('', 'fill', 'none');
            circle2.setAttributeNS('', 'cx', (obj.width / 2).toString());
            circle2.setAttributeNS('', 'cy', (obj.height / 2).toString());
            circle2.setAttributeNS('', 'r', radius);
            //circle2.style.filter = 'drop-shadow( 3px 3px 5px #000 )';

            circle2.style.strokeDasharray  = circumference;
            circle2.style.strokeDashoffset = circumference;
            circle2.style.animation        = 'progress_' + obj.id + ' ' + obj.duration;
            circle2.style.transition       = 'all ' + obj.duration;

            svg.appendChild(circle1);
            svg.appendChild(circle2);

            return svg;

        },

        /**
         * With lovely support from stack overflow (thank you user7892745)
         *
         * @link https://stackoverflow.com/questions/18481550/how-to-dynamically-create-keyframe-css-animations
         *
         * @param {String} name
         * @param {String} frames
         *
         * @returns {Boolean}
         */
        setAnimationData: function (name, frames) {

            var dynamicStylesheet = document.createElement('style');

            document.head.appendChild(dynamicStylesheet);

            if (typeof(CSS) !== 'object' && CSS.supports && CSS.supports('animation: name')) {
                dynamicStylesheet.innerHTML = "@keyframes " + name + "{" + frames + "}";
            } else {
                dynamicStylesheet.insertHTML = '@-webkit-keyframes ' + name + '{' + frames + '}';
            }

            return true;

        },

        /**
         * Sync current data with the html element
         *
         * @param {Progress} obj
         *
         * @returns {boolean}
         */
        sync: function (obj) {

            var calc         = this.calculateRadial(obj);
            var progressItem = obj.svg.querySelector('.progress-value');

            if (calc.progress * 100 > 100) {
                return false;
            }

            this.setAnimationData(
                'progress_' + obj.id,
                'from{stroke-dashoffset:' + calc.circumference + '}' +
                'to{stroke-dashoffset:' + calc.offset + '}'
            );

            progressItem.style.strokeDasharray  = calc.circumference;
            progressItem.style.strokeDashoffset = calc.offset;

            var label       = document.createElement('div');
            label.className = 'progress-label';
            label.style.lineHeight = '18px';

            var countResult = parseInt(calc.progress * 100) + '%';

            if (obj.counter.length) {
                countResult = obj.counter;
            }

            var labelCount              = document.createElement('span');
            labelCount.innerHTML        = countResult;
            labelCount.dataset.progress = parseInt(calc.progress * 100);
            labelCount.style.display    = 'block';
            labelCount.style.textAlign  = 'center';
            labelCount.style.fontSize   = '1.5em';

            var labelDesc             = document.createElement('span');
            labelDesc.innerHTML       = obj.label;
            labelDesc.style.textAlign = 'center';

            if (!obj.target.querySelector('.progress-label')) {

                label.appendChild(labelCount);
                label.appendChild(labelDesc);
                progressItem.parents('.progress-js').appendChild(label);

            } else {

                if (obj.counter.length) {
                    obj.target.querySelector('.progress-label > span').innerHTML = obj.overall - obj.current;
                } else {
                    obj.target.querySelector('.progress-label > span').innerHTML = parseInt(calc.progress * 100) + '%';
                }



            }

            label.css({
                fontFamily: obj.fontFamily,
                fontSize:   obj.fontSize,
                position:   'absolute',
                display:    'inline-block',
                top:        0,
                left:       0
            });

            var labelFromLeft = (obj.target.offsetWidth / 2) - (label.offsetWidth / 2);
            var labelFromTop  = (obj.target.offsetHeight / 2) - (label.offsetHeight / 2) - 3;

            label.css({
                left: labelFromLeft + 'px',
                top: labelFromTop + 'px'
            });

            return true;

        },

        /**
         * Calculate radius, circumference, current progress and resulting offset
         *
         * @param {Progress} obj
         *
         * @returns {{radius: number, circumference: number, progress: number, offset: number}}
         */
        calculateRadial: function(obj) {

            var percent = null;

            if (obj.current !== 0 && obj.overall !== 0) {
                percent = (obj.current / obj.overall);
            }

            var radius        = ((obj.width / 2) - obj.strokeWidth);
            var circumference = 2 * Math.PI * radius;
            var progress      = percent !== null ? percent : obj.value / 100;
            var offset        = circumference * (1 - progress);

            return {
                radius:        radius,
                circumference: circumference,
                progress:      progress,
                offset:        offset
            };

        }

    };

    /**
     * Progress object
     *
     * @param {HTMLElement} target
     * @param {Object} opts
     *
     * @returns {Progress}
     *
     * @constructor
     */
    var Progress = function (target, opts) {

        this.id          = _field.instances.length;
        this.target      = target;
        this.value       = (typeof(opts.value) !== 'undefined') ? opts.value : 0;
        this.width       = (typeof(opts.width) !== 'undefined') ? opts.width : 0;
        this.height      = (typeof(opts.height) !== 'undefined') ? opts.height : 0;
        this.strokeWidth = (typeof(opts.strokeWidth) !== 'undefined') ? opts.strokeWidth : 0;
        this.fgColor     = (typeof(opts.fgColor) !== 'undefined') ? opts.fgColor : '#757aae';
        this.bgColor     = (typeof(opts.bgColor) !== 'undefined') ? opts.bgColor : '#303030';
        this.duration    = (typeof(opts.duration) !== 'undefined') ? opts.duration : '2s';
        this.fontFamily  = (typeof(opts.fontSize) !== 'undefined') ? opts.fontFamily : 'Helvetica, sans-serif';
        this.fontSize    = (typeof(opts.fontSize) !== 'undefined') ? opts.fontSize : '10px';
        this.label       = (typeof(opts.label) !== 'undefined') ? opts.label : '';
        this.counter     = (typeof(opts.counter) !== 'undefined') ? opts.counter : '';
        this.current     = (typeof(opts.current) !== 'undefined') ? opts.current : 0;
        this.overall     = (typeof(opts.overall) !== 'undefined') ? opts.overall : 0;
        this.svg         = _private.generateBar(this);

        this.target.style.position = 'relative';
        this.target.appendChild(this.svg);
        _field.instances.push(this);

        return this;

    };

    /**
     * Set progress value
     *
     * @param {Number} progressValue
     */
    Progress.prototype.set = function (progressValue) {
        this.value = progressValue;
        _private.sync(this);
    };

    /**
     * Get progress value
     *
     * @returns {Number}
     */
    Progress.prototype.get = function () {
        return this.value;
    };

    /**
     * Set the label
     *
     * @param {String} label
     */
    Progress.prototype.setLabel = function(label) {
        this.label = label;
        _private.sync(this);
    };

    /**
     * Get the label
     * @returns {String}
     */
    Progress.prototype.getLabel = function() {
        return this.label;
    };

    /**
     * Set current amount
     * @param {Number} current
     */
    Progress.prototype.setCurrent = function(current) {
        this.current = current;
        _private.sync(this);
    };

    /**
     * Get current amount
     * @returns {Number}
     */
    Progress.prototype.getCurrent = function() {
        return this.current;
    };

    /**
     * Set overall amount
     * @param {Number} overall
     */
    Progress.prototype.setOverall = function(overall) {
        this.overall = overall;
        _private.sync(this);
    };

    /**
     * Get overall amount
     * @returns {Number}
     */
    Progress.prototype.getOverall = function() {
        return this.overall;
    };

    /**
     * Set counter amount
     * @param {Number|String} counter
     */
    Progress.prototype.setCounter = function(counter) {
        this.counter = counter;
        _private.sync(this);
    };

    /**
     * Get counter amount
     * @returns {Number|String}
     */
    Progress.prototype.getCounter = function() {
        return this.counter;
    };

    /**
     * Auto select html elements and generate progress object
     */
    document.querySelectorAll('.progress-js').each(function(index, item) {

        item.progress = new Progress(item, {
            value:       item.dataset.value,
            width:       item.dataset.width,
            height:      item.dataset.height,
            strokeWidth: item.dataset.strokeWidth,
            fgColor:     item.dataset.fgColor,
            bgColor:     item.dataset.bgColor,
            duration:    item.dataset.duration,
            label:       item.dataset.label,
            current:     item.dataset.current,
            overall:     item.dataset.overall,
            counter:     item.dataset.counter
        });

        _private.sync(item.progress);

    });

})();

