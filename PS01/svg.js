var width = document.getElementById('svg-container').clientWidth;
var height = document.getElementById('svg-container').clientHeight;

var margin = { top: height/10, right: width/6, bottom: height/10, left: width/8 };

var currencies;

var svg = d3.select("#svg-container")
            .append("svg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

var scaleX = d3.scaleTime()
                .range([0, (width - (margin.left + margin.right)) ]);

var logY = d3.scaleLog()
            .range([ (height - (margin.top + margin.bottom)), 0]);

var linY = d3.scaleLinear()
            .range([ (height - (margin.top + margin.bottom)), 0]);

var log = d3.line()
                 .x(function(d) { return scaleX(d.dateObject); })
                 .y(function(d) { return logY(d.close) })
                 .curve(d3.curveBasis);

var lin = d3.line()
                .x(function(d) { return scaleX(d.dateObject); })
                .y(function(d) { return linY(d.close) })
                .curve(d3.curveBasis);

function scaling(scale) {
       return scale;
}

queue()
  .defer(d3.csv, "./data/crypto-markets-clean.csv")  // import data from csv file
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

    var initData = updateData("BTC");

    scaleX.domain(d3.extent(initData, function(d) { return d.dateObject; }) );
    logY.domain([1e-4, 10000]);
    linY.domain([0, 8000]);
    colorScale.domain(symbolUnique);

    var posY = [];

    for (var i = 0; i < symbolUnique.length; i++) {
      var newData = updateData(symbolUnique[i]);
      var length = newData.length - 1;

      posY.push({symbol: newData[length].symbol, pos: newData[length].close });

      initDraw(newData,log);
    };

    xAxis();
    yAxis(logY);

    var labels = svg.append("g")
                    .attr("class", "labels")
                    .selectAll("label")
                    .data(posY)
                    .enter()
                    .append("text")
                    .attr("class", "label")
                    .attr("id", function(d) { return d.symbol; })
                    .attr("x", (width - (margin.left + margin.right) + 5))
                    .attr("y", function(d) { return logY(d.pos); })
                    .style("opacity", 0)
                    .text(function(d) { return d.symbol; });

    update();

  });

function xAxis() {
  svg.append("g")
      .attr("class", "xAxis")
      .attr("transform", "translate(0," + (height - (margin.bottom + margin.top)) + ")")
      .call(d3.axisBottom(scaleX)
              .ticks(5))


  svg.append("text")
       .attr("transform", "rotate(270)")
       .attr("x", -40)
       .attr("y", 20)
       .attr("class", "xAxis-label")
       .attr("text-anchor", "middle")
       .text("Price (USD)");

}

function yAxis(scale) {
  svg.append("g")
      .attr("class", "yAxis")
      .attr("transform", "translate(0,0)")
      .call(d3.axisLeft(scale)
              .ticks(5)
              .tickFormat(function(d) {
                return scale.tickFormat(4,d3.format(",.2f"))(d)
              }));
}

var dateParse = d3.timeParse("%Y-%m-%e");

var sortByDate = crossfilter.quicksort.by(function(d) { return d.dateObject; });

function updateData(currency) {
  var filter = currencies.filterExact(currency).top(Infinity);
  return sortByDate(filter, 0, filter.length)
};

function initDraw(data,scale) {
  svg.append("path")
     .datum(data)
     .attr("class", "line")
     .attr("fill", "none")
     .attr("stroke", "none")
     .attr("id", function(d) { return d[0].symbol; })
     .attr("stroke-width", 1)
     .attr("d", scaling(scale))
     .on("mouseover", function(d) {
       var selection = d3.select(this).attr("id");

       d3.selectAll(".line")
        .attr("stroke-width", .3);

       d3.select(this)
         .attr("stroke-width", 1.5);

      d3.select("text#" + selection)
        .style("opacity", 1)

     })
     .on("mouseout", function(d) {
       var selection = d3.select(this).attr("id");

       d3.selectAll(".line")
        .attr("stroke", function(d,i) { return colorScale(i) })
        .attr("stroke-width", 1);

        d3.select("text#" + selection)
          .style("opacity", 0)
     });
}

d3.selectAll(".svg-button")
  .on("click", function(d) {
    var thisEl = d3.select(this)
    var newLine = thisEl.attr("value")
    var fnLine = window[newLine];

    d3.selectAll(".line")
      .transition()
      .duration(500)
      .attr("d", scaling(fnLine));

    var newScale = newLine +  "Y";
    var fnScale = window[newScale];

    d3.select(".yAxis")
      .transition()
      .duration(500)
      .call(d3.axisLeft(fnScale)
              .ticks(5)
              .tickFormat(function(e) {
                return fnScale.tickFormat(4,d3.format(",.2f"))(e)
              }));

    d3.selectAll(".label")
      .transition()
      .duration(500)
      .attr("y", function(d) { return fnScale(d.pos); });

    d3.selectAll(".svg-button").attr("class", "svg-button inactive");

    thisEl.attr("class", "svg-button active");

  });

function update() {

  d3.selectAll(".line")
     .transition()
     .duration(500)
     .attr("stroke", function(d,i) { return colorScale(i) });

  d3.selectAll(".label")
    .transition()
    .duration(500)
    .attr("fill", function(d,i) { return colorScale(i) });

 };
