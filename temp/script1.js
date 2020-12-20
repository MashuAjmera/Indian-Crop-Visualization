let drawSpace = d3.select("#drawspace");

Promise.all([d3.csv("crop.csv"), d3.json("states.json")]).
then(showData);

let year = []
let season = []

function showData(datasources) {

  let drawSpaceH = 600;
  let drawSpaceW = 600;

  let cropInfo = datasources[0];
  let mapInfo = datasources[1];

  year = [...new Set(cropInfo.map(d => (d.Crop_Year)))]
  year.sort()

  season = [...new Set(cropInfo.map(d => (d.Season)))]
  
  states = [...new Set(cropInfo.map(d => (d.State_Name)))]

  // console.log(states)
  // console.log(cropInfo)
  console.log(mapInfo)

  let yearReq = "2003"
  let seasonReq = "Kharif     "
  let cropReq = "Banana"

  let cropInfoDist = {}
  
  cropInfoDist = cropInfo.map(function (d) {
    if(yearReq == d.Crop_Year && cropReq == d.Crop){
      return d;
    }
  }).filter(function (d){
    if(d !== undefined)
      return true;
  })
  console.log(cropInfoDist)

  let prodData = {};
  for (let c of cropInfoDist) {
    let state = c.State_Name;
    
    if(parseFloat(c.Production) !== NaN || c.Production !== ""){

      if(state in prodData)
        prodData[state] += parseFloat(c.Production);

      else
        prodData[state] = parseFloat(c.Production);
    }
    

  }
  console.log(prodData)

  let areaData = {};
  for (let c of cropInfoDist) {
    let state = c.State_Name;

    if(parseFloat(c.Area) !== NaN || c.Area !== "")
    {
        if(state in areaData)
          areaData[state] += parseFloat(c.Area);
    
        else
          areaData[state] = parseFloat(c.Area);
    }
  }
  // console.log(areaData)

  let reqData = {}
  for(let state of states)
  {
    if(state in prodData && state in areaData){
      reqData[state] = prodData[state]/areaData[state]; 
    }

    else{
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

  let medianProdPerArea = d3.median(
    mapInfo.features,
    (d) => d.properties.prodPerArea
  );

  let cScale = d3
    .scaleLinear()
    .domain([0, maxProdPerArea])
    .range(["white", "brown"]);
    
  let color = d3.scaleQuantize([0, maxProdPerArea], d3.schemeReds[6]);
  drawSpace.append("g")
        .attr("transform", "translate("+drawSpaceW/2+",0)")
        .append(() => legend({color, title: "Efficiency", width: 260}));

  let myProjection = d3
    .geoMercator()
    .scale(950)
    .translate([-1050, 680]);

  let geoPath = d3.geoPath().projection(myProjection);

  drawSpace
    .selectAll("path")
    .data(mapInfo.features)
    .enter()
    .append("path")
    .attr("d", (d) => geoPath(d))
    .attr("stroke", "black")
    // .attr("fill", (d) => cScale(d.properties.population)); // black for missing by default
    .attr("fill", (d) =>
      d.properties.prodPerArea ? cScale(d.properties.prodPerArea) : "white"
    ).on("mouseenter", function () {
      this.style.opacity = 0.8;
      //   d3.select(this).attr("fill", "blue"); // try this
    }).on("mouseout", function () {
      this.style.opacity = 1;
      //   d3.select(this).attr("fill", "blue"); // try this
    })
    .append("title")
      .text(d => `${d.properties.st_nm}: ${d.properties.prodPerArea} `);
    
  //   .attr("fill", (d) =>
  //     d.properties.population ? cMScale(d.properties.population) : "blue"
  //   ); // for divergent scale
}