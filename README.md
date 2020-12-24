# Indian-Crop-Visualization

A project on the efficiency of crop production in India.
You can find the live website here: http://indian-crop.netlify.app (Speed here may vary depending on the internet connection as the entire dataset is downloaded)

## Problem statement

Transform, visualize and analyse a district wise, crop wise and year wise data on crop covered area (Hectare) and production (Tonnes) to show the efficiency of production of various crops in different regions of India over the years.

## Why This Problem Statement?

### Empowering Farmers

We want to educate the farmers on what crops they should grow if they belong to a particular region of India. This can help them utilize the least amount of area and hence cost while producing the maximum yield.

### Assisting State and Central Government

This platform enables the viewers to see the trend in the growth of various crops in a particular region over the years. This will help them in making future decisions for formulating crop related schemes like if care/subsidies need to be given to any particular crop or region.

### Fighting Climate Change

Efficiency of agriculture production is highly related to the effect on climate change, as less the efficiency, more the land required in farming which thus requires more resources which burdens the climate with long term effects. With our visualization the concerned authority can improve as well as adapt our farming practices and schemes so in order to contribute as less in climate change as possible.

## Strength and Weakness of Visualization

The visualisation used by us is the choropleth map representation of India with state and union territory boundaries along with a line chart to show the trend of a crop over the years for each region and a bar graph to show the efficiency of various crops grown there in that year.

### Strengths

- The visualization gives a very visual and easily understandable graphic on the efficiency of crop production across states/union territories. For example: Rice is mostly grown throughout the country while wheat is less produced in the extreme north and south of the country.
- It also lets us compare the efficiency of crop production across several locations at a glance and helps in finding intriguing hot spots for regions with very high/ low efficiency. For example: We can see that wheat production has a higher efficiency as we go north of the country, while the efficiency of rice is more in the extreme north and south of the country.
- Hovering over any region enables the user to view detailed information of total production and area covered.
- Clicking on any region shows a line chart which helps to identify emerging trends over the years and act quickly based on what the viewer sees.
- From the line graph, we can easily make out what range of efficiency has been there for a particular crop over the years.
- An ordered bar graph is also shown, which helps in identifying which crops have been showing the most efficiency in production
- All these lead to a more intuitive decision making for the concerned entities.

### Weaknesses

- We cannot presently compare the efficiency of production of one crop with that of another.
- Choropleth map used gives the false impression of abrupt change at the boundaries of shaded units for example in the visualization created by us in West Bengal and Gujarat the map is not clear.
- Since the choropleth map uses an average number to represent defined areas, meaning that only one field can be plotted on the chart, the viewer can not gain detailed information or perspective on any area’s internal conditions.
- Also, as has been discussed in class, color is not as effective a channel as length.

## Technical Challenges

### Issues in the government provided dataset

Since, we had to take the dataset from the assigned website, we have not made any changes to the dataset, apart from the file name. We have tried to address all the difficulties using javascript. There are some crops like apple, peach whose name and data has been provided, however the production is mentioned as 0 for all states. Hence, they appear as white throughout the map. We ask you to look at the data of rice and wheat throughout the different years as they are the best available data.

### Irregularities in the map of India

The map of India, particularly regions of Jammu & Kashmir and Arunachal Pradesh, has been shown as different in different websites, and thus their GeoJSON data is also different in them, hence we have taken the map which is considered legally right by the Government of India.

### The state of Jammu and Kashmir

The dataset has been collected without considering the partitioning of the state of Jammu & Kashmir into the union territories of Jammu & Kashmir and Ladakh. Thus, we have also taken a geoJSON which creates a path in the same respect.

## Future Prospects

Our visualization currently doesn’t deliver district wise/ ward wise visualization as supplied in the dataset. However, given more time we can adapt it to make suitable for an in depth analysis as well.

## Bibliography

### Data Files

All data files used for the visualization have been taken from:

- District-wise, season-wise crop production statistics from 1997 | Open Government Data (OGD) Platform India: https://data.gov.in/resources/district-wise-season-wise-crop-production-statistics-1997
- GeoJSON for Map of India: https://un-mapped.carto.com/tables/states_india/public/map
- Covid-19 India: https://github.com/covid19india/covid19india-react/tree/master/public/maps

### References

We referred to the following resources while completing this project:

- D3 Graph Gallery: https://www.d3-graph-gallery.com/index.html
- Gallery / D3 / Observable (observablehq.com): https://observablehq.com/@d3/gallery
