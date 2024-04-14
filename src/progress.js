// Public proxy object to be able to update progress bars
let progressJs = {
    _instances: [],
    update: function(id, value) {
        const progress = this._instances.find((item) => {
            return item._id === id;
        });
        if (progress) {
            progress.update(value);
        } else {
            console.error('Progress item with id ' + id + ' not found.')
        }
    }
};

((progressJs) => {

    'use strict';

    const _defaults = {

        width : 100,
        height : 100,
        strokeWidth : 10,
        fgColor : '#757AAE',
        bgColor : '#CCCCCC',
        duration : '2s',
        fontFamily : 'Helvetica, Arial, sans-serif',
        fontSize : '.8rem',
        fontColor: '#AAAAAA',
        fontWeight: '900',
        value : 0,
        overall : 100,
        suffix: '%',
        shadow: false
    };

    document.addEventListener('DOMContentLoaded', function() {

        // Auto select html elements and generate progress object
        document.querySelectorAll('.progress-js').forEach(function(target) {

            // These are the properties which can be set through the dataset attributes
            const progress = new Progress(target, {
                width:       target.dataset.width,
                height:      target.dataset.height,
                strokeWidth: target.dataset.strokeWidth,
                fgColor:     target.dataset.fgColor,
                bgColor:     target.dataset.bgColor,
                fontSize:    target.dataset.fontSize,
                fontWeight:  target.dataset.fontWeight,
                duration:    target.dataset.duration,
                value:       target.dataset.value,
                overall:     target.dataset.overall,
                suffix:      target.dataset.suffix,
                shadow:      target.dataset.shadow
            });

            progress.render();

        });

    });

    /**
     * Progress object
     *
     * @param {HTMLElement|string} target
     * @param {Object} opts
     *
     * @returns {Progress}
     *
     * @constructor
     */
    const Progress = function (target, opts) {

        this.options = {
            width:       (typeof(opts.width) !== 'undefined') ? opts.width : _defaults.width,
            height:      (typeof(opts.height) !== 'undefined') ? opts.height : _defaults.height,
            strokeWidth: (typeof(opts.strokeWidth) !== 'undefined') ? opts.strokeWidth : _defaults.strokeWidth,
            fgColor:     (typeof(opts.fgColor) !== 'undefined') ? opts.fgColor : _defaults.fgColor,
            bgColor:     (typeof(opts.bgColor) !== 'undefined') ? opts.bgColor : _defaults.bgColor,
            duration:    (typeof(opts.duration) !== 'undefined') ? opts.duration : _defaults.duration,
            fontFamily:  (typeof(opts.fontFamily) !== 'undefined') ? opts.fontFamily : _defaults.fontFamily,
            fontSize:    (typeof(opts.fontSize) !== 'undefined') ? opts.fontSize : _defaults.fontSize,
            fontColor:   (typeof(opts.fontColor) !== 'undefined') ? opts.fontColor : _defaults.fontColor,
            fontWeight:  (typeof(opts.fontWeight) !== 'undefined') ? opts.fontWeight : _defaults.fontWeight,
            value:       (typeof(opts.value) !== 'undefined') ? opts.value : _defaults.value,
            overall:     (typeof(opts.overall) !== 'undefined') ? opts.overall : _defaults.overall,
            suffix:      (typeof(opts.suffix) !== 'undefined') ? opts.suffix : _defaults.suffix,
            shadow:      (typeof(opts.shadow) !== 'undefined') ? opts.shadow : _defaults.shadow
        };

        // This holds the associated .progress-js container
        this._target = target instanceof HTMLElement
            ? target
            : document.querySelector(target);

        this._id = 'progress-js-' + (progressJs._instances.length + 1);
        this._value = parseInt('' + this.options.value);
        this._previousValue = 0;
        this._hasDomAppended = false;

        // These should only being created or searched once to minimize unnecessary dom operations
        this._svg = this.createCircularBars();
        this._label = this.createLabel();
        this._labelText = this._label.querySelector('.currentProgress');
        this._primaryProgressBar = this._svg.querySelector('.progress-value');

        // Set the id on the associated container
        this._target.id = this._id;
        this._target.style.position = 'relative';

        // Publish the created instance into the public scope
        progressJs._instances.push(this);

    };

    /**
     * Create SVG
     *
     * @returns {Element}
     */
    Progress.prototype.createCircularBars = function() {

        const namespace = 'http://www.w3.org/2000/svg';

        const radius = ((this.options.width / 2) - this.options.strokeWidth).toString();
        const circumference = 2 * Math.PI * radius;

        const svg = document.createElementNS(namespace, 'svg');
        svg.setAttribute('class', 'progress');
        svg.setAttribute('width', this.options.width.toString());
        svg.setAttribute('height', this.options.height.toString());
        svg.setAttribute('viewBox', '0 0 ' + this.options.width + ' ' + this.options.height);
        svg.style.transform = 'rotate(-90deg)';

        const createCircle = (className, color) => {
            const circle = document.createElementNS(namespace, 'circle');
            circle.setAttribute('class', className);
            circle.setAttribute('stroke', color);
            circle.setAttribute('stroke-width', this.options.strokeWidth.toString());
            circle.setAttribute('fill', 'none');
            circle.setAttribute('cx', (this.options.width / 2).toString());
            circle.setAttribute('cy', (this.options.height / 2).toString());
            circle.setAttribute('r', radius);
            return circle;
        };

        const circle1 = createCircle('progress-meter', this.options.bgColor);

        if (this.options.shadow) {
            circle1.style.filter = 'drop-shadow(-2px 0px 1px rgba(0,0,0,0.3))';
        }

        const circle2 = createCircle('progress-value', this.options.fgColor);

        circle2.style.strokeDasharray  = circumference.toString();
        circle2.style.strokeDashoffset = circumference.toString();
        circle2.style.animation        = `progress_${this._id} this.options.duration`;
        circle2.style.transition       = `all ${this.options.duration}`;

        svg.appendChild(circle1);
        svg.appendChild(circle2);

        this._primaryProgressBar = circle2;

        return svg;

    };

    /**
     * Create label container
     *
     * @return {HTMLDivElement}
     */
    Progress.prototype.createLabel = function() {

        // Create label container for progress value and set some styles
        const labelContainer = document.createElement('div');

        labelContainer.className = 'label';
        labelContainer.style.lineHeight = '18px';
        labelContainer.style.fontFamily = this.options.fontFamily;
        labelContainer.style.position = 'absolute';
        labelContainer.style.width = '100%';
        labelContainer.style.height = '100%';

        let currentProgress = '0';

        const labelCurrentProgress = document.createElement('span');

        labelCurrentProgress.innerText = currentProgress;

        labelCurrentProgress.className = 'currentProgress';
        labelCurrentProgress.style.display = 'block';
        labelCurrentProgress.style.fontSize = this.options.fontSize;
        labelCurrentProgress.style.color = this.options.fgColor;
        labelCurrentProgress.style.fontWeight = this.options.fontWeight;
        labelCurrentProgress.style.position = 'absolute';
        labelCurrentProgress.style.left = '50%';
        labelCurrentProgress.style.top = '50%';
        labelCurrentProgress.style.transform = 'translate(-50%, -50%)';

        labelContainer.appendChild(labelCurrentProgress);

        return labelContainer;

    };

    /**
     * Update the current progress value
     *
     * @param number
     */
    Progress.prototype.update = function(number) {

        this._previousValue = this._value;
        this._value = number;

        this.render();

    };

    /**
     * Calculate radius, circumference, current progress and resulting offset
     *
     * @returns {{radius: number, circumference: number, progress: number, offset: number}}
     */
    Progress.prototype.calculate = function() {

        let percent = null;

        if (this._value !== 0 && this.options.overall !== 0) {
            percent = (this._value / this.options.overall);
        }

        const progress = percent;
        const radius = ((this.options.width / 2) - this.options.strokeWidth);
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - progress);

        return {
            progress:      progress,
            radius:        radius,
            circumference: circumference,
            offset:        offset
        };

    };

    /**
     * Animating the percentage according to the configured duration (with help from ChatGPT 3.5)
     */
    Progress.prototype.animateCount = function() {

        const steps = 50;
        const stepDuration = (parseInt(this.options.duration) * 1000) / steps;

        let currentValue = this._previousValue;
        const totalChange = this._value - this._previousValue;
        let step = 0;

        const update = () => {
            const progress = step / steps;
            const easedProgress = 1 - (1 - progress) * (1 - progress);
            const increment = totalChange * easedProgress;

            currentValue = this._previousValue + increment;
            this._labelText.innerText = Math.round(currentValue) + this.options.suffix;

            if ((totalChange > 0 && currentValue < this._value) || (totalChange < 0 && currentValue > this._value)) {
                step++;
                setTimeout(update, stepDuration);
            } else {
                this._labelText.innerText = this._value + this.options.suffix;
            }
        };

        update();

    }

    /**
     * Get everything together and append dom elements when necessary
     */
    Progress.prototype.render = function() {

        const data = this.calculate();

        // The progress must be below 1
        if (data.progress > 1) {
            return;
        }

        this._target.style.width = this.options.width + 'px';
        this._target.style.height = this.options.height + 'px';

        // Set the current data with a delay to trigger the animation correctly
        setTimeout(() => {
            this._primaryProgressBar.style.strokeDasharray  = data.circumference.toString();
            this._primaryProgressBar.style.strokeDashoffset = data.offset.toString();
        }, 10);

        if (!this._hasDomAppended) {
            this._hasDomAppended = true;
            this._target.appendChild(this._label);
            this._target.appendChild(this._svg);
        }

        this.animateCount();

    };

})(progressJs);