'using strict';

var App = function() {

    this.width = 500;
    this.height = 500;

    var count = 5000, rsize = 0.01, i, j, cx, cy, w, h,
        randomX = d3.random.normal(this.width / 2, 80),
        randomY = d3.random.normal(this.height / 2, 80);

    this.data = new Float32Array(count * 4);
    for (i = 0, j = 0; i < count; i++) {
        cx = randomX();
        cy = randomY();
        w = this.width * rsize * Math.random();
        h = this.height * rsize * Math.random();
        this.data[j++] = cx - w;
        this.data[j++] = cy - h;
        this.data[j++] = cx + w;
        this.data[j++] = cy + h;
    }

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

    this.draw();
};

App.prototype.zoom = function() {
  this.context.clearRect(0, 0, this.width, this.height);
  this.draw();
};

App.prototype.draw = function() {
    var i = -1, j = 0, data = this.data, n = data.length / 4,
        cx, cy, x0, y0, x1, y1,
        canvas = this.context, x = this.xform, y = this.yform;
    canvas.beginPath();
    while (++i < n) {
        x0 = x(data[j++]);
        y0 = y(data[j++]);
        x1 = x(data[j++]);
        y1 = y(data[j++]);
        canvas.rect(x0, y0, x1 - x0, y1 - y0);
    }
    canvas.stroke();
};

var app = new App();
