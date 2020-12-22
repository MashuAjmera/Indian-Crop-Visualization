let drawSpace = d3.select("#drawspace");
Promise.all([d3.csv("crop.csv"), d3.json("states.json")]).then(showData);

var mapInfo, reqData, drawSpaceW, drawSpaceH, cropInfo;

function showData(datasources) {
  drawSpaceH = 700;
  drawSpaceW = 700;

  cropInfo = datasources[0];
  mapInfo = datasources[1];

  let sel = "";

  let crop = [...new Set(cropInfo.map((d) => d.Crop))].sort();
  crop.forEach((y) => (sel += `<option value="${y}">${y}</option>`));
  document.getElementById("crop").innerHTML = sel;

  let years = [...new Set(cropInfo.map((d) => d.Crop_Year))].sort();
  sel = "";
  years.forEach((y) => (sel += `<option value="${y}">${y}</option>`));
  document.getElementById("year").innerHTML = sel;
  // console.log(mapInfo);

  change();
}

function change() {
  let states = [...new Set(cropInfo.map((d) => d.State_Name))];

  let yearReq = document.getElementById("year").value;
  let cropReq = document.getElementById("crop").value;
  // cropReq = "Rice";
  console.log(`year: ${yearReq}, crop: ${cropReq}`);

  let cropInfoDist = {};
  cropInfoDist = cropInfo
    .map((d) => {
      if (yearReq == d.Crop_Year && cropReq == d.Crop) return d;
    })
    .filter((d) => d);
  // console.log(cropInfoDist);

  let prodData = {};
  for (let c of cropInfoDist) {
    let state = c.State_Name;
    if (parseFloat(c.Production) !== NaN || c.Production !== "") {
      if (state in prodData) prodData[state] += parseFloat(c.Production);
      else prodData[state] = parseFloat(c.Production);
    }
  }
  // console.log(prodData)

  let areaData = {};
  for (let c of cropInfoDist) {
    let state = c.State_Name;
    if (parseFloat(c.Area) !== NaN || c.Area !== "") {
      if (state in areaData) areaData[state] += parseFloat(c.Area);
      else areaData[state] = parseFloat(c.Area);
    }
  }
  // console.log(areaData)

  reqData = {};
  for (let state of states) {
    if (state in prodData && state in areaData) {
      reqData[state] = prodData[state] / areaData[state];
    } else {
      reqData[state] = 0;
    }
  }
  // console.log(reqData)

  mapInfo.features = mapInfo.features.map((d) => {
    let state = d.properties.st_nm;
    let prodPerArea = reqData[state];
    d.properties.prodPerArea = prodPerArea;
    return d;
  });
  // console.log(mapInfo.features)

  let maxProdPerArea = d3.max(
    mapInfo.features,
    (d) => d.properties.prodPerArea
  );

  let cScale = d3
    .scaleLinear()
    .domain([0, maxProdPerArea])
    .range(["white", "green"]);

  let color = d3.scaleQuantize([0, maxProdPerArea], d3.schemeGreens[6]);
  drawSpace.select("g").remove();
  drawSpace.selectAll("path").remove();
  d3.select("#statespace").select("svg").remove();

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
    .on("click", (event, d) => state(event, d, cropReq))
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
  ).innerHTML = `Click on a region to see the details of ${cropReq} crop and crops grown in ${yearReq} there.`;
}

function state(event, d, cropReq) {
  // console.log(d)
  // console.log(cropReq)

  let years = [...new Set(cropInfo.map((d) => d.Crop_Year))].sort();
  let stateReq = d.properties.st_nm;

  let cropInfoDistGraph = {};
  cropInfoDistGraph = cropInfo
    .map((d) => {
      if (stateReq == d.State_Name && cropReq == d.Crop) return d;
    })
    .filter((d) => d);
  // console.log(cropInfoDistGraph);

  let prodDataGraph = {};
  for (let c of cropInfoDistGraph) {
    let year = c.Crop_Year;
    if (parseFloat(c.Production) !== NaN || c.Production !== "") {
      if (year in prodDataGraph)
        prodDataGraph[year] += parseFloat(c.Production);
      else prodDataGraph[year] = parseFloat(c.Production);
    }
  }
  // console.log(prodDataGraph)

  let areaDataGraph = {};
  for (let c of cropInfoDistGraph) {
    let year = c.Crop_Year;
    if (parseFloat(c.Area) !== NaN || c.Area !== "") {
      if (year in areaDataGraph) areaDataGraph[year] += parseFloat(c.Area);
      else areaDataGraph[year] = parseFloat(c.Area);
    }
  }
  // console.log(areaDataGraph)

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
  // console.log(reqDataGraph)

  // set the dimensions and margins of the graph
  var margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 1000 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  // append the svg object to the body of the page

  d3.select("#statespace").select("svg").remove();

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

  var xScale = d3
    .scaleTime()
    .domain(d3.extent(reqDataGraph, (d) => d.date))
    .range([0, width]);

  // Add Y axis
  var yScale = d3
    .scaleLinear()
    .domain([0, d3.max(reqDataGraph, (d) => d.value)])
    .range([height, 0]);

  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));
  svg.append("g").call(d3.axisLeft(yScale));

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
    );
}
