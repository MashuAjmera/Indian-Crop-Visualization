let drawSpace = d3.select("#drawspace");
Promise.all([d3.csv("crop.csv"), d3.json("states.json")]).then(showData);

var mapInfo, reqData, drawSpaceW, drawSpaceH, cropInfo;

function showData(datasources) {
  drawSpaceH = 700;
  drawSpaceW = 700;

  cropInfo = datasources[0];
  mapInfo = datasources[1];

  let sel = "";

  //Making a list of the crops in the data
  let crop = [...new Set(cropInfo.map((d) => d.Crop))].sort();
  crop.forEach((y) => (sel += `<option value="${y}">${y}</option>`));
  document.getElementById("crop").innerHTML = sel; 

  //Making a list of years in the data
  let years = [...new Set(cropInfo.map((d) => d.Crop_Year))].sort();
  sel = "";
  years.forEach((y) => (sel += `<option value="${y}">${y}</option>`));
  document.getElementById("year").innerHTML = sel; 

  change();
}

function change() {
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
  drawSpace.select("g").remove();
  drawSpace.selectAll("path").remove();
  d3.select("#statespace").select("svg").remove();

  //Adding the tags/area where map would be drawn
  drawSpace
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
    .on("click", (event, d) => state(event, d, cropReq)) //Creates a line chart of the state for the selected crop over the years
    .append("title")
    .text(
      (d) =>
        `${d.properties.st_nm}\nProduction: ${
          prodData[d.properties.st_nm]
        } tonnes\nArea: ${areaData[d.properties.st_nm]} hectres\nEfficiency: ${
          d.properties.prodPerArea ? d.properties.prodPerArea.toFixed(2) : 0
        } t/ha`
    );

  document.getElementById("loading-container").style.visibility = "hidden";

  document.getElementById(
    "guideText"
  ).innerHTML = `Click on a region to see the trend of ${cropReq} crop there over the years.`;
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

  //Extracting the prodction values 
  let prodDataGraph = {};
  for (let c of cropInfoDistGraph) {
    let year = c.Crop_Year;
    if (parseFloat(c.Production) !== NaN || c.Production !== "") {
      if (year in prodDataGraph)
        prodDataGraph[year] += parseFloat(c.Production);
      else prodDataGraph[year] = parseFloat(c.Production);
    }
  }

  //Extracting the prodction values 
  let areaDataGraph = {};
  for (let c of cropInfoDistGraph) {
    let year = c.Crop_Year;
    if (parseFloat(c.Area) !== NaN || c.Area !== "") {
      if (year in areaDataGraph) areaDataGraph[year] += parseFloat(c.Area);
      else areaDataGraph[year] = parseFloat(c.Area);
    }
  }

  //Making a list of the production/area yearwise 
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
    width = 1000 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  d3.select("#statespace").select("svg").remove();

  // append the svg object to the body of the page
  var svg = d3
    .select("#statespace")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  /* Format Data */
  var parseDate = d3.timeParse("%Y");
  reqDataGraph.forEach(function (d) {
    d.date = parseDate(d.date);
    d.price = d.price;
  });

  //x axis scale
  var xScale = d3
    .scaleTime()
    .domain(d3.extent(reqDataGraph, (d) => d.date))
    .range([0, width]);

  // Y axis scale
  var yScale = d3
    .scaleLinear()
    .domain([0, d3.max(reqDataGraph, (d) => d.value)])
    .range([height, 0]);

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
  svg.append("g").call(d3.axisLeft(yScale));

  //labelling y axis
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Efficiency");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(`Production efficiency of ${cropReq} in ${stateReq} over the years`);
  // Add the line
  svg
    .append("path")
    .datum(reqDataGraph)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .defined((d) => !!d.value)
    );
}
