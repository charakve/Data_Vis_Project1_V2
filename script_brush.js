// Set up margins and dimensions
const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Append SVG elements to the DOM
const svgHistogram = d3.select("#histogram")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const svgScatter = d3.select("#scatterplot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const svgChoropleth = d3.select("#choropleth")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip for interactivity
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Global variables
let data;
let counties;
let colorScale;
let xAttribute = document.getElementById("x-axis-select").value;
let yAttribute = document.getElementById("y-axis-select").value;
let choroplethAttribute = "poverty_perc"; // Default choropleth attribute
let histogramAttribute = "poverty_perc"; // Default histogram attribute
let selectedData = []; // Stores brushed data

// Load the data
d3.csv("data.csv").then(function(csvData) {
  // Convert strings to numbers
  data = csvData.map(d => {
    d.poverty_perc = +d.poverty_perc;
    d.percent_stroke = +d.percent_stroke;
    d.median_household_income = +d.median_household_income;
    d.percent_no_health_insurance = +d.percent_no_health_insurance || 0; // Replace NaN with 0
    return d;
  });

  // Debug: Log the first few rows to verify the data
  console.log(data.slice(0, 5));

  // Create initial histogram
  createHistogram(svgHistogram, data, histogramAttribute, "Poverty Percentage (%)", d3.interpolateBlues);

  // Create scatterplot
  createScatterplot(svgScatter, data);

  // Load US counties TopoJSON
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then(function(us) {
    counties = topojson.feature(us, us.objects.counties).features;

    // Initialize color scale
    updateColorScale();

    // Draw the initial choropleth map
    drawChoropleth();
  });
});

// Function to update the color scale based on the selected attribute
function updateColorScale() {
  const maxValue = d3.max(data, d => d[choroplethAttribute]);
  colorScale = d3.scaleSequential(d3.interpolatePurples)
    .domain([0, maxValue]);
}

// Function to draw the choropleth map
function drawChoropleth() {
  // Clear previous map
  svgChoropleth.selectAll("path").remove();

  // Set projection (Albers USA for US maps)
  const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width);

  // Create path generator
  const path = d3.geoPath().projection(projection);

  // Draw counties
  svgChoropleth.selectAll("path")
    .data(counties)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", d => {
      const county = (selectedData.length > 0 ? selectedData : data).find(county => county.cnty_fips === d.id);
      return county ? colorScale(county[choroplethAttribute]) : "#ccc";
    })
    .on("mouseover", function(event, d) {
      const county = (selectedData.length > 0 ? selectedData : data).find(county => county.cnty_fips === d.id);
      if (county) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`County: ${county.display_name}<br>${choroplethAttribute === "poverty_perc" ? "Poverty" : choroplethAttribute === "percent_stroke" ? "Stroke" : choroplethAttribute === "median_household_income" ? "Median Income" : "No Health Insurance"}: ${county[choroplethAttribute]}${choroplethAttribute === "median_household_income" ? "$" : "%"}`)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      }
    })
    .on("mouseout", function(d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Event listener for histogram dropdown
d3.select("#histogram-select").on("change", function() {
  histogramAttribute = this.value; // Update the selected histogram attribute
  updateHistogram(); // Update the histogram
});

// Event listener for scatterplot dropdowns
d3.select("#x-axis-select").on("change", function() {
  xAttribute = this.value; // Update the selected X attribute
  updateScatterplot(); // Update the scatterplot
});

d3.select("#y-axis-select").on("change", function() {
  yAttribute = this.value; // Update the selected Y attribute
  updateScatterplot(); // Update the scatterplot
});

// Event listener for choropleth dropdown
d3.select("#choropleth-select").on("change", function() {
  choroplethAttribute = this.value; // Update the selected choropleth attribute
  updateColorScale(); // Update the color scale
  drawChoropleth(); // Redraw the choropleth map
});

// Function to update the histogram
function updateHistogram() {
  svgHistogram.selectAll("*").remove(); // Clear previous histogram
  createHistogram(svgHistogram, selectedData.length > 0 ? selectedData : data, histogramAttribute, histogramAttribute === "poverty_perc" ? "Poverty Percentage (%)" :
    histogramAttribute === "percent_stroke" ? "Stroke Prevalence (%)" :
    histogramAttribute === "median_household_income" ? "Median Household Income ($)" :
    "No Health Insurance (%)", d3.interpolateBlues);
}

// Function to create a histogram
function createHistogram(svg, data, attribute, label, colorScale) {
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[attribute])])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[attribute])])
    .range([height, 0]);

  const bins = d3.histogram()
    .value(d => d[attribute])
    .domain(x.domain())
    .thresholds(20);

  const histogramData = bins(data);

  const yHist = d3.scaleLinear()
    .domain([0, d3.max(histogramData, d => d.length)])
    .range([height, 0]);

  // Add x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add y-axis
  svg.append("g")
    .call(d3.axisLeft(yHist));

  // Add x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("class", "axis-label")
    .text(label);

  // Add y-axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("class", "axis-label")
    .text("Number of Counties");

  // Add bars
  svg.selectAll("rect")
    .data(histogramData)
    .enter().append("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", d => yHist(d.length))
    .attr("width", d => x(d.x1) - x(d.x0) - 1)
    .attr("height", d => height - yHist(d.length))
    .attr("fill", d => colorScale(d.x0 / d3.max(histogramData, d => d.x1)))
    .on("mouseover", function(event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`Count: ${d.length}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Function to update the scatterplot
function updateScatterplot() {
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[xAttribute])])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[yAttribute])])
    .range([height, 0]);

  // Update x-axis label
  svgScatter.select(".x-axis-label")
    .text(xAttribute === "poverty_perc" ? "Poverty Percentage (%)" :
          xAttribute === "percent_stroke" ? "Stroke Prevalence (%)" :
          xAttribute === "median_household_income" ? "Median Household Income ($)" :
          "No Health Insurance (%)");

  // Update y-axis label
  svgScatter.select(".y-axis-label")
    .text(yAttribute === "poverty_perc" ? "Poverty Percentage (%)" :
          yAttribute === "percent_stroke" ? "Stroke Prevalence (%)" :
          yAttribute === "median_household_income" ? "Median Household Income ($)" :
          "No Health Insurance (%)");

  // Update points
  svgScatter.selectAll("circle")
    .attr("cx", d => x(d[xAttribute]))
    .attr("cy", d => y(d[yAttribute]));
}

// Function to create a scatterplot
function createScatterplot(svg, data) {
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[xAttribute])])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[yAttribute])])
    .range([height, 0]);

  // Add x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add y-axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("class", "axis-label x-axis-label")
    .text(xAttribute === "poverty_perc" ? "Poverty Percentage (%)" :
          xAttribute === "percent_stroke" ? "Stroke Prevalence (%)" :
          xAttribute === "median_household_income" ? "Median Household Income ($)" :
          "No Health Insurance (%)");

  // Add y-axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("class", "axis-label y-axis-label")
    .text(yAttribute === "poverty_perc" ? "Poverty Percentage (%)" :
          yAttribute === "percent_stroke" ? "Stroke Prevalence (%)" :
          yAttribute === "median_household_income" ? "Median Household Income ($)" :
          "No Health Insurance (%)");

  // Add points
  svg.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(d[xAttribute]))
    .attr("cy", d => y(d[yAttribute]))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .on("mouseover", function(event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`County: ${d.display_name}<br>${xAttribute === "poverty_perc" ? "Poverty" : xAttribute === "percent_stroke" ? "Stroke" : xAttribute === "median_household_income" ? "Median Income" : "No Health Insurance"}: ${d[xAttribute]}${xAttribute === "median_household_income" ? "$" : "%"}<br>${yAttribute === "poverty_perc" ? "Poverty" : yAttribute === "percent_stroke" ? "Stroke" : yAttribute === "median_household_income" ? "Median Income" : "No Health Insurance"}: ${d[yAttribute]}${yAttribute === "median_household_income" ? "$" : "%"}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Add brushing functionality
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("start brush end", brushed);

  svg.append("g")
    .attr("class", "brush")
    .call(brush);
}

// Function to handle brushing
function brushed(event) {
  if (!event.selection) return; // Ignore empty selections

  // Get the brushed region coordinates
  const [[x0, y0], [x1, y1]] = event.selection;

  // Filter the data based on the brushed region
  selectedData = data.filter(d => {
    const x = xScale(d[xAttribute]);
    const y = yScale(d[yAttribute]);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  });

  // Update the histogram and choropleth map with the selected data
  updateHistogram();
  updateChoropleth();
}