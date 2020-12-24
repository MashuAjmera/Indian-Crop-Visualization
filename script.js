// Reading the dataset and the geoJSON file for India
Promise.all([d3.csv("crop.csv"), d3.json("states.json")]).then(showData);

var mapInfo,
  reqData,
  drawSpaceW = 700,
  drawSpaceH = 700,
  cropInfo;

function makeGeoPath(mapInfo) {
  let myProjection = d3.geoMercator().scale(1).translate([0, 0]);
  let geoPath = d3.geoPath().projection(myProjection);
  var b = geoPath.bounds(mapInfo),
    s =
      0.95 /
      Math.max(
        (b[1][0] - b[0][0]) / drawSpaceW,
        (b[1][1] - b[0][1]) / drawSpaceH
      ),
    t = [
      (drawSpaceW - s * (b[1][0] + b[0][0])) / 2,
      (drawSpaceH - s * (b[1][1] + b[0][1])) / 2,
    ];
  myProjection.scale(s).translate(t);
  return geoPath;
}

function drawLegend(maxprodPerArea) {
  let color = d3.scaleQuantize([0, maxprodPerArea], d3.schemeGreens[6]);

  let lgnd = d3.select("#legend");
  lgnd.select("svg").remove();
  lgnd
    .append("svg")
    .attr("height", "50px")
    .append("g")
    .attr("transform", "translate(0,0)")
    .append(() =>
      legend({
        color,
        title: "Efficiency (t/ha)",
        width: 260,
        tickFormat: ".2f",
      })
    );
}

function calculate(distribution, property) {
  //Extracting the prodction and area values by summing over all the values
  let prodData = {},
    areaData = {};

  for (let c of distribution) {
    let prop =
      property == "state"
        ? c.State_Name
        : property == "crop"
        ? c.Crop
        : property == "year"
        ? c.Crop_Year
        : property == "district"
        ? c.District_Name
        : undefined;

    if (parseFloat() !== NaN || c.Production !== "") {
      prodData[prop] =
        prop in prodData
          ? prodData[prop] + parseFloat(c.Production)
          : parseFloat(c.Production);
    }

    if (parseFloat(c.Area) !== NaN || c.Area !== "") {
      areaData[prop] =
        prop in areaData
          ? areaData[prop] + parseFloat(c.Area)
          : parseFloat(c.Area);
    }
  }

  return [prodData, areaData];
}

function showData(datasources) {
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
  console.log("func called");
  //Making a list of states in the data
  let yearReq = document.getElementById("year").value; // Taking the input of the crop from user
  let cropReq = document.getElementById("crop").value; // Taking the input of the year from user

  //Taking the required data from the main data
  let cropInfoDist = {};
  cropInfoDist = cropInfo.filter(
    (d) => yearReq == d.Crop_Year && cropReq == d.Crop
  );

  let [prodData, areaData] = calculate(cropInfoDist, "state");

  //Merging the data that is to be display with the map data
  mapInfo.features = mapInfo.features.map((d) => {
    let state = d.properties.st_nm;
    d.properties.prodPerArea =
      state in prodData && state in areaData
        ? prodData[state] / areaData[state]
        : 0;
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

  drawLegend(maxProdPerArea);

  // removing the already created svgs before redrawing the new one
  d3.select("#statespace").select("svg").remove();
  d3.select("#barspace").select("svg").remove();

  // Selecting the svg element
  let drawSpace = d3.select("#drawspace");
  drawSpace.selectAll("path").remove();

  //  Using geoMercator for our map projection
  let geoPath = makeGeoPath(mapInfo);

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
      map(event, d, cropReq, yearReq);
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

  document.getElementById("info").innerHTML =
    "Click on a region to see its details.";
}

//For Creating the line chart
// Line Chart is for the state wise production of the selected crop over the years
function state(event, d, cropReq) {
  let years = [...new Set(cropInfo.map((d) => d.Crop_Year))].sort();
  let stateReq = d.properties.st_nm;

  //Selecting the data for the selected state and crop
  let cropInfoDistGraph = {};
  cropInfoDistGraph = cropInfo.filter(
    (d) => stateReq == d.State_Name && cropReq == d.Crop
  );

  let [prodDataGraph, areaDataGraph] = calculate(cropInfoDistGraph, "year");

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
  reqDataGraph.forEach((d) => (d.date = parseDate(d.date)));

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

  //Selecting the data for the selected state and year
  let cropInfoDistGraph = {};
  cropInfoDistGraph = cropInfo.filter(
    (d) => stateReq == d.State_Name && yearReq == d.Crop_Year
  );

  let [prodDataGraph, areaDataGraph] = calculate(cropInfoDistGraph, "crop");

  //Making a list of the efficiecny= production/area cropwise
  let reqDataGraph = [];
  for (let crop of crops) {
    if (crop in prodDataGraph && crop in areaDataGraph) {
      reqDataGraph.push({
        crop: crop,
        value: prodDataGraph[crop] / areaDataGraph[crop],
      });
    }
  }
  reqDataGraph.sort((b, a) => a.value - b.value); // sort descending

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
  var xScale = d3
    .scaleBand()
    .range([0, width])
    .domain(reqDataGraph.map((d) => d.crop))
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
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis
  var yScale = d3
    .scaleLinear()
    .domain([0, d3.max(reqDataGraph, (d) => d.value)])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(yScale).ticks(15));

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
  svg
    .selectAll("mybar")
    .data(reqDataGraph)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.crop))
    .attr("width", xScale.bandwidth())
    .attr("fill", "#69b3a2")
    // no bar at the beginning thus:
    .attr("height", height - yScale(0)) // always equal to 0
    .attr("y", yScale(0))
    .append("title") // shows a title tooltip to display region's information on hover
    .text((d) => `Efficiency: ${d.value.toFixed(2)} t/ha`);

  // Animation
  svg
    .selectAll("rect")
    .transition()
    .duration(800)
    .attr("y", (d) => yScale(d.value))
    .attr("height", (d) => height - yScale(d.value))
    .delay((d, i) => i * 100);
}

function map(event, d, cropReq, yearReq) {
  var stateReq = d.properties.st_nm; // Taking the input of the state from user

  d3.json(`maps/${stateReq}.json`).then((datasources) => {
    var mapInfo = topojson.feature(datasources, datasources.objects.districts);

    let cropInfoDist = [];
    cropInfoDist = cropInfo
      .filter(
        (d) =>
          yearReq == d.Crop_Year &&
          cropReq == d.Crop &&
          stateReq == d.State_Name
      )
      .map((d) => {
        d.District_Name = d.District_Name.toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return d;
      });

    let [prodData, areaData] = calculate(cropInfoDist, "district");

    mapInfo.features = mapInfo.features.map((d) => {
      let district = d.properties.district;
      d.properties.prodPerArea =
        district in prodData && district in areaData
          ? prodData[district] / areaData[district]
          : 0;
      return d;
    });

    let maxprodPerArea = d3.max(
      mapInfo.features,
      (d) => d.properties.prodPerArea
    );
    let cScale = d3
      .scaleLinear()
      .domain([0, maxprodPerArea])
      .range(["white", "green"]);

    // Adding the legend
    drawLegend(maxprodPerArea);

    let geoPath = makeGeoPath(mapInfo);

    let drawSpace = d3.select("#drawspace");
    drawSpace.selectAll("path").remove();

    drawSpace
      .selectAll("path")
      .data(mapInfo.features)
      .enter()
      .append("path")
      .attr("d", (d) => geoPath(d))
      .attr("stroke", "black")
      .attr("fill", (d) =>
        d.properties.prodPerArea ? cScale(d.properties.prodPerArea) : "white"
      ) // for divergent scale
      .append("title") // shows a title tooltip to display region's information on hover
      .text(
        (d) =>
          `${d.properties.district}\nProduction: ${
            prodData[d.properties.district]
          } tonnes\nArea: ${
            areaData[d.properties.district]
          } hectres\nEfficiency: ${
            d.properties.prodPerArea ? d.properties.prodPerArea.toFixed(2) : 0
          } t/ha`
      );
  });

  let obj = document.getElementById("info");
  obj.innerHTML = "Click here or make another selection to go back.";
  obj.addEventListener("click", change);
}
