// Function to build Metadata div for each selected sample
function buildMetadata(sample) {
  // Use `d3.json` to fetch the metadata for a sample
  d3.json(`/metadata/${sample}`).then((sampleMetadata) => {

    // Use d3 to select the panel with id of `#sample-metadata`
    metadataDiv = d3.select("#sample-metadata");
    
    // Use `.html("") to clear any existing metadata
    metadataDiv.html("");

    // Use `Object.entries` to add each key and value pair to the panel
    console.log(sampleMetadata);
    Object.entries(sampleMetadata).forEach(entry => {
      metadataDiv.append("h5").text(`${entry[0]}: ${entry[1]}`)
    });
  });
}

function buildCharts(sample) {

  // Use D3.json to get all sampleData from Flask route for selected sample
  d3.json(`/samples/${sample}`).then((sampleData) => {
    console.log(sampleData);
    
    // ****** Bubble Chart ******
    var bubbleData = [{
      x: sampleData.otu_ids,
      y: sampleData.sample_values,
      mode: 'markers',
      marker: {
        size: sampleData.sample_values,
        color: sampleData.otu_ids,
        opacity: 1.0
      },
      text: sampleData.otu_labels
    }];
    
    var layout = {
      title: "Relative Abundance of Microbes in Sample",
      xaxis: {title: "Operational Taxonomic Unit (OTU) ID"},
      yaxis: {title: "Relative Abundance"},
      height: 600,
      width: 1400
    };
    
    Plotly.newPlot('bubble', bubbleData, layout);

    // ****** Pie Chart ******
    // Need to sort all three served arrays TOGETHER, by top 10 descending of sample_value array.
    // Loop - create one object per sample, one key per array, and push to new array
    var sampleObjects = []
    for (var i = 0; i<sampleData.sample_values.length; i++) {
      var sampleObject = {
        "sampleOTUid":sampleData.otu_ids[i],
        "sampleValue":sampleData.sample_values[i],
        // Grab species name only (split on ; and take last element)
        "sampleOTUlabel":sampleData.otu_labels[i].split(';').pop()
      };
      sampleObjects.push(sampleObject);
    }

    // Sort all sampleObjects by sampleValue, descending, and take only top 10
    sampleObjects.sort((a,b) => {
      return (b.sampleValue - a.sampleValue)
    });
    sampleObjects = sampleObjects.slice(0,10);

    // Log top 10 to console
    console.log(sampleObjects);

    // Plot pie chart from top 10 sorted samples
    var pieData = [{
      values: sampleObjects.map(sample => sample.sampleValue),
      labels: sampleObjects.map(sample => sample.sampleOTUid),
      text: sampleObjects.map(sample => sample.sampleOTUlabel),
      hoverinfo: 'text+label',
      type: "pie"
    }];

    var layout = {
      title: "Top 10 Microbes Present in Sample",
      height: 600,
      width: 800
    };
  
    Plotly.newPlot("pie", pieData, layout);
  });
}

function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
  });
}

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  buildCharts(newSample);
  buildMetadata(newSample);
}

// Initialize the dashboard
init();
