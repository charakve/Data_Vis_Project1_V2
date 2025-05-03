# [US County Data Visualization](https://data-vis-project-1-jet.vercel.app/) 

[Project Link](https://data-vis-project-1-jet.vercel.app/)

![Home Page](img/Homepage.png)

## 📌 Project Overview
This project is a data visualization dashboard that explores the relationship between socioeconomic and health indicators across US counties. The goal is to provide an interactive platform for users to analyze and understand how factors like poverty, median household income, stroke prevalence, and health insurance coverage vary across different regions in the United States.

### 🔍 Motivation
The motivation behind this project is to create a tool that allows users to visually explore and analyze the interplay between socioeconomic factors and health outcomes. By providing interactive visualizations, users can gain insights into how these factors are distributed geographically and how they correlate with each other. This can be particularly useful for policymakers, researchers, and public health officials who are interested in understanding regional disparities and planning interventions.

---

## 📊 Data
The data used in this project comes from the **US Heart and Stroke Atlas**, which provides county-level data on various health and socioeconomic indicators. The dataset includes the following attributes:
- **Poverty Percentage**: The percentage of the population living below the poverty line.
- **Stroke Prevalence**: The percentage of the population affected by stroke.
- **Median Household Income**: The median income of households in the county.
- **No Health Insurance (%)**: The percentage of the population without health insurance.

**Data Source**: [US Heart and Stroke Atlas](https://www.cdc.gov/dhdsp/maps/atlas/index.htm)

---

## 🎨 Visualization Components
The application consists of three main visualization components:

![Histogram Visualization](img/Histogram.png)
### 1️⃣ Histogram
- **Purpose**: Shows the distribution of a selected attribute (e.g., poverty percentage, stroke prevalence) across all US counties.
- **Interaction**: Users can select an attribute from the dropdown menu to update the histogram.
- **Example**: Selecting "Poverty Percentage" will display the distribution of poverty levels across counties.

![Scatterplot Visualization](img/Scatterplot.png)
### 2️⃣ Scatterplot
- **Purpose**: Explores the correlation between two selected attributes (e.g., poverty percentage vs. stroke prevalence).
- **Interaction**: Users can choose the X and Y axes from dropdown menus to visualize the relationship between two variables.
- **Example**: Plotting "Poverty Percentage" on the X-axis and "Stroke Prevalence" on the Y-axis can reveal whether higher poverty levels are associated with higher stroke rates.

![Choropleth Map Visualization](img/Choropleth.png)
### 3️⃣ Choropleth Map
- **Purpose**: Displays the spatial distribution of a selected attribute across US counties.
- **Interaction**: Users can select an attribute from the dropdown menu to update the map.
- **Example**: Selecting "Median Household Income" will color-code counties based on income levels, allowing users to see regional income disparities.
---

## Layout and Scrolling Justification
The visualizations are presented in a **single-page layout** with scrolling enabled. This design choice was made to ensure that each visualization has sufficient space to display detailed information without compromising readability. While the ideal scenario is to display all visualizations at once without scrolling, the complexity and size of the choropleth map, combined with the need for clear labeling and interactivity, make scrolling a practical solution.

### Why Scrolling?
1. **Choropleth Map Size**: The choropleth map requires a larger canvas to display county-level details clearly. Reducing its size would make it difficult to interpret the geographic distribution of data.
2. **Histogram and Scatterplot**: These visualizations also benefit from larger dimensions to ensure that axis labels, data points, and tooltips are easily readable.
3. **User Experience**: Scrolling allows users to focus on one visualization at a time, reducing cognitive overload and making it easier to interpret complex data.

### Assumed Page Size
The layout is designed for a **modern laptop screen** with a resolution of **1920x1080 pixels**. This ensures that the visualizations are appropriately sized and spaced for most users. While scrolling is required, the layout maintains a coherent structure, with clear headings and controls for each visualization.

---
---

## 🔍 Findings
Using this application, users can discover several interesting insights:
- **Poverty and Health Insurance**: Counties with higher poverty percentages tend to have higher rates of uninsured individuals.
- **Income and Stroke Prevalence**: There is a negative correlation between median household income and stroke prevalence, suggesting that wealthier counties have lower stroke rates.
- **Geographic Disparities**: The choropleth map reveals significant regional disparities in health and socioeconomic indicators, with certain regions (e.g., the South) showing higher poverty and stroke rates.

---

## ⚙️ Process
### 📚 Libraries Used
- **[D3.js](https://d3js.org/)**: A JavaScript library for creating dynamic, interactive data visualizations.
- **[TopoJSON](https://github.com/topojson/topojson)**: A library for encoding geographic data, used to render the choropleth map.

### 📂 Code Structure
- **HTML (`index.html`)**: Contains the structure of the dashboard, including dropdown menus and visualization containers.
- **CSS (`style.css`)**: Handles the styling and layout of the dashboard.
- **JavaScript (`script.js`)**: Contains the logic for loading data, creating visualizations, and handling user interactions.

### ▶️ Running the Application
1. Clone the repository:
   ```bash
   git clone https://github.com/charakve/Data-Vis-Project-1 
   Open `index.html` in your browser to view the dashboard.

---

## 🚀 Challenges and Future Work

### ⚠️ Challenges  
- **Data Cleaning**: Handling negative values and ensuring data consistency was a challenge, especially when converting CSV data into a usable format for visualizations.  
- **Performance**: Rendering the choropleth map for all US counties required optimizing the code to ensure smooth interactions.  
- **Tooltip Implementation**: Implementing interactive tooltips that display detailed information on hover was initially tricky but was resolved using D3's event handling.  
- **Brush and Tooltip Conflict**: Faced challenges in implementing brushing and tooltips simultaneously. DeepSeek was used to debug and resolve issues related to this conflict. I tried to implement brush, but the tooltip stopped working, so I couldn't implement both at once.  

### 🔮 Future Work
- **Additional Attributes**: Include more health and socioeconomic indicators to provide a more comprehensive analysis.
- **Advanced Interactions**: Implement brushing and linking between visualizations to allow users to explore subsets of data across different views.
- **Mobile Optimization**: Improve the responsiveness of the dashboard for mobile devices.

---

## 🤝 Use of AI and Collaboration

### 🤖 AI Assistance
- **Code Debugging**: DeepSeek was used to debug specific issues, such as handling negative values in the dataset, optimizing D3.js code, and resolving conflicts between brushing and tooltips in the choropleth map.
- **Documentation Refinement**: AI was used to help refine the documentation, including converting content to Markdown format and improving readability.

### 👫 Collaboration
- **Peer Feedback**: Collaborated with classmates to test the application and provide feedback on usability and performance. Special thanks to **Saad Mohammed**, **Hethu Sri Nadipudi**, and **Mosaad Mohammed** for their valuable feedback, particularly in suggesting that one dynamic histogram is sufficient instead of multiple static ones.
- **Debugging Help**: Received assistance from peers in resolving issues related to D3.js and TopoJSON integration.

---

## 🎥 Demo Video
📽️ **Watch the Demo Video Here** 👉 [YouTube Link](https://youtu.be/-LM9vEByrOg?si=Lc-f5ChTJFiHpCFs)
The video walks through the application, demonstrating how to interact with the visualizations and highlighting key features.

---

## 📌 How to Use
- **Histogram**: Select an attribute from the dropdown menu to view its distribution across counties.
- **Scatterplot**: Choose X and Y variables to explore correlations between attributes.
- **Choropleth Map**: Select an attribute to view its geographic distribution across US counties.

---

## 📜 Credits
- **Author**: Viraj Kishore Charakanam
- **Data Source**: [US Heart and Stroke Atlas](https://www.cdc.gov/dhdsp/maps/atlas/index.htm)
- **Libraries**: [D3.js](https://d3js.org/), [TopoJSON](https://github.com/topojson/topojson)
- **Peers**: Saad Mohammed, Hethu Sri Nadipudi, Mosaad Mohammed for their feedback and suggestions.
- **AI Tools**: DeepSeek for debugging and documentation refinement.
