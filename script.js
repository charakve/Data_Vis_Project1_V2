// Content from script_brush.js
// Set up margins and dimensions
const margin_brush = { top: 20, right: 30, bottom: 40, left: 50 }; // Renamed to avoid conflict
const width_brush = 800 - margin_brush.left - margin_brush.right; // Renamed
const height_brush = 400 - margin_brush.top - margin_brush.bottom; // Renamed

// Append SVG elements to the DOM
const svgHistogram_brush = d3
  .select("#histogram") // Renamed
  .append("svg")
  .attr("width", width_brush + margin_brush.left + margin_brush.right)
  .attr("height", height_brush + margin_brush.top + margin_brush.bottom)
  .append("g")
  .attr("transform", `translate(${margin_brush.left},${margin_brush.top})`);

const svgScatter_brush = d3
  .select("#scatterplot") // Renamed
  .append("svg")
  .attr("width", width_brush + margin_brush.left + margin_brush.right)
  .attr("height", height_brush + margin_brush.top + margin_brush.bottom)
  .append("g")
  .attr("transform", `translate(${margin_brush.left},${margin_brush.top})`);

const svgChoropleth_brush = d3
  .select("#choropleth") // Renamed
  .append("svg")
  .attr("width", width_brush + margin_brush.left + margin_brush.right)
  .attr("height", height_brush + margin_brush.top + margin_brush.bottom)
  .append("g")
  .attr("transform", `translate(${margin_brush.left},${margin_brush.top})`);

// Tooltip for interactivity
const tooltip_brush = d3
  .select("body")
  .append("div") // Renamed
  .attr("class", "tooltip")
  .style("opacity", 0);

// Global variables from script_brush.js
let data_brush; // Renamed
let counties_brush; // Renamed
let colorScale_brush; // Renamed
let xAttribute_brush = document.getElementById("x-axis-select").value; // Renamed
let yAttribute_brush = document.getElementById("y-axis-select").value; // Renamed
let choroplethAttribute_brush = "poverty_perc"; // Renamed, Default choropleth attribute
let histogramAttribute_brush = "poverty_perc"; // Renamed, Default histogram attribute
let selectedData_brush = []; // Renamed, Stores brushed data

// Load the data (from script_brush.js)
d3.csv("data.csv").then(function (csvData_brush) {
  // Renamed csvData
  // Convert strings to numbers
  data_brush = csvData_brush.map((d) => {
    // Renamed data
    d.poverty_perc = +d.poverty_perc;
    d.percent_stroke = +d.percent_stroke;
    d.median_household_income = +d.median_household_income;
    d.percent_no_health_insurance = +d.percent_no_health_insurance || 0; // Replace NaN with 0
    return d;
  });

  // Debug: Log the first few rows to verify the data
  console.log("Data from script_brush.js:", data_brush.slice(0, 5)); // Added identifier

  // Create initial histogram (using brush version)
  createHistogram_brush(
    svgHistogram_brush,
    data_brush,
    histogramAttribute_brush,
    "Poverty Percentage (%)",
    d3.interpolateBlues
  ); // Renamed function and vars

  // Create scatterplot (using brush version)
  createScatterplot_brush(svgScatter_brush, data_brush); // Renamed function and vars

  // Load US counties TopoJSON (using brush version)
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then(
    function (us_brush) {
      // Renamed us
      counties_brush = topojson.feature(
        us_brush,
        us_brush.objects.counties
      ).features; // Renamed counties

      // Initialize color scale (using brush version)
      updateColorScale_brush(); // Renamed function

      // Draw the initial choropleth map (using brush version)
      drawChoropleth_brush(); // Renamed function
    }
  );
});

// Function to update the color scale based on the selected attribute (from script_brush.js)
function updateColorScale_brush() {
  // Renamed function
  const maxValue_brush = d3.max(
    data_brush,
    (d) => d[choroplethAttribute_brush]
  ); // Renamed vars
  colorScale_brush = d3
    .scaleSequential(d3.interpolatePurples) // Renamed colorScale
    .domain([0, maxValue_brush]); // Renamed maxValue
}

// Function to draw the choropleth map (from script_brush.js)
function drawChoropleth_brush() {
  // Renamed function
  // Clear previous map
  svgChoropleth_brush.selectAll("path").remove(); // Renamed svgChoropleth

  // Set projection (Albers USA for US maps)
  const projection_brush = d3
    .geoAlbersUsa() // Renamed projection
    .translate([width_brush / 2, height_brush / 2]) // Renamed width, height
    .scale(width_brush); // Renamed width

  // Create path generator
  const path_brush = d3.geoPath().projection(projection_brush); // Renamed path, projection

  // Draw counties
  svgChoropleth_brush
    .selectAll("path") // Renamed svgChoropleth
    .data(counties_brush) // Renamed counties
    .enter()
    .append("path")
    .attr("d", path_brush) // Renamed path
    .attr("fill", (d) => {
      const county_brush = (
        selectedData_brush.length > 0 ? selectedData_brush : data_brush
      ).find((county) => county.cnty_fips === d.id); // Renamed vars
      return county_brush
        ? colorScale_brush(county_brush[choroplethAttribute_brush])
        : "#ccc"; // Renamed vars
    })
    .on("mouseover", function (event, d) {
      const county_brush = (
        selectedData_brush.length > 0 ? selectedData_brush : data_brush
      ).find((county) => county.cnty_fips === d.id); // Renamed vars
      if (county_brush) {
        // Renamed county
        tooltip_brush
          .transition() // Renamed tooltip
          .duration(200)
          .style("opacity", 0.9);
        tooltip_brush
          .html(
            `County: ${county_brush.display_name}<br>${
              choroplethAttribute_brush === "poverty_perc"
                ? "Poverty"
                : choroplethAttribute_brush === "percent_stroke"
                ? "Stroke"
                : choroplethAttribute_brush === "median_household_income"
                ? "Median Income"
                : "No Health Insurance"
            }: ${county_brush[choroplethAttribute_brush]}${
              choroplethAttribute_brush === "median_household_income"
                ? "$"
                : "%"
            }`
          ) // Renamed vars
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      }
    })
    .on("mouseout", function (d) {
      tooltip_brush
        .transition() // Renamed tooltip
        .duration(500)
        .style("opacity", 0);
    });
}

// Event listener for histogram dropdown (from script_brush.js)
d3.select("#histogram-select").on("change", function () {
  histogramAttribute_brush = this.value; // Renamed histogramAttribute
  updateHistogram_brush(); // Renamed function
});

// Event listener for scatterplot dropdowns (from script_brush.js)
d3.select("#x-axis-select").on("change", function () {
  xAttribute_brush = this.value; // Renamed xAttribute
  updateScatterplot_brush(); // Renamed function
});

d3.select("#y-axis-select").on("change", function () {
  yAttribute_brush = this.value; // Renamed yAttribute
  updateScatterplot_brush(); // Renamed function
});

// Event listener for choropleth dropdown (from script_brush.js)
d3.select("#choropleth-select").on("change", function () {
  choroplethAttribute_brush = this.value; // Renamed choroplethAttribute
  updateColorScale_brush(); // Renamed function
  drawChoropleth_brush(); // Renamed function
});

// Function to update the histogram (from script_brush.js)
function updateHistogram_brush() {
  // Renamed function
  svgHistogram_brush.selectAll("*").remove(); // Renamed svgHistogram
  createHistogram_brush(
    svgHistogram_brush,
    selectedData_brush.length > 0 ? selectedData_brush : data_brush,
    histogramAttribute_brush,
    histogramAttribute_brush === "poverty_perc"
      ? "Poverty Percentage (%)" // Renamed vars
      : histogramAttribute_brush === "percent_stroke"
      ? "Stroke Prevalence (%)"
      : histogramAttribute_brush === "median_household_income"
      ? "Median Household Income ($)"
      : "No Health Insurance (%)",
    d3.interpolateBlues
  ); // Renamed function and vars
}

// Function to create a histogram (from script_brush.js)
function createHistogram_brush(svg, data, attribute, label, colorScale) {
  // Renamed function
  const x_hist_brush = d3
    .scaleLinear() // Renamed x
    .domain([0, d3.max(data, (d) => d[attribute])])
    .range([0, width_brush]); // Renamed width

  // Note: y scale seemed unused in the original, keeping similar structure
  const y_hist_domain_brush = d3
    .scaleLinear() // Renamed y
    .domain([0, d3.max(data, (d) => d[attribute])])
    .range([height_brush, 0]); // Renamed height

  const bins_brush = d3
    .histogram() // Renamed bins
    .value((d) => d[attribute])
    .domain(x_hist_brush.domain()) // Renamed x_hist
    .thresholds(20);

  const histogramData_brush = bins_brush(data); // Renamed histogramData, bins

  const yHist_brush = d3
    .scaleLinear() // Renamed yHist
    .domain([0, d3.max(histogramData_brush, (d) => d.length)]) // Renamed histogramData
    .range([height_brush, 0]); // Renamed height

  // Add x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height_brush})`) // Renamed height
    .call(d3.axisBottom(x_hist_brush)); // Renamed x_hist

  // Add y-axis
  svg.append("g").call(d3.axisLeft(yHist_brush)); // Renamed yHist

  // Add x-axis label
  svg
    .append("text")
    .attr("x", width_brush / 2) // Renamed width
    .attr("y", height_brush + margin_brush.bottom - 10) // Renamed height, margin
    .attr("class", "axis-label")
    .text(label);

  // Add y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height_brush / 2) // Renamed height
    .attr("y", -margin_brush.left + 15) // Renamed margin
    .attr("class", "axis-label")
    .text("Number of Counties");

  // Add bars
  svg
    .selectAll("rect")
    .data(histogramData_brush) // Renamed histogramData
    .enter()
    .append("rect")
    .attr("x", (d) => x_hist_brush(d.x0) + 1) // Renamed x_hist
    .attr("y", (d) => yHist_brush(d.length)) // Renamed yHist
    .attr("width", (d) => x_hist_brush(d.x1) - x_hist_brush(d.x0) - 1) // Renamed x_hist
    .attr("height", (d) => height_brush - yHist_brush(d.length)) // Renamed height, yHist
    .attr("fill", (d) =>
      colorScale(d.x0 / d3.max(histogramData_brush, (d) => d.x1))
    ) // Renamed histogramData
    .on("mouseover", function (event, d) {
      tooltip_brush
        .transition() // Renamed tooltip
        .duration(200)
        .style("opacity", 0.9);
      tooltip_brush
        .html(`Count: ${d.length}`) // Renamed tooltip
        .style("left", event.pageX + 5 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function (d) {
      tooltip_brush
        .transition() // Renamed tooltip
        .duration(500)
        .style("opacity", 0);
    });
}

// Function to update the scatterplot (from script_brush.js)
function updateScatterplot_brush() {
  // Renamed function
  const x_scatter_update_brush = d3
    .scaleLinear() // Renamed x
    .domain([0, d3.max(data_brush, (d) => d[xAttribute_brush])]) // Renamed data, xAttribute
    .range([0, width_brush]); // Renamed width

  const y_scatter_update_brush = d3
    .scaleLinear() // Renamed y
    .domain([0, d3.max(data_brush, (d) => d[yAttribute_brush])]) // Renamed data, yAttribute
    .range([height_brush, 0]); // Renamed height

  // Update x-axis label
  svgScatter_brush
    .select(".x-axis-label") // Renamed svgScatter
    .text(
      xAttribute_brush === "poverty_perc"
        ? "Poverty Percentage (%)" // Renamed xAttribute
        : xAttribute_brush === "percent_stroke"
        ? "Stroke Prevalence (%)"
        : xAttribute_brush === "median_household_income"
        ? "Median Household Income ($)"
        : "No Health Insurance (%)"
    );

  // Update y-axis label
  svgScatter_brush
    .select(".y-axis-label") // Renamed svgScatter
    .text(
      yAttribute_brush === "poverty_perc"
        ? "Poverty Percentage (%)" // Renamed yAttribute
        : yAttribute_brush === "percent_stroke"
        ? "Stroke Prevalence (%)"
        : yAttribute_brush === "median_household_income"
        ? "Median Household Income ($)"
        : "No Health Insurance (%)"
    );

  // Update points
  svgScatter_brush
    .selectAll("circle") // Renamed svgScatter
    .attr("cx", (d) => x_scatter_update_brush(d[xAttribute_brush])) // Renamed vars
    .attr("cy", (d) => y_scatter_update_brush(d[yAttribute_brush])); // Renamed vars
}

// Function to create a scatterplot (from script_brush.js)
function createScatterplot_brush(svg, data) {
  // Renamed function
  const x_scatter_create_brush = d3
    .scaleLinear() // Renamed x
    .domain([0, d3.max(data, (d) => d[xAttribute_brush])]) // Renamed xAttribute
    .range([0, width_brush]); // Renamed width

  const y_scatter_create_brush = d3
    .scaleLinear() // Renamed y
    .domain([0, d3.max(data, (d) => d[yAttribute_brush])]) // Renamed yAttribute
    .range([height_brush, 0]); // Renamed height

  // Add x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height_brush})`) // Renamed height
    .call(d3.axisBottom(x_scatter_create_brush)); // Renamed x_scatter_create

  // Add y-axis
  svg.append("g").call(d3.axisLeft(y_scatter_create_brush)); // Renamed y_scatter_create

  // Add x-axis label
  svg
    .append("text")
    .attr("x", width_brush / 2) // Renamed width
    .attr("y", height_brush + margin_brush.bottom - 10) // Renamed height, margin
    .attr("class", "axis-label x-axis-label")
    .text(
      xAttribute_brush === "poverty_perc"
        ? "Poverty Percentage (%)" // Renamed xAttribute
        : xAttribute_brush === "percent_stroke"
        ? "Stroke Prevalence (%)"
        : xAttribute_brush === "median_household_income"
        ? "Median Household Income ($)"
        : "No Health Insurance (%)"
    );

  // Add y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height_brush / 2) // Renamed height
    .attr("y", -margin_brush.left + 15) // Renamed margin
    .attr("class", "axis-label y-axis-label")
    .text(
      yAttribute_brush === "poverty_perc"
        ? "Poverty Percentage (%)" // Renamed yAttribute
        : yAttribute_brush === "percent_stroke"
        ? "Stroke Prevalence (%)"
        : yAttribute_brush === "median_household_income"
        ? "Median Household Income ($)"
        : "No Health Insurance (%)"
    );

  // Add points
  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x_scatter_create_brush(d[xAttribute_brush])) // Renamed vars
    .attr("cy", (d) => y_scatter_create_brush(d[yAttribute_brush])) // Renamed vars
    .attr("r", 5)
    .attr("fill", "steelblue")
    .on("mouseover", function (event, d) {
      tooltip_brush
        .transition() // Renamed tooltip
        .duration(200)
        .style("opacity", 0.9);
      tooltip_brush
        .html(
          `County: ${d.display_name}<br>${
            xAttribute_brush === "poverty_perc"
              ? "Poverty"
              : xAttribute_brush === "percent_stroke"
              ? "Stroke"
              : xAttribute_brush === "median_household_income"
              ? "Median Income"
              : "No Health Insurance"
          }: ${d[xAttribute_brush]}${
            xAttribute_brush === "median_household_income" ? "$" : "%"
          }<br>${
            yAttribute_brush === "poverty_perc"
              ? "Poverty"
              : yAttribute_brush === "percent_stroke"
              ? "Stroke"
              : yAttribute_brush === "median_household_income"
              ? "Median Income"
              : "No Health Insurance"
          }: ${d[yAttribute_brush]}${
            yAttribute_brush === "median_household_income" ? "$" : "%"
          }`
        ) // Renamed vars
        .style("left", event.pageX + 5 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function (d) {
      tooltip_brush
        .transition() // Renamed tooltip
        .duration(500)
        .style("opacity", 0);
    });

  // Add brushing functionality (from script_brush.js)
  const brush_brush = d3
    .brush() // Renamed brush
    .extent([
      [0, 0],
      [width_brush, height_brush],
    ]) // Renamed width, height
    .on("start brush end", brushed_brush); // Renamed function

  svg.append("g").attr("class", "brush").call(brush_brush); // Renamed brush
}

// Function to handle brushing (from script_brush.js)
function brushed_brush(event) {
  // Renamed function
  if (!event.selection) {
    selectedData_brush = []; // Clear selection if brush is cleared
    // Reset other charts to show all data
    updateHistogram_brush();
    drawChoropleth_brush();
    // Optionally: highlight all scatterplot points again if needed
    svgScatter_brush.selectAll("circle").classed("selected", false); // Example reset
    return;
  }

  // Get the brushed region coordinates
  const [[x0, y0], [x1, y1]] = event.selection;

  // Define scales *inside* the brushed function to ensure they use the current attributes
  const xScale_brush = d3
    .scaleLinear() // Renamed xScale
    .domain([0, d3.max(data_brush, (d) => d[xAttribute_brush])]) // Renamed data, xAttribute
    .range([0, width_brush]); // Renamed width

  const yScale_brush = d3
    .scaleLinear() // Renamed yScale
    .domain([0, d3.max(data_brush, (d) => d[yAttribute_brush])]) // Renamed data, yAttribute
    .range([height_brush, 0]); // Renamed height

  // Filter the data based on the brushed region
  selectedData_brush = data_brush.filter((d) => {
    // Renamed selectedData, data
    const x = xScale_brush(d[xAttribute_brush]); // Renamed xScale, xAttribute
    const y = yScale_brush(d[yAttribute_brush]); // Renamed yScale, yAttribute
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  });

  // Highlight selected points (optional)
  svgScatter_brush
    .selectAll("circle") // Renamed svgScatter
    .classed("selected", (d) => {
      const x = xScale_brush(d[xAttribute_brush]); // Renamed xScale, xAttribute
      const y = yScale_brush(d[yAttribute_brush]); // Renamed yScale, yAttribute
      return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    });

  // Update the histogram and choropleth map with the selected data
  updateHistogram_brush(); // Renamed function
  drawChoropleth_brush(); // Renamed function - Renamed from updateChoropleth to drawChoropleth
}

// ======================================================
// Content from script.js (Adapted to avoid conflicts)
// ======================================================

// Note: Margins, dimensions, SVG creation, and tooltip are already handled by script_brush.js part.
//       We will reuse or adapt functions and variables where possible.
//       If script.js had unique functionalities, they would be integrated here.
//       Since script.js appears to be a subset of script_brush.js (without brushing),
//       most of its code is already represented above. We'll add the helper function.

console.log("Checking script.js specific elements...");

// Global variables from script.js (Check if already defined or need merging)
// let data; // Already defined as data_brush
// let counties; // Already defined as counties_brush
// let colorScale; // Already defined as colorScale_brush
// let xAttribute = document.getElementById("x-axis-select").value; // Already defined as xAttribute_brush
// let yAttribute = document.getElementById("y-axis-select").value; // Already defined as yAttribute_brush
// let choroplethAttribute = "poverty_perc"; // Already defined as choroplethAttribute_brush
// let histogramAttribute = "poverty_perc"; // Already defined as histogramAttribute_brush

// Data loading from script.js (Handled by script_brush.js)
// d3.csv("data.csv").then(csvData => { ... }); // Already done

// SVG Creation function from script.js (Similar function implicitly used in script_brush.js)
/*
function createSVG(selector) { // This function was in script.js
    return d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right) // These would need renaming if used
        .attr("height", height + margin.top + margin.bottom) // These would need renaming if used
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`); // These would need renaming if used
}
*/

// Color scale update function (Handled by script_brush.js version: updateColorScale_brush)
// function updateColorScale() { ... }

// Choropleth drawing function (Handled by script_brush.js version: drawChoropleth_brush)
// function drawChoropleth() { ... }

// Event listeners (Handled by script_brush.js versions)
// d3.select("#histogram-select").on("change", ...);
// d3.select("#x-axis-select").on("change", ...);
// d3.select("#y-axis-select").on("change", ...);
// d3.select("#choropleth-select").on("change", ...);

// Histogram update function (Handled by script_brush.js version: updateHistogram_brush)
// function updateHistogram() { ... }

// Histogram creation function (Handled by script_brush.js version: createHistogram_brush)
// function createHistogram(svg, data, attribute, label, colorScale) { ... }

// Scatterplot update function (Handled by script_brush.js version: updateScatterplot_brush)
// function updateScatterplot() { ... }

// Scatterplot creation function (Handled by script_brush.js version: createScatterplot_brush)
// function createScatterplot(svg, data) { ... }

// Helper function to get attribute label (from script.js - Keep this as it might be useful)
function getAttributeLabel(attribute) {
  switch (attribute) {
    case "poverty_perc":
      return "Poverty Percentage (%)";
    case "percent_stroke":
      return "Stroke Prevalence (%)";
    case "median_household_income":
      return "Median Household Income ($)";
    case "percent_no_health_insurance":
      return "No Health Insurance (%)";
    default:
      return attribute;
  }
}

// Add final check or initialization if needed
console.log("Combined script loaded.");

// Example of potentially using the helper function if tooltips/labels need it:
// Instead of repeating the switch/case logic, the brush version could potentially call getAttributeLabel().
// e.g., in updateScatterplot_brush:
// svgScatter_brush.select(".x-axis-label").text(getAttributeLabel(xAttribute_brush));
// svgScatter_brush.select(".y-axis-label").text(getAttributeLabel(yAttribute_brush));
// (This change is not made above, just showing potential usage)
