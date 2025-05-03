// Combined visualization script with enhanced features
document.addEventListener("DOMContentLoaded", function () {
  // ─── SETUP DIMENSIONS & MARGIN ───────────────────────────────────────
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const histW = 300 - margin.left - margin.right;
  const histH = 240 - margin.top - margin.bottom;
  const scatW = 300 - margin.left - margin.right;
  const scatH = 240 - margin.top - margin.bottom;
  const mapW = 620 - margin.left - margin.right;
  const mapH = 260 - margin.top - margin.bottom;

  // Color theme - using a consistent palette
  const colorTheme = {
    primary: "#4e79a7", // Blue for primary elements
    secondary: "#f28e2c", // Orange for secondary/highlight
    tertiary: "#e15759", // Red for tertiary elements
    background: "#f9f9f9", // Light background
    lightShade: "#eaeaea", // Light shade
    darkShade: "#76b7b2", // Dark shade
    highlight: "#59a14f", // Green highlight
    sequential: d3.interpolateBlues, // Sequential color scale
  };

  // ─── CREATE SVGs WITH viewBox FOR RESPONSIVENESS ──────────────────────
  function createSVG(sel, w, h) {
    const container = d3.select(sel);
    container.selectAll("svg").remove();
    return container
      .append("svg")
      .attr(
        "viewBox",
        `0 0 ${w + margin.left + margin.right} ${
          h + margin.top + margin.bottom
        }`
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  }

  const svgHist = createSVG("#histogram", histW, histH);
  const svgScat = createSVG("#scatterplot", scatW, scatH);
  const svgMap = createSVG("#choropleth", mapW, mapH);

  const svgLegend = d3
    .select("#choropleth-legend")
    .append("svg")
    .attr("width", 300)
    .attr("height", 40);

  // ─── TOOLTIP ──────────────────────────────────────────────────────────
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // ─── GLOBAL STATE ─────────────────────────────────────────────────────
  let fullData = [],
    counties = [];
  let selectedData = [];
  let currentBrushSelection = null;
  let colorScale;

  let scatterXScale = d3.scaleLinear();
  let scatterYScale = d3.scaleLinear();

  // Get initial attribute selections from the DOM
  let histAttr = d3.select("#histogram-select").property("value");
  let xAttr = d3.select("#x-axis-select").property("value");
  let yAttr = d3.select("#y-axis-select").property("value");
  let mapAttr = d3.select("#choropleth-select").property("value");

  // ─── LOAD & INITIALIZE ────────────────────────────────────────────
  Promise.all([
    d3.csv("data.csv", (d) => ({
      poverty_perc: +d.poverty_perc >= 0 ? +d.poverty_perc : 0,
      percent_stroke: +d.percent_stroke >= 0 ? +d.percent_stroke : 0,
      median_household_income:
        +d.median_household_income >= 0 ? +d.median_household_income : 0,
      percent_no_health_insurance:
        +d.percent_no_health_insurance >= 0
          ? +d.percent_no_health_insurance
          : 0,
      display_name: d.display_name,
      cnty_fips: d.cnty_fips,
    })),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
  ])
    .then(([rows, us]) => {
      // Filter out entries without valid FIPS codes
      fullData = rows.filter((d) => d.cnty_fips);
      selectedData = [...fullData];

      // Handle case where X and Y attributes are the same
      if (xAttr === yAttr) {
        yAttr =
          xAttr === "poverty_perc" ? "median_household_income" : "poverty_perc";
        d3.select("#y-axis-select").property("value", yAttr);
      }

      counties = topojson.feature(us, us.objects.counties).features;

      // Initial setup
      setupVisibilityControls();
      updateColorScale();
      drawHist();
      drawScat();
      drawMap();
      drawLegend();
    })
    .catch((error) => console.error("Error loading data:", error));

  // ─── CONTROL LISTENERS ─────────────────────────────────────────────
  d3.select("#histogram-select").on("change", function () {
    histAttr = this.value;
    drawHist();
  });

  d3.select("#x-axis-select").on("change", function () {
    xAttr = this.value;
    if (xAttr === yAttr) {
      yAttr =
        xAttr === "poverty_perc" ? "median_household_income" : "poverty_perc";
      d3.select("#y-axis-select").property("value", yAttr);
    }
    drawScat();
    if (currentBrushSelection) {
      handleBrushEnd({ selection: currentBrushSelection });
    }
  });

  d3.select("#y-axis-select").on("change", function () {
    yAttr = this.value;
    if (xAttr === yAttr) {
      xAttr =
        yAttr === "poverty_perc" ? "median_household_income" : "poverty_perc";
      d3.select("#x-axis-select").property("value", xAttr);
    }
    drawScat();
    if (currentBrushSelection) {
      handleBrushEnd({ selection: currentBrushSelection });
    }
  });

  d3.select("#choropleth-select").on("change", function () {
    mapAttr = this.value;
    updateColorScale();
    drawMap();
    drawLegend();
  });

  // ─── UTILITIES ────────────────────────────────────────────────────
  function getLabel(attr) {
    switch (attr) {
      case "poverty_perc":
        return "Poverty Percentage (%)";
      case "percent_stroke":
        return "Stroke Prevalence (%)";
      case "median_household_income":
        return "Median Income ($)";
      case "percent_no_health_insurance":
        return "No Insurance (%)";
      default:
        return attr.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  function updateColorScale() {
    // Always base scale on full data range for consistency
    const dataForScale = fullData;
    const values = dataForScale
      .map((d) => d[mapAttr])
      .filter((v) => v !== undefined && !isNaN(v));

    if (values.length === 0) {
      colorScale = d3.scaleSequential(colorTheme.sequential).domain([0, 1]);
      return;
    }

    const maxVal = d3.max(values);
    const minVal = d3.min(values);
    const domainMin = Math.max(0, minVal);

    colorScale = d3
      .scaleSequential(colorTheme.sequential)
      .domain([domainMin, maxVal])
      .nice();
  }

  // ─── VISIBILITY CONTROLS SETUP ─────────────────────────────────────
  function setupVisibilityControls() {
    const checkboxes = {
      hist: d3.select("#show-histogram"),
      scatter: d3.select("#show-scatterplot"),
      choropleth: d3.select("#show-choropleth"),
    };

    // Panel IDs MUST match the HTML
    const panels = {
      hist: d3.select("#histogram-panel"),
      scatter: d3.select("#scatterplot-panel"),
      choropleth: d3.select("#choropleth-panel"),
    };

    const container = d3.select("#visualizations"); // The grid container

    function updateLayout() {
      let visibleCount = 0;
      Object.keys(checkboxes).forEach((key) => {
        const isChecked = checkboxes[key].property("checked");
        panels[key].classed("hidden", !isChecked); // Add/remove hidden class
        if (isChecked) {
          visibleCount++;
        }
      });
      // Update container class for potential CSS rules
      container.attr("class", `show-${visibleCount}`);
    }

    // Add event listeners to checkboxes
    Object.values(checkboxes).forEach((cb) => cb.on("change", updateLayout));

    // Initial call to set visibility
    updateLayout();
  }

  // ─── BRUSH HANDLING ─────────────────────────────────────────────────
  function handleBrushStart() {
    // Disable pointer events on points while brushing
    svgScat.selectAll("circle.scatter-point").style("pointer-events", "none");
  }

  function handleBrush({ selection }) {
    currentBrushSelection = selection;

    if (selection) {
      // Filter data based on brush selection
      const [[x0, y0], [x1, y1]] = selection;
      selectedData = fullData.filter((d) => {
        const cx = scatterXScale(d[xAttr]);
        const cy = scatterYScale(d[yAttr]);
        return (
          !isNaN(cx) &&
          !isNaN(cy) &&
          cx >= x0 &&
          cx <= x1 &&
          cy >= y0 &&
          cy <= y1
        );
      });
    } else {
      // If no selection, use all data
      selectedData = [...fullData];
    }

    // Update styling based on selection
    applyBrushStyle();
  }

  function handleBrushEnd({ selection, sourceEvent }) {
    // Allow clicks on overlay when not actively brushing
    svgScat.select(".brush .overlay").style("pointer-events", "all");

    if (!selection && sourceEvent && sourceEvent.type !== "end") {
      // Clear brush when clicking outside of it
      currentBrushSelection = null;
      selectedData = [...fullData];
      d3.select(this).call(brush.move, null);
    } else {
      currentBrushSelection = selection;
    }

    // Restore pointer events for points if brush is cleared
    if (!currentBrushSelection) {
      svgScat.selectAll("circle.scatter-point").style("pointer-events", "all");
    }

    // Update all linked visualizations with smooth transitions
    applyBrushStyle();
    drawHist();
    drawMap();
    drawLegend();
  }

  function applyBrushStyle() {
    const isBrushed = currentBrushSelection !== null;
    const selectedFips = isBrushed
      ? new Set(selectedData.map((d) => d.cnty_fips))
      : new Set();

    // Apply appropriate classes based on selection with transition
    svgScat
      .selectAll("circle.scatter-point")
      .transition()
      .duration(300)
      .attr("fill", (d) =>
        isBrushed && selectedFips.has(d.cnty_fips)
          ? colorTheme.secondary
          : colorTheme.primary
      )
      .attr("r", (d) => (isBrushed && selectedFips.has(d.cnty_fips) ? 5 : 3))
      .style("opacity", (d) =>
        isBrushed && !selectedFips.has(d.cnty_fips) ? 0.2 : 0.8
      );
  }

  // ─── DRAW HISTOGRAM ────────────────────────────────────────────────
  function drawHist() {
    // Use selected data if brush is active, otherwise use full data
    const dataset =
      selectedData.length > 0 && currentBrushSelection
        ? selectedData
        : fullData;

    svgHist.selectAll("*").remove();

    // Filter out undefined/NaN values
    const values = dataset
      .map((d) => d[histAttr])
      .filter((v) => v !== undefined && !isNaN(v));

    if (values.length === 0) {
      // Display message if no data
      svgHist
        .append("text")
        .text("No data in selection.")
        .attr("x", histW / 2)
        .attr("y", histH / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "10px");
      return;
    }

    // Set up scales using full data domain for consistency
    const xDomain = d3.extent(fullData, (d) => d[histAttr]);
    const x = d3.scaleLinear().domain(xDomain).nice().range([0, histW]);

    // Create histogram bins
    const bins = d3
      .histogram()
      .value((d) => d[histAttr])
      .domain(x.domain())
      .thresholds(15)(
      dataset.filter((d) => d[histAttr] !== undefined && !isNaN(d[histAttr]))
    );

    // Set up y scale
    const yMax = d3.max(bins, (b) => b.length);
    const yDomain = [0, yMax > 0 ? yMax : 1];
    const y = d3.scaleLinear().domain(yDomain).nice().range([histH, 0]);

    // Draw axes
    svgHist
      .append("g")
      .attr("transform", `translate(0,${histH})`)
      .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));
    svgHist.append("g").call(d3.axisLeft(y).ticks(5));

    // Add axis labels
    svgHist
      .append("text")
      .attr("class", "axis-label")
      .attr("x", histW / 2)
      .attr("y", histH + margin.bottom - 15)
      .attr("text-anchor", "middle")
      .text(getLabel(histAttr));
    svgHist
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -histH / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .text("Count");

    // Draw histogram bars with transition
    const bars = svgHist
      .selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.x0) + 1)
      .attr("y", histH) // Start from bottom for transition
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("height", 0) // Start with height 0 for transition
      .attr("fill", colorTheme.primary)
      .on("mouseover", (e, b) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `Range: ${b.x0.toFixed(1)}-${b.x1.toFixed(1)}<br>Count: ${b.length}`
          )
          .style("left", e.pageX + 5 + "px")
          .style("top", e.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Apply transition for bar animation
    bars
      .transition()
      .duration(500)
      .attr("y", (d) => y(d.length))
      .attr("height", (d) => Math.max(0, histH - y(d.length)));
  }

  // ─── DRAW SCATTERPLOT & BRUSH ─────────────────────────────────────
  function drawScat() {
    const dataset = fullData;
    svgScat.selectAll("*").remove();

    // Filter out undefined/NaN values
    const xValues = dataset
      .map((d) => d[xAttr])
      .filter((v) => v !== undefined && !isNaN(v));
    const yValues = dataset
      .map((d) => d[yAttr])
      .filter((v) => v !== undefined && !isNaN(v));

    if (xValues.length === 0 || yValues.length === 0) {
      // Display message if no data
      svgScat
        .append("text")
        .text("No data.")
        .attr("x", scatW / 2)
        .attr("y", scatH / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "10px");
      return;
    }

    // Set up scales
    scatterXScale.domain(d3.extent(xValues)).nice().range([0, scatW]);
    scatterYScale.domain(d3.extent(yValues)).nice().range([scatH, 0]);

    // Draw axes
    svgScat
      .append("g")
      .attr("transform", `translate(0,${scatH})`)
      .call(d3.axisBottom(scatterXScale).ticks(5));
    svgScat.append("g").call(d3.axisLeft(scatterYScale).ticks(5));

    // Add axis labels
    svgScat
      .append("text")
      .attr("class", "axis-label")
      .attr("x", scatW / 2)
      .attr("y", scatH + margin.bottom - 15)
      .attr("text-anchor", "middle")
      .text(getLabel(xAttr));
    svgScat
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -scatH / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .text(getLabel(yAttr));

    // Draw scatterplot points with transition
    svgScat
      .selectAll(".scatter-point")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("class", "scatter-point")
      .attr("cx", (d) => scatterXScale(d[xAttr]))
      .attr("cy", (d) => scatterYScale(d[yAttr]))
      .attr("r", 0) // Start with radius 0 for transition
      .attr("fill", colorTheme.primary)
      .style("opacity", 0.8)
      .on("mouseover", (e, d) => {
        // Highlight point on hover
        d3.select(e.target)
          .transition()
          .duration(150)
          .attr("r", 7)
          .attr("fill", colorTheme.highlight);

        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `<strong>${d.display_name.replace(/"/g, "")}</strong><br>` +
              `${getLabel(xAttr)}: ${d[xAttr].toLocaleString()}<br>` +
              `${getLabel(yAttr)}: ${d[yAttr].toLocaleString()}`
          )
          .style("left", e.pageX + 5 + "px")
          .style("top", e.pageY - 28 + "px");
      })
      .on("mouseout", (e) => {
        // Restore point style on mouseout
        d3.select(e.target)
          .transition()
          .duration(150)
          .attr("r", 3)
          .attr("fill", colorTheme.primary);

        tooltip.transition().duration(500).style("opacity", 0);
      })
      .transition() // Apply entrance transition
      .duration(500)
      .delay((d, i) => i % 10) // Stagger effect
      .attr("r", 3);

    // Setup brush
    brush = d3
      .brush()
      .extent([
        [0, 0],
        [scatW, scatH],
      ])
      .on("start", handleBrushStart)
      .on("brush", handleBrush)
      .on("end", handleBrushEnd);

    // Add brush to scatterplot
    const brushLayer = svgScat.append("g").attr("class", "brush").call(brush);

    // Push brush below points for better interaction
    brushLayer.lower();
  }

  // ─── DRAW CHOROPLETH MAP ───────────────────────────────────────────
  function drawMap() {
    svgMap.selectAll("*").remove();

    // Set up projection
    const projection = d3
      .geoAlbersUsa()
      .translate([mapW / 2, mapH / 2])
      .scale(mapW);
    const path = d3.geoPath().projection(projection);

    // Draw counties with transition
    svgMap
      .selectAll("path")
      .data(counties)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#eee") // Initial color for transition
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.2)
      .on("mouseover", (e, d) => {
        // Find county data for tooltip
        const county = fullData.find((c) => c.cnty_fips === d.id);
        if (county) {
          // Highlight county on hover
          d3.select(e.target)
            .transition()
            .duration(150)
            .attr("stroke", "#000")
            .attr("stroke-width", 1);

          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              `<strong>${county.display_name.replace(/"/g, "")}</strong><br>` +
                `${getLabel(mapAttr)}: ${
                  county[mapAttr] ? county[mapAttr].toLocaleString() : "No data"
                }`
            )
            .style("left", e.pageX + 5 + "px")
            .style("top", e.pageY - 28 + "px");
        }
      })
      .on("mouseout", (e) => {
        // Restore county style on mouseout
        d3.select(e.target)
          .transition()
          .duration(150)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.2);

        tooltip.transition().duration(500).style("opacity", 0);
      })
      .transition() // Apply color transition
      .duration(500)
      .attr("fill", (d) => {
        // Find county data by FIPS code
        const county =
          selectedData.length > 0 && currentBrushSelection
            ? selectedData.find((c) => c.cnty_fips === d.id)
            : fullData.find((c) => c.cnty_fips === d.id);

        // Color by attribute or gray if no data available
        return county ? colorScale(county[mapAttr]) : "#ccc";
      });
  }

  // ─── DRAW COLOR LEGEND ─────────────────────────────────────────────
  function drawLegend() {
    svgLegend.selectAll("*").remove();

    // Center the legend better
    const svgWidth = 300;
    const legendWidth = 260;
    const legendHeight = 18;
    const legendX = (svgWidth - legendWidth) / 2; // Center horizontally
    const legendY = 5; // Move up slightly

    // Create gradient for legend
    const defs = svgLegend.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    // Create color stops
    const stops = d3.range(0, 1.1, 0.1);
    stops.forEach((stop) => {
      gradient
        .append("stop")
        .attr("offset", `${stop * 100}%`)
        .attr("stop-color", colorScale.interpolator()(stop));
    });

    // Draw gradient rectangle
    svgLegend
      .append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .style("stroke", "#ccc")
      .style("stroke-width", "0.5px");

    // Draw legend axis
    const legendScale = d3
      .scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(5)
      .tickFormat((d) => d.toLocaleString());

    svgLegend
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("font-weight", "500");

    // Add legend title
    svgLegend
      .append("text")
      .attr("class", "legend-title")
      .attr("x", svgWidth / 2)
      .attr("y", legendY + legendHeight + 25)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text(getLabel(mapAttr));
  }
});
