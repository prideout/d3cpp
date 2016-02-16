'using strict';

var App = function() {

    this.worker = new Worker('worker.js');
    this.collisions = null;

    // This flag enables us to avoid queing up work when collision takes
    // longer than a single frame.
    this.pending_collision = false;

    var previous = performance.now();
    this.worker.onmessage = function(msg) {
        this.pending_collision = false;
        var current = performance.now();
        var time = Math.floor(current - previous);
        document.getElementById('perf').innerHTML = time + ' ms';
        previous = current;
        this.collisions = new Uint32Array(msg.data.collisions.buffer);
        this.dirty_draw = true;
    }.bind(this);

    this.width = 500;
    this.height = 500;
    this.viewport = new Float32Array(4);
    this.viewport_bytes = new Uint8Array(this.viewport.buffer);

    var count = 500, rsize = 0.02, msize = 0.3, i, j, cx, cy, w, h,
        randomX = d3.random.normal(this.width / 2, 70),
        randomY = d3.random.normal(this.height / 2, 70);

    this.data = new Float32Array(count * 4);
    this.data_bytes = new Uint8Array(this.data.buffer);

    for (i = 0, j = 0; i < count; i++) {
        cx = randomX();
        cy = randomY();
        w = this.width * rsize * (msize + Math.random());
        h = this.height * rsize * (msize + Math.random());
        this.data[j++] = cx - w;
        this.data[j++] = cy - h;
        this.data[j++] = cx + w;
        this.data[j++] = cy + h;
    }

    this.worker.postMessage({
        'funcName': 'd3cpp_set_data',
        'data': this.data_bytes
    });

    this.xform = d3.scale.linear()
        .domain([0, this.width])
        .range([0, this.width]);

    this.yform = d3.scale.linear()
        .domain([0, this.height])
        .range([this.height, 0]);

    this.context = d3.select("body")
        .append("canvas")
        .attr("width", this.width)
        .attr("height", this.height)
        .call(d3.behavior.zoom()
            .x(this.xform)
            .y(this.yform)
            .scaleExtent([1, 40])
            .on("zoom", this.zoom.bind(this)))
        .node().getContext("2d");

    this.dirty_draw = true;
    this.dirty_viewport = true;
    this.tick = this.tick.bind(this);
    this.tick();
};

App.prototype.tick = function() {

    if (this.dirty_viewport) {

        // If the worker is still busy, don't queue up requests, and don't
        // clear the dirty flag.
        if (!this.pending_collision) {
            this.pending_collision = true;
            this.worker.postMessage({
                'funcName': 'd3cpp_set_viewport',
                'data': this.compute_viewport()
            });
            this.dirty_viewport = false;
        }

        // Zooming and panning should always be as responsive as possible,
        // even if the worker is bogged down.  So, if the viewport moved,
        // then we definitely need to redraw the canvas.
        this.dirty_draw = true;
    }

    if (this.dirty_draw) {
        this.draw();
        this.dirty_draw = false;
    }

    requestAnimationFrame(this.tick);
};

App.prototype.compute_viewport = function() {
    var xdomain = this.xform.domain();
    var ydomain = this.yform.domain();
    this.viewport[0] = xdomain[0];
    this.viewport[1] = ydomain[0];
    this.viewport[2] = xdomain[1];
    this.viewport[3] = ydomain[1];
    return this.viewport_bytes;
};

App.prototype.zoom = function() {
  this.dirty_viewport = true;
};

App.prototype.draw = function() {
    var i = -1, j = 0, data = this.data, n = data.length / 4,
        cx, cy, x0, y0, x1, y1, w, h,
        canvas = this.context, x = this.xform, y = this.yform;
    canvas.clearRect(0, 0, this.width, this.height);
    canvas.globalAlpha = 0.2;
    canvas.strokeStyle = "rgb(0, 0, 0)";
    canvas.beginPath();
    while (++i < n) {
        x0 = data[j++];
        y0 = data[j++];
        x1 = data[j++];
        y1 = data[j++];
        cx = x(0.5 * (x0 + x1));
        cy = y(0.5 * (y0 + y1));
        w = x1 - x0;
        h = y1 - y0;
        canvas.rect(cx - w * 0.5, cy - h * 0.5, w, h);
    }
    canvas.stroke();

    if (this.collisions) {
        canvas.beginPath();
        for (var i = 0; i < this.collisions.length; i += 2) {
            j = (this.collisions[i]) * 4;
            x0 = data[j++];
            y0 = data[j++];
            x1 = data[j++];
            y1 = data[j];
            cx = x(0.5 * (x0 + x1));
            cy = y(0.5 * (y0 + y1));
            w = x1 - x0;
            h = y1 - y0;
            canvas.rect(cx - w * 0.5, cy - h * 0.5, w, h);
            j = (this.collisions[i + 1]) * 4;
            x0 = data[j++];
            y0 = data[j++];
            x1 = data[j++];
            y1 = data[j];
            cx = x(0.5 * (x0 + x1));
            cy = y(0.5 * (y0 + y1));
            w = x1 - x0;
            h = y1 - y0;
            canvas.rect(cx - w * 0.5, cy - h * 0.5, w, h);
        }
        canvas.fill();
    }
};

var app = new App();
