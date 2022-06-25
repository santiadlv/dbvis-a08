/**
 * IMPORTANT NOTICE:
 * 
 * The data is provided by the data.js file.
 * Make sure the data.js file is loaded before the index.js file, so that you can acces it here!
 * The data is provided in an array called: data
 * const data = [
  {
    "species": "Adelie",
    "island": "Torgersen",
    "culmen_length_mm": 39.1,
    "culmen_depth_mm": 18.7,
    "flipper_length_mm": 181,
    "body_mass_g": 3750,
    "sex": "MALE"
  } ....
 */

const width = 600;
const height = 600;
const margin = {
  left: 50,
  right: 50,
  top: 50,
  bottom: 50,
};

d3.select('svg#chart').attr('width', width).attr('height', height)
var brush_area = d3.select('g#vis-g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')

const visHeight = height - margin.top - margin.bottom
const visWidth = width - margin.left - margin.right

var allDimensions = Object.keys(data[0])
var cleanData = data.filter((d) => allDimensions.reduce((isClean, dim) => (d[dim] != undefined && isClean), true))

var numerics = allDimensions.filter(d => typeof cleanData[0][d] === 'number')
var categoricals = allDimensions.filter(d => typeof cleanData[0][d] === 'string')

//append a circle for each datapoint
// for cx, cy, fill and r we set dummy values for now 
var selection = d3.select('g#scatter-points').selectAll('circle').data(cleanData)
  .enter().append('circle')
  .attr('cx', 0)
  .attr('cy', 0)
  .attr('r', 3)
  .attr('fill', 'black')

//add labels for x and y axis
var yLabel = d3.select('g#vis-g').append('text').attr('class', 'axis-label')
var xLabel = d3.select('g#vis-g').append('text').attr('class', 'axis-label')
.attr('transform', 'translate('+ visWidth +', ' + visHeight + ')')

var xScale = d3.scaleLinear()
.domain(d3.extent(cleanData, d => d["culmen_length_mm"]))
.range([0, visWidth])

d3.select('g#x-axis')
.attr('transform', 'translate(0,'+ visHeight +')')
.call(d3.axisBottom(xScale))
selection.attr('cx', d => xScale(d["culmen_length_mm"]))

var yScale = d3.scaleLinear()
.domain(d3.extent(cleanData, d => d["culmen_depth_mm"]))
.range([visHeight, 0])
d3.select('g#y-axis')
.attr('transform', 'translate(' + 0 +',0)')
.call(d3.axisLeft(yScale))
selection
.attr('cy', d => yScale(d["culmen_depth_mm"]))

var colorScale = d3.scaleOrdinal()
.domain(new Set(cleanData.map(d => d["species"])))
.range(d3.schemeCategory10);
selection
.attr('fill', d => colorScale(d["species"]))

var sizeScale = d3.scaleLinear()
.domain(d3.extent(cleanData, d => d["body_mass_g"]))
.range([3, 7])
selection
.attr('r', (d) => sizeScale(d["body_mass_g"]))

//TODO:
// define d3.brush (see https://github.com/d3/d3-brush)
// and define its event handling
// add brush selection to the predefined variable brush_area

var brush = d3.brush()
  .on("brush", updatePlot)
  .on("end", resetSelection);

brush_area
  .append("g")
    .attr("class", "brush")
    .call(brush);

//TODO:
// add function to highlight the selected circles on brushstroke
// the circles are assigned with predefined styling classes (see index.css)
// convert all circles to non-brushed
// filter selection based on boolean function "isBrushed" (see next comment)

d3.selectAll("circle").classed("normal", true);
var newSelection = selection;

function updatePlot(event) {
  var extent = event.selection;
  newSelection = selection.filter(function(d) {
    return isBrushed(extent, d3.select(this));
  });
  updateChart();
}

function resetSelection(event) {
  if (event.selection) return;
  d3.selectAll("circle")
    .classed("normal", true)
    .classed("brushed", false)
    .classed("non_brushed", false);

  newSelection = selection;
  updateChart();
}

//TODO:
// create function to dynamically create a barchart in the barchart element (in index.html)
    // remove unnecessary elements
    // set the dimensions and margins of the graph
    // set the scales and axis
    // select all brushed elements
    // use d3.rollup to prepare the data:
        // the bars should display the culmen depth summed up for each species
        //apply the correct color scale
    // draw the axis and bars based on the data input

var svg = d3.select('svg#barchart')
              .attr('width', width)
              .attr('height', height)
            .select("g.vis-g")
              .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");



function updateChart() {
  var dataPrep = preprocessData();
  d3.select("g.vis-g").selectAll("*").remove();

  var xScale = d3.scaleBand()
    .domain(Array.from(dataPrep.keys())) //Alternative: [...new Set(newSelection.data().map(d => d.species))]
    .range([margin.left, visWidth])
    .padding(0.2);
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + visHeight + ")")
    .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

  var yScale = d3.scaleLinear()
    .domain([0, d3.max(dataPrep, d => d[d.length - 1])])
    .range([visHeight, margin.top])
    .nice();
  svg.append("g")
    .attr("class", "y-axis")
    .attr('transform', 'translate(' + margin.left +',0)')
    .call(d3.axisLeft(yScale));

  var bars = svg.selectAll("rect")
    .data(dataPrep);

  bars
    .exit()
    .remove();

  bars.enter()
    .append("rect")
      .attr("x", d => xScale(d[0]))
      .attr("y", d => yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .attr("height", d => visHeight - yScale(d[1]))
      .attr("fill", "#69b3a2")
      .attr('fill', d => colorScale(d[0])); 

  bars
    .transition()
    .duration(500);
}

function preprocessData() {
  return d3.rollup(newSelection.data(), v => d3.sum(v, d => d.culmen_depth_mm), d => d.species);
}

updateChart();

//TODO:
//create function which returns a boolean value...
//stating if the cx and cy is located within the brushed area

function isBrushed(extent, obj) {
  var cx = obj.attr("cx");
  var cy = obj.attr("cy");

  const [[x0, y0], [x1, y1]] = extent;

  if (cx > x0 && cx < x1 && cy > y0 && cy < y1) {
    obj.classed("brushed", true)
      .classed("non_brushed", false)
      .classed("normal", false);
    return true
  }
    
  else {
    obj.classed("brushed", false)
      .classed("non_brushed", true)
      .classed("normal", false)
    return false
  }
}