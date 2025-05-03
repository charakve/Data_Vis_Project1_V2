// Set up margins and dimensions
const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Append SVG elements to the DOM
const svgHistogram = createSVG("#histogram");
const svgScatter = createSVG("#scatterplot");
const svgChoropleth = createSVG("#choropleth");

// Tooltip for interactivity
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Global variables
let data, counties, colorScale;
let xAttribute = document.getElementById("x-axis-select").value;
let yAttribute = document.getElementById("y-axis-select").value;
let choroplethAttribute = "poverty_perc"; // Default choropleth attribute
let histogramAttribute = "poverty_perc"; // Default histogram attribute

d3.csv("data.csv").then(csvData => {
    // Convert strings to numbers and clean negative percentages
    data = csvData.map(d => ({
        poverty_perc: Math.max(0, +d.poverty_perc),
        percent_stroke: Math.max(0, +d.percent_stroke),
        median_household_income: +d.median_household_income,
        percent_no_health_insurance: Math.max(0, +d.percent_no_health_insurance),
        display_name: d.display_name,
        cnty_fips: d.cnty_fips
    }));

    // Debug: Log the first few rows to verify the data
    console.log(data.slice(0, 5));

    // Create initial histogram and scatterplot
    createHistogram(svgHistogram, data, histogramAttribute, "Poverty Percentage (%)", d3.interpolateBlues);
    createScatterplot(svgScatter, data);

    // Load US counties TopoJSON
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then(us => {
        counties = topojson.feature(us, us.objects.counties).features;
        updateColorScale();
        drawChoropleth();
    });
});

// Function to create SVG elements
function createSVG(selector) {
    return d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
}

// Function to update the color scale based on the selected attribute
function updateColorScale() {
    const maxValue = d3.max(data, d => d[choroplethAttribute]);
    colorScale = d3.scaleSequential(d3.interpolatePurples)
        .domain([0, maxValue]);
}

// Function to draw the choropleth map
function drawChoropleth() {
    svgChoropleth.selectAll("path").remove();

    const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(width);

    const path = d3.geoPath().projection(projection);

    svgChoropleth.selectAll("path")
        .data(counties)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
            const county = data.find(county => county.cnty_fips === d.id);
            return county ? colorScale(county[choroplethAttribute]) : "#ccc";
        })
        .on("mouseover", function(event, d) {
            const county = data.find(county => county.cnty_fips === d.id);
            if (county) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`County: ${county.display_name}<br>${getAttributeLabel(choroplethAttribute)}: ${county[choroplethAttribute]}${choroplethAttribute === "median_household_income" ? "$" : "%"}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Event listeners for dropdowns
d3.select("#histogram-select").on("change", function() {
    histogramAttribute = this.value;
    updateHistogram();
});

d3.select("#x-axis-select").on("change", function() {
    xAttribute = this.value;
    updateScatterplot();
});

d3.select("#y-axis-select").on("change", function() {
    yAttribute = this.value;
    updateScatterplot();
});

d3.select("#choropleth-select").on("change", function() {
    choroplethAttribute = this.value;
    updateColorScale();
    drawChoropleth();
});

// Function to update the histogram
function updateHistogram() {
    svgHistogram.selectAll("*").remove();
    createHistogram(svgHistogram, data, histogramAttribute, getAttributeLabel(histogramAttribute), d3.interpolateBlues);
}

// Function to create a histogram
function createHistogram(svg, data, attribute, label, colorScale) {
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[attribute])])
        .range([0, width]);

    const bins = d3.histogram()
        .value(d => d[attribute])
        .domain(x.domain())
        .thresholds(20)(data);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("class", "axis-label")
        .text(label);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("class", "axis-label")
        .text("Number of Counties");

    svg.selectAll("rect")
        .data(bins)
        .enter().append("rect")
        .attr("x", d => x(d.x0) + 1)
        .attr("y", d => y(d.length))
        .attr("width", d => x(d.x1) - x(d.x0) - 1)
        .attr("height", d => height - y(d.length))
        .attr("fill", d => colorScale(d.x0 / d3.max(bins, d => d.x1)))
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Count: ${d.length}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
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

    svgScatter.select(".x-axis-label")
        .text(getAttributeLabel(xAttribute));

    svgScatter.select(".y-axis-label")
        .text(getAttributeLabel(yAttribute));

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

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("class", "axis-label x-axis-label")
        .text(getAttributeLabel(xAttribute));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("class", "axis-label y-axis-label")
        .text(getAttributeLabel(yAttribute));

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
            tooltip.html(`County: ${d.display_name}<br>${getAttributeLabel(xAttribute)}: ${d[xAttribute]}${xAttribute === "median_household_income" ? "$" : "%"}<br>${getAttributeLabel(yAttribute)}: ${d[yAttribute]}${yAttribute === "median_household_income" ? "$" : "%"}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Helper function to get attribute label
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
