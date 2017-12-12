var w = document.getElementById('svg-container').clientWidth;
var h = document.getElementById('svg-container').clientHeight;

var marg = { top: h/10, right: w/6, bottom: h/10, left: w/8 };

var currencies;

var canvas = d3.select("#canvas-container")
               .append("canvas");

var context = canvas.node().getContext("2d");

context.canvas.width = w;
context.canvas.height = h;
context.canvas.style.width = "100%";
context.canvas.style.height = "100%";

var scale_X = d3.scaleTime()
                .range([0, (w - (marg.left + marg.right)) ]);

var scalelinY = d3.scaleLinear()
                .range([ (h - (marg.top + marg.bottom)), 0]);

var scalelogY = d3.scaleLog()
                .range([ (h - (marg.top + marg.bottom)), 0]);

var scalelinLine = d3.line()
                     .x(function(d) { return scale_X(d.dateObject); })
                     .y(function(d) { return scalelinY(d.close) })
                     .context(context);

var scalelogLine = d3.line()
                     .x(function(d) { return scale_X(d.dateObject); })
                     .y(function(d) { return scalelogY(d.close) })
                     .context(context);

context.translate(marg.left, marg.top);

function scaling(scale) {
       return scale;
}

queue()
  .defer(d3.csv, "./data/crypto-markets.csv")  // import data from csv file
  .await(function(err, dataIn) {

    dataIn.forEach(function(d,i) {
      d.close = +d.close;

      d.dateObject = dateParse(d.date);
    });

    var cf = crossfilter(dataIn);

    var bySymbol = cf.dimension(function(d) { return d.symbol; });
    var byValue = cf.dimension(function(d) { return d.close; });

    currencies = bySymbol;

    var symbolList = bySymbol.group().all()
    var symbolUnique = symbolList.map(function(d) { return d.key; })

    var bitcoin = updateData("BTC");
    var ethereum = updateData("ETH");
    var bitcash = updateData("BCH");
    var jinn = updateData("JINN");
    var bitconnect = updateData("BCC");
    var zcash = updateData("ZEC");
    var dash = updateData("DASH");
    var bitcoingold = updateData("BTG");
    var monero = updateData("XMR");
    var bytes = updateData("GBYTE");

    scale_X.domain(d3.extent(bitcoin, function(d) { return d.dateObject; }) );
    scalelinY.domain([0, 8000]);
    scalelogY.domain([1e-4, 10000]);

    context.clearRect(0, 0, w, h);

    for (var i = 0; i < symbolUnique.length; i++) {
      var data = updateData(symbolUnique[i]);
      var dimension = crossfilter(data).dimension(function(d) { return d.close; })
      var filter = dimension.filterRange([1e-4,8000]).top(Infinity);

      draw(scalelinLine, filter, "gainsboro", .1);
    };

    draw(scalelinLine, bitcoin, "#2ca02c", .5);
    draw(scalelinLine, ethereum, "#8c564b", .5);
    draw(scalelinLine, bitcash, "#ff7f0c", .5);
    draw(scalelinLine, jinn, "#7f7f7f", .5);
    draw(scalelinLine, bitconnect, "#1f77b4", .5);
    draw(scalelinLine, zcash, "#17becf", .5);
    draw(scalelinLine, dash, "#9467bd", .5);
    draw(scalelinLine, bitcoingold, "#d62728", .5);
    draw(scalelinLine, monero, "#bcbd22", .5);
    draw(scalelinLine, bytes, "#e377c2", .5);

    xCanvas();
    yCanvas(scalelinY);

    d3.selectAll(".canvas-button")
      .on("click", function(d) {
        var thisEl = d3.select(this)
        var value = thisEl.attr("value")
        var newLine = value + "Line"
        var fnLine = window[newLine];

        var newScale = value +  "Y";
        var fnScale = window[newScale];

        d3.selectAll(".canvas-button").attr("class", "canvas-button inactive");

        thisEl.attr("class", "canvas-button active");

        context.clearRect(-100, -50, w, h);

        for (var i = 0; i < symbolUnique.length; i++) {
          var data = updateData(symbolUnique[i]);
          var dimension = crossfilter(data).dimension(function(d) { return d.close; })
          var filter = dimension.filterRange([1e-4,8000]).top(Infinity);

          draw(fnLine, filter, "gainsboro", .1);
        };

        draw(fnLine, bitcoin, "#2ca02c", .5);
        draw(fnLine, ethereum, "#8c564b", .5);
        draw(fnLine, bitcash, "#ff7f0c", .5);
        draw(fnLine, jinn, "#7f7f7f", .5);
        draw(fnLine, bitconnect, "#1f77b4", .5);
        draw(fnLine, zcash, "#17becf", .5);
        draw(fnLine, dash, "#9467bd", .5);
        draw(fnLine, bitcoingold, "#d62728", .5);
        draw(fnLine, monero, "#bcbd22", .5);
        draw(fnLine, bytes, "#e377c2", .5);

        xCanvas();
        yCanvas(fnScale);


      });

  });

function draw(line, data, color, lineWidth) {
  context.beginPath();
  line(data);
  context.lineWidth = lineWidth;
  context.strokeStyle = color;
  context.stroke();
};

function xCanvas() {
  var tickCount = 5;
  var tickSize = 6;
  var tickPadding = 8;
  var ticks = scale_X.ticks(tickCount);
  var tickFormat = scale_X.tickFormat(tickCount);

  context.beginPath();
  ticks.forEach(function(d) {
    context.moveTo(scale_X(d), h - (marg.bottom + marg.top));
    context.lineTo(scale_X(d), (h - (marg.bottom + marg.top) + tickSize));
  });
  context.lineWidth = 1;
  context.strokeStyle = "black";
  context.stroke();

  // context.beginPath();
  // context.moveTo(0, h - (marg.bottom + marg.top));
  // context.lineTo(0, h - (marg.bottom + marg.top));
  // context.lineTo(w - (marg.right + marg.left), h - (marg.bottom + marg.top));
  // context.lineTo(w - (marg.right + marg.left), h - (marg.bottom + marg.top));
  // context.strokeStyle = "black";
  // context.stroke();

  context.textAlign = "center";
  context.textBaseline = "middle";
  ticks.forEach(function(d) {
    context.fillText(tickFormat(d), scale_X(d), (h - (marg.bottom + marg.top) + (tickPadding + tickSize)));
  });
}

function yCanvas(scale) {
  var tickCount = 5;
  var tickSize = 6;
  var tickPadding = 3;
  var ticks = scaling(scale).ticks(tickCount);
  var tickFormat = scaling(scale).tickFormat(4,d3.format(",.2f"));

  context.beginPath();
  ticks.forEach(function(d) {
    context.moveTo(0, scaling(scale)(d));
    context.lineTo(-6, scaling(scale)(d));
  });
  context.lineWidth = 1;
  context.strokeStyle = "black";
  context.stroke();

  context.beginPath();
  context.moveTo(-tickSize, 0);
  context.lineTo(0.5, 0);
  context.lineTo(0.5, h - (marg.bottom + marg.top));
  context.lineTo(-tickSize, h - (marg.bottom + marg.top));
  context.strokeStyle = "black";
  context.stroke();

  context.textAlign = "right";
  context.textBaseline = "middle";
  ticks.forEach(function(d) {
    context.fillText(tickFormat(d), -tickSize - tickPadding, scaling(scale)(d));
  });

  context.save();
  context.rotate(-Math.PI / 2);
  context.textAlign = "right";
  context.textBaseline = "top";
  context.font = "bold 10px sans-serif";
  context.fillText("Price (USD)", -10, 10);
  context.restore();
}

var dateParse = d3.timeParse("%Y-%m-%e");

var sortByDate = crossfilter.quicksort.by(function(d) { return d.dateObject; });

function updateData(currency) {
  var filter = currencies.filterExact(currency).top(Infinity);
  return sortByDate(filter, 0, filter.length)
};
