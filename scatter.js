async function drawScatter() {

// 1. Access data
  const dataset = await d3.json("./data/my_weather_data.json")

  // set data constants

  // Get data attributes, i.e. xAccesstor for max temperature and yAccessor for min temperature 
  const xAccessor = d => d.temperatureMin;
  const yAccessor = d => d.temperatureMax;

  // Map the dataset to extract required attributes
  const data = dataset.map(d => ({
    x: xAccessor(d),
    y: yAccessor(d)
     // d.x != xAccessor(d)
  }));

  // Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.75,
    window.innerHeight * 0.75,
  ])
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 90,
      right: 90,
      bottom: 50,
      left: 50,
    },
    legendWidth: 250,
    legendHeight: 26,
  }
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // Draw 
  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left
    }px, ${
      dimensions.margin.top
    }px)`)

  const boundsBackground = bounds.append("rect")
      .attr("class", "bounds-background")
      .attr("x", 0)
      .attr("width", dimensions.boundedWidth)
      .attr("y", 0)
      .attr("height", dimensions.boundedHeight)











// 2. Draw static scatter points
// Create scales
const xScale = d3.scaleLinear()
  .domain(d3.extent(data, d => d.x))
//.domain(d3.extent(dataset, d => xAccessor(d))  ?
  .range([0, dimensions.boundedWidth])
  .nice()
  

const yScale = d3.scaleLinear()
  .domain(d3.extent(data, d => d.y))
  .range([dimensions.boundedHeight, 0])
  .nice()


//create colorscale
const colorScaleYear = 2018
const parseDate = d3.timeParse("%Y-%m-%d")
const colorAccessor = d => parseDate(d.date).setYear(colorScaleYear)

const colorScale = d3.scaleSequential()
  .domain([d3.timeParse("%Y-%m-%d")(`${colorScaleYear}-1-1`), d3.timeParse("%Y-%m-%d")(`${colorScaleYear}-12-31`)])
  .interpolator(d=>d3.interpolateRainbow(-d))


// Draw scatter dots
const dotsGroup = bounds.append("g")
dotsGroup
.selectAll("circle").data(dataset)
.join("circle")
.attr("cx", d => xScale(xAccessor(d)))
.attr("cy", d => yScale(yAccessor(d)))
.attr("r", 3)
.style("fill",d => colorScale(colorAccessor(d)))








// 3. Draw peripherals
//draw axis and axis labels
  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
    .ticks(4)

  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
      .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  const xAxisLabel = xAxis.append("text")
      .attr("class", "x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .html("Minimum Temperature (&deg;F)")

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(4)

  const yAxis = bounds.append("g")
      .call(yAxisGenerator)

  const yAxisLabel = yAxis.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("y", -dimensions.margin.left + 10)
      .html("Maximum Temperature (&deg;F)")

  //draw marginal distributions
  // const xAxisTopGenerator = d3.axisTop()
  //     .scale(xScale)
  //     .ticks(4)

  // const xTopAxis = bounds.append("g")
  //     .call(xAxisTopGenerator)
  //       .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  // const yAxisTopGenerator = d3.axisRight()
  //     .scale(yScale)
  //     .ticks(4)

  // const yTopAxis = bounds.append("g")
  //     .call(yAxisTopGenerator)
  //       .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  //initialize the legend
  const legendGroup = bounds.append("g")
      .attr("transform", `translate(${
        dimensions.boundedWidth - dimensions.legendWidth - 9
      },${
        dimensions.boundedHeight - 37
      })`)

  const defs = wrapper.append("defs")

  const numberOfGradientStops = 10
  const stops = d3.range(numberOfGradientStops).map(i => (
    i / (numberOfGradientStops - 1)
  ))
  const legendGradientId = "legend-gradient"
  const gradient = defs.append("linearGradient")
      .attr("id", legendGradientId)
    .selectAll("stop")
    .data(stops)
    .join("stop")
      .attr("stop-color", d => d3.interpolateRainbow(-d))
      .attr("offset", d => `${d * 100}%`)

  const legendGradient = legendGroup.append("rect")
      .attr("height", dimensions.legendHeight)
      .attr("width", dimensions.legendWidth)
      .style("fill", `url(#${legendGradientId})`)

  const tickValues = [
    d3.timeParse("%m/%d/%Y")(`4/1/${colorScaleYear}`),
    d3.timeParse("%m/%d/%Y")(`7/1/${colorScaleYear}`),
    d3.timeParse("%m/%d/%Y")(`10/1/${colorScaleYear}`),
  ]
  const legendTickScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, dimensions.legendWidth])

  const legendValues = legendGroup.selectAll(".legend-value")
    .data(tickValues)
    .join("text")
      .attr("class", "legend-value")
      .attr("x", legendTickScale)
      .attr("y", -6)
      .text(d3.timeFormat("%b"))

  const legendValueTicks = legendGroup.selectAll(".legend-tick")
    .data(tickValues)
    .join("line")
      .attr("class", "legend-tick")
      .attr("x1", legendTickScale)
      .attr("x2", legendTickScale)
      .attr("y1", 6)









// 4. Set up interactions
  // create voronoi for tooltips
  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d)),
  )
  const voronoiPolygons = delaunay.voronoi()
  voronoiPolygons.xmax = dimensions.boundedWidth
  voronoiPolygons.ymax = dimensions.boundedHeight

  const voronoi = dotsGroup.selectAll(".voronoi")
    .data(dataset)
      .join("path")
      .attr("class", "voronoi")
      .attr("d", (d,i) => voronoiPolygons.renderCell(i))

  // add two mouse events in the tooltip
  voronoi.on("mouseenter", onVoronoiMouseEnter)
    .on("mouseleave", onVoronoiMouseLeave)

  const tooltip = d3.select("#tooltip")
  const hoverElementsGroup = bounds.append("g")
      .attr("opacity", 0)

  const dayDot = hoverElementsGroup.append("circle")
      .attr("class", "tooltip-dot")


  function onVoronoiMouseEnter(e, datum) { 
    const newdate = new Date(datum.date);
    const options = { day:'numeric', weekday: 'long', month: 'long', year: 'numeric' };
    const formattedDate = newdate.toLocaleDateString('en-US', options);


  // get the mouse position
    const [mouseX, mouseY] = d3.pointer(e)

  // update the position and color of the tooltip
      tooltip.style("opacity", 1)
          .style("left", `${mouseX}px`)
          .style("top", `${mouseY}px`)
          .style("background-color", colorScale(datum.color))
          .html(`<strong>${formattedDate}</strong> <br> ${xAccessor(datum)}°F - ${yAccessor(datum)}°F`)

          // .text(datum.x)  
    // update the position and radius of the additional circle
       dayDot.attr("cx", xScale(xAccessor(datum)))
          .attr("cy", yScale(yAccessor(datum)))    //locate the position
          .attr("r", 7)
          .style("fill", colorScale(datum.color))

      // show the additional circle and tooltip
      hoverElementsGroup.style("opacity", 1)
    
  }

  function onVoronoiMouseLeave() {
    hoverElementsGroup.style("opacity", 0)
    tooltip.style("opacity", 0)      //hide the tool tip
  }





  

// 5. Set up bar interaction
  // add two mouse actions on the legend
  legendGradient.on("mousemove", onLegendMouseMove)
    .on("mouseleave", onLegendMouseLeave)

  const legendHighlightBarWidth = dimensions.legendWidth * 0.05
  const legendHighlightGroup = legendGroup.append("g")
      .attr("opacity", 0)

  const legendHighlightBar = legendHighlightGroup.append("rect")
      .attr("class", "legend-highlight-bar")
      .attr("width", legendHighlightBarWidth)
      .attr("height", dimensions.legendHeight)

  const legendHighlightText = legendHighlightGroup.append("text")
      .attr("class", "legend-highlight-text")
      .attr("x", legendHighlightBarWidth / 2)
      .attr("y", -6)

  function onLegendMouseMove(e) {

  // Get the mouse position
  const [x, y] = d3.pointer(e, legendGradient.node());
  
  // Get the date range based on the mouse position
  const selectedDate = legendTickScale.invert(x);
  const startDate = new Date(selectedDate);
  const endDate = new Date(selectedDate);
  endDate.setMonth(endDate.getMonth() + 1);
  
  // Filter the data based on the date range
  const filteredData = (d => {
    const date = d3.timeParse("%Y-%m-%d")(d.date);
    return date >= startDate && date < endDate;
  });
  
  // Update the opacity and radius of the circles
  dotsGroup.selectAll("circle")
    .transition().duration(500)
    .style("opacity", d => filteredData(d) ? 1 : 0.1)
    .attr("r", d => filteredData(d) ? 3 : 2);
  
  // Update the opacity and text of the legend ticks
  legendValues.style("opacity", d => {
    const date = d3.timeParse("%Y-%m-%d")(d);
    return date >= startDate && date < endDate ? 1 : 0.1;
  });
  
  // Update the opacity of the legend highlight bar
  legendHighlightGroup.style("opacity", 1);
  
  // Update the position and text of the legend highlight text and bar

  legendHighlightText.text(` ${d3.timeFormat("%b %e")(startDate)} - ${d3.timeFormat("%b %e")(endDate)}`);

  legendHighlightGroup.attr("transform", `translate(${x - legendHighlightBarWidth / 2}, 0)`);
}
  

  function onLegendMouseLeave() {
    dotsGroup.selectAll("circle")
      .transition().duration(500)
      .attr("r", 3)
      .style("opacity", 1)


    legendValues.style("opacity", 1)
    legendValueTicks.style("opacity", 1)
    legendHighlightGroup.style("opacity", 0)
  }

}

drawScatter()