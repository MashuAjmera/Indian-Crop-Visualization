// Selecting the svg element
let drawSpace = d3.select("#drawspace");

// Reading the dataset and the geoJSON file for India
Promise.all([d3.csv("crop.csv"), d3.json("states.json")]).then(showData);

var mapInfo, reqData, drawSpaceW, drawSpaceH, cropInfo;

function showData(datasources) {
  drawSpaceH = 700;
  drawSpaceW = 700;

  // Saving the array read file into variavles
  cropInfo = datasources[0];
  mapInfo = datasources[1];

  //Making a list of the crops in the data
  let sel = "";
  let crop = [...new Set(cropInfo.map((d) => d.Crop))].sort();
  // Creating the select option dynamically using all the crops in the dataset
  crop.forEach((y) => (sel += `<option value="${y}">${y}</option>`));
  document.getElementById("crop").innerHTML = sel;
  // Making rice the default crop selected
  document.getElementById("crop").value = "Rice";

  //Making a list of years in the data
  let years = [...new Set(cropInfo.map((d) => d.Crop_Year))].sort();
  sel = "";
  // Creating the select option dynamically using all the years in the dataset
  years.forEach((y) => (sel += `<option value="${y}">${y}</option>`));
  document.getElementById("year").innerHTML = sel;

  // Calling the change function which calculates the values and draws the svg
  change();

  // stopping the loader after svg has been created
  document.getElementById("loading-container").style.display = "none";
}

function change() {
  //Making a list of states in the data
  let states = [...new Set(cropInfo.map((d) => d.State_Name))];

  let yearReq = document.getElementById("year").value; // Taking the input of the crop from user
  let cropReq = document.getElementById("crop").value; // Taking the input of the year from user

  //Taking the required data from the main data
  let cropInfoDist = {};
  cropInfoDist = cropInfo
    .map((d) => {
      if (yearReq == d.Crop_Year && cropReq == d.Crop) return d;
    })
    .filter((d) => d);

  //Extracting the production values
  let prodData = {};
  for (let c of cropInfoDist) {
    let state = c.State_Name;
    if (parseFloat(c.Production) !== NaN || c.Production !== "") {
      if (state in prodData) prodData[state] += parseFloat(c.Production);
      else prodData[state] = parseFloat(c.Production);
    }
  }

  //Extracting the area used for production
  let areaData = {};
  for (let c of cropInfoDist) {
    let state = c.State_Name;
    if (parseFloat(c.Area) !== NaN || c.Area !== "") {
      if (state in areaData) areaData[state] += parseFloat(c.Area);
      else areaData[state] = parseFloat(c.Area);
    }
  }

  //Making a list of the (production/area) statewise
  reqData = {};
  for (let state of states) {
    if (state in prodData && state in areaData) {
      reqData[state] = prodData[state] / areaData[state];
    } else {
      reqData[state] = 0;
    }
  }

  //Merging the data that is to be display with the map data
  mapInfo.features = mapInfo.features.map((d) => {
    let state = d.properties.st_nm;
    let prodPerArea = reqData[state];
    d.properties.prodPerArea = prodPerArea;
    return d;
  });

  // calculating the maximum Production per area for efficiency to make the color scale and legend
  let maxProdPerArea = d3.max(
    mapInfo.features,
    (d) => d.properties.prodPerArea
  );

  //Color Scale for the data
  let cScale = d3
    .scaleLinear()
    .domain([0, maxProdPerArea])
    .range(["white", "green"]);

  let color = d3.scaleQuantize([0, maxProdPerArea], d3.schemeGreens[6]);

  // removing the already created svgs before redrawing the new one
  d3.select("#statespace").select("svg").remove();
  d3.select("#barspace").select("svg").remove();

  // Adding the legend
  drawSpace
    .select("g")
    .remove()
    .append("g")
    .attr("transform", "translate(" + drawSpaceW / 2 + ",0)")
    .append(() =>
      legend({
        color,
        title: "Efficiency (t/ha)",
        width: 260,
        tickFormat: ".2f",
      })
    );

  //  Using geoMercator for our map projection
  let myProjection = d3.geoMercator().scale(1150).translate([-1300, 820]);
  let geoPath = d3.geoPath().projection(myProjection);

  //Creating the map and functionality to it.
  drawSpace
    .selectAll("path")
    .data(mapInfo.features)
    .enter()
    .append("path")
    .attr("d", (d) => geoPath(d))
    .attr("stroke", "black")
    .attr("fill", (d) =>
      d.properties.prodPerArea ? cScale(d.properties.prodPerArea) : "white"
    )
    .on("mouseenter", function () {
      this.style.opacity = 0.8;
    })
    .on("mouseout", function () {
      this.style.opacity = 1;
    })
    .on("click", (event, d) => {
      state(event, d, cropReq);
      bar(event, d, yearReq);
    }) //Creates a line chart of the state for the selected crop over the years
    .append("title") // shows a title tooltip to display region's information on hover
    .text(
      (d) =>
        `${d.properties.st_nm}\nProduction: ${
          prodData[d.properties.st_nm]
        } tonnes\nArea: ${areaData[d.properties.st_nm]} hectres\nEfficiency: ${
          d.properties.prodPerArea ? d.properties.prodPerArea.toFixed(2) : 0
        } t/ha`
    );
}

//For Creating the line chart
// Line Chart is for the state wise production of the selected crop over the years
function state(event, d, cropReq) {
  let years = [...new Set(cropInfo.map((d) => d.Crop_Year))].sort();
  let stateReq = d.properties.st_nm;

  //Selecting the data for the selected state and crop
  let cropInfoDistGraph = {};
  cropInfoDistGraph = cropInfo
    .map((d) => {
      if (stateReq == d.State_Name && cropReq == d.Crop) return d;
    })
    .filter((d) => d);

  //Extracting the prodction values by summing over all the production values for each year
  let prodDataGraph = {};
  for (let c of cropInfoDistGraph) {
    let year = c.Crop_Year;
    if (parseFloat(c.Production) !== NaN || c.Production !== "") {
      if (year in prodDataGraph)
        prodDataGraph[year] += parseFloat(c.Production);
      else prodDataGraph[year] = parseFloat(c.Production);
    }
  }

  //Extracting the area values by summing over all the areas for each year
  let areaDataGraph = {};
  for (let c of cropInfoDistGraph) {
    let year = c.Crop_Year;
    if (parseFloat(c.Area) !== NaN || c.Area !== "") {
      if (year in areaDataGraph) areaDataGraph[year] += parseFloat(c.Area);
      else areaDataGraph[year] = parseFloat(c.Area);
    }
  }

  //Making a list of the efficiecny= production/area yearwise
  let reqDataGraph = [];
  for (let year of years) {
    reqDataGraph.push({
      date: year,
      value:
        year in prodDataGraph && year in areaDataGraph
          ? prodDataGraph[year] / areaDataGraph[year]
          : 0,
    });
  }

  // set the dimensions and margins of the graph
  var margin = { top: 40, right: 30, bottom: 60, left: 60 },
    width = 700 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

  // removing the already created line chart(if any) before creating a new one
  d3.select("#statespace").select("svg").remove();

  // Formatting the Data
  var parseDate = d3.timeParse("%Y");
  reqDataGraph.forEach(function (d) {
    d.date = parseDate(d.date);
  });

  // x axis scale
  var xScale = d3
    .scaleTime()
    .domain(d3.extent(reqDataGraph, (d) => d.date))
    .range([0, width]);

  // Y axis scale
  var yScale = d3
    .scaleLinear()
    .domain([0, d3.max(reqDataGraph, (d) => d.value)])
    .range([height, 0]);

  // append the svg object to the body of the page
  var svg = d3
    .select("#statespace")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // X Gridlines
  svg
    .append("g")
    .attr("class", "grid")
    .style("opacity", "0.3")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale).ticks(5).tickSize(-height).tickFormat(""));

  // Y Gridlines
  svg
    .append("g")
    .attr("class", "grid")
    .style("opacity", "0.3")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""));

  //drawing x axis
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));

  //labelling x axis
  svg
    .append("text")
    .attr(
      "transform",
      "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
    )
    .style("text-anchor", "middle")
    .text("Year");

  // drawing y axis
  var axisleft = d3.axisLeft(yScale);
  axisleft.ticks(10);
  svg.append("g").call(axisleft);

  //labelling y axis
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Efficiency (tonne/ha)");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(
      `Production efficiency of ${cropReq} crop in ${stateReq} over the years`
    );

  // Add the line
  svg
    .append("path")
    .datum(reqDataGraph)
    // .attr("fill", "rgb(176,215,176)")
    .attr("fill", "#69b3a2")
    .style("opacity", "0.6")
    .attr("stroke", "rgb(49,163,84)")
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .area()
        .x((d) => xScale(d.date))
        .y0(yScale(0))
        .y1((d) => yScale(d.value))
        .defined((d) => !!d.value)
    );
}

function bar(event, d, yearReq) {
  let crops = [...new Set(cropInfo.map((d) => d.Crop))].sort();
  let stateReq = d.properties.st_nm;

  //Selecting the data for the selected state and crop
  let cropInfoDistGraph = {};
  cropInfoDistGraph = cropInfo
    .map((d) => {
      if (stateReq == d.State_Name && yearReq == d.Crop_Year) return d;
    })
    .filter((d) => d);

  //Extracting the prodction values by summing over all the production values for each year
  let prodDataGraph = {};
  for (let c of cropInfoDistGraph) {
    let crop = c.Crop;
    if (parseFloat(c.Production) !== NaN || c.Production !== "") {
      if (crop in prodDataGraph)
        prodDataGraph[crop] += parseFloat(c.Production);
      else prodDataGraph[crop] = parseFloat(c.Production);
    }
  }

  //Extracting the area values by summing over all the areas for each year
  let areaDataGraph = {};
  for (let c of cropInfoDistGraph) {
    let crop = c.Crop;
    if (parseFloat(c.Area) !== NaN || c.Area !== "") {
      if (crop in areaDataGraph) areaDataGraph[crop] += parseFloat(c.Area);
      else areaDataGraph[crop] = parseFloat(c.Area);
    }
  }

  //Making a list of the efficiecny= production/area yearwise
  let reqDataGraph = [];
  for (let crop of crops) {
    if (crop in prodDataGraph && crop in areaDataGraph) {
      reqDataGraph.push({
        crop: crop,
        value: prodDataGraph[crop] / areaDataGraph[crop],
      });
    }
  }

  console.log(reqDataGraph);

  // set the dimensions and margins of the graph
  var margin = { top: 40, right: 30, bottom: 150, left: 70 },
    width = 700 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

  // removing the already created line chart(if any) before creating a new one
  d3.select("#barspace").select("svg").remove();

  // append the svg object to the body of the page
  var svg = d3
    .select("#barspace")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // X axis
  var x = d3
    .scaleBand()
    .range([0, width])
    .domain(
      reqDataGraph.map(function (d) {
        return d.crop;
      })
    )
    .padding(0.2);

  svg
    .append("text")
    .attr(
      "transform",
      "translate(" + width / 2 + " ," + (height + margin.top + 80) + ")"
    )
    .style("text-anchor", "middle")
    .text("Crops");

  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis
  var y = d3
    .scaleLinear()
    .domain([0, d3.max(reqDataGraph, (d) => d.value)])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y).ticks(15));

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Efficiency (tonne/ha)");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(
      `Production efficiency of various crops grown in ${stateReq} in ${yearReq}`
    );

  // Bars
  // svg
  //   .selectAll("rect")
  //   .data(reqDataGraph)
  //   .enter()
  //   .append("rect")
  //   .attr("x", function (d) {
  //     return x(d.crop);
  //   })
  //   .attr("y", function (d) {
  //     return y(d.value);
  //   })
  //   .attr("width", x.bandwidth())
  //   .attr("height", function (d) {
  //     return height - y(d.value);
  //   })
  //   .attr("fill", "#69b3a2");

  // Bars
  svg
    .selectAll("mybar")
    .data(reqDataGraph)
    .enter()
    .append("rect")
    .attr("x", function (d) {
      return x(d.crop);
    })
    .attr("width", x.bandwidth())
    .attr("fill", "#69b3a2")
    // no bar at the beginning thus:
    .attr("height", function (d) {
      return height - y(0);
    }) // always equal to 0
    .attr("y", function (d) {
      return y(0);
    });

  // Animation
  svg
    .selectAll("rect")
    .transition()
    .duration(800)
    .attr("y", function (d) {
      return y(d.value);
    })
    .attr("height", function (d) {
      return height - y(d.value);
    })
    .delay(function (d, i) {
      return i * 100;
    });
}
