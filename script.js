let drawSpace = d3.select("#drawspace");
Promise.all([d3.csv("crop.csv"), d3.json("states.json")]).then(
  showData
);

function showData(datasources) {
  let drawSpaceH = 600;
  let drawSpaceW = 600;

  let populationInfo = datasources[0];
  let mapInfo = datasources[1];

  let dataIndex = {};
  for (let c of populationInfo) {
    let country = c.States;
    dataIndex[country] = c.NPN;
  }

  mapInfo.features = mapInfo.features.map((d) => {
    let country = d.properties.st_nm;
    let population = dataIndex[country];
    d.properties.population = population;
    return d;
  });

  let maxPopulation = d3.max(
    mapInfo.features,
    (d) => d.properties.population
  );
  let medianPopulation = d3.median(
    mapInfo.features,
    (d) => d.properties.population
  );
  let cScale = d3
    .scaleLinear()
    .domain([0, maxPopulation])
    .range(["white", "red"]);
    
  let color = d3.scaleQuantize([0, maxPopulation], d3.schemeReds[6]);
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
      d.properties.population ? cScale(d.properties.population) : "blue"
    ).on("mouseenter", function () {
      this.style.opacity = 0.8;
      //   d3.select(this).attr("fill", "blue"); // try this
    }).on("mouseout", function () {
      this.style.opacity = 1;
      //   d3.select(this).attr("fill", "blue"); // try this
    })
    .append("title")
      .text(d => `${d.properties.st_nm}: ${d.properties.population} `);
    
  //   .attr("fill", (d) =>
  //     d.properties.population ? cMScale(d.properties.population) : "blue"
  //   ); // for divergent scale
}
