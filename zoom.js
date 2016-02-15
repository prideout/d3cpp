'using strict';

var App = function() {

    this.width = 500;
    this.height = 500;

    var randomX = d3.random.normal(this.width / 2, 80),
        randomY = d3.random.normal(this.height / 2, 80);

    this.data = d3.range(5000).map(function() {
      return [
        randomX(),
        randomY()
      ];
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

    this.draw();
};

App.prototype.zoom = function() {
  this.context.clearRect(0, 0, this.width, this.height);
  this.draw();
};

App.prototype.draw = function() {
    var i = -1, data = this.data, n = data.length, d, cx, cy,
        canvas = this.context, x = this.xform, y = this.yform;
    canvas.beginPath();
    while (++i < n) {
        d = data[i];
        cx = x(d[0]);
        cy = y(d[1]);
        canvas.moveTo(cx, cy);
        canvas.arc(cx, cy, 2.5, 0, 2 * Math.PI);
    }
    canvas.fill();
};

var app = new App();
