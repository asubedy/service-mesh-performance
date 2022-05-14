
function myRound (v, digits = 2) {
  var p = Math.pow(10, digits);
  return Math.round(v * p) / p;
}

function pad (n) {
  return (n < 10) ? ('0' + n) : n;
}


function formatDate (dStr) {
  var d = new Date(dStr);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
          pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}
const linearXAxe = {
  type: 'linear',
  scaleLabel: {
    display: true,
    labelString: 'Response time in ms',
    ticks: {
      min: 0,
      beginAtZero: true
    }
  }
};
const logXAxe = {
  type: 'logarithmic',
  scaleLabel: {
    display: true,
    labelString: 'Response time in ms (log scale)'
  },
  ticks: {
    // min: dataH[0].x, // newer chart.js are ok with 0 on x axis too
    callback: function (tick, index, ticks) {
      return tick.toLocaleString();
    }
  }
};
const linearYAxe = {
  id: 'H',
  type: 'linear',
  ticks: {
    beginAtZero: true
  },
  scaleLabel: {
    display: true,
    labelString: 'Count'
  }
};
const logYAxe = {
  id: 'H',
  type: 'logarithmic',
  display: true,
  ticks: {
    // min: 1, // log mode works even with 0s
    // Needed to not get scientific notation display:
    callback: function (tick, index, ticks) {
      return tick.toString();
    }
  },
  scaleLabel: {
    display: true,
    labelString: 'Count (log scale)'
  }
};


function getMetadata(rawdata,res) {
  return {
    title : {
      display : {
        key : 'Title',
        // value : res.Labels.split(' -_- ')?.[0] || "No Title"
        value : (rawdata ? rawdata.name : res.Labels.split(' -_- ')?.[0]) || "No Title"
      }
    },
    url : {
      display : {
        key : 'URL',
        value : (rawdata ? rawdata.runner_results.URL: res.Labels.split(' -_- ')?.[1]) || "No URL"
      }
    },
    startTime : {
      display : {
        key : 'Start Time',
        value : formatDate(res.StartTime)
      }
    },
    minimum : {
      display : {
        key : 'Minimum',
        value : `${myRound(1000.0 * res.DurationHistogram.Min, 3)} ms`
      }
    },
    average : {
      display : {
        key : 'Average',
        value : `${myRound(1000.0 * res.DurationHistogram.Avg, 3)} ms`
      }
    },
    maximum : {
      display : {
        key : 'Maximum',
        value : `${myRound(1000.0 * res.DurationHistogram.Max, 3)} ms`
      }
    },
    qps : {
      display : {
        key : "QPS",
        value : `Achieved ${myRound(res.ActualQPS, 1)} (Requested ${res?.RequestedQPS})`,
      }
    },
    numberOfConnections : {
      display : {
        key : 'Number Of Connections',
        value : res.NumThreads,
      }
    },
    duration : {
      display : {
        key : 'Duration',
        value : `Achieved ${myRound(res.ActualDuration / 1e9, 1)} (Requested ${res.RequestedDuration})`,
      }
    },
    errors : {
      display : {
        key : 'Errors',
        value : (() => {
          const status = res.RetCodes?.[200] || res.RetCodes?.SERVING || 0;
          const total = res.DurationHistogram.Count;

          if (status !== total) {
            if (status) return myRound(100.0 * (total - status) / total, 2) + '% errors';

            return "100% errors!";
          }

          return "No Errors";
        })(),
      }
    },
    percentiles : {
      display : {
        key : 'Percentiles',
        value : res.DurationHistogram?.Percentiles?.map(p => {
          return {
            display : {
              key : `p${p.Percentile}`,
              value : `${myRound(1000 * p.Value, 2)} ms`
            }
          }
        }),
      }
    },
    kubernetes : {
      display : {
        hide : !res.kubernetes,
        key : "Kuberenetes",
        value : [
          {
            display : {
              key : "Server Version",
              value : res.kubernetes?.server_version
            }
          },
          {
            display : {
              key : "Nodes",
              value : res.kubernetes?.nodes?.map((node, i) => {
                return {
                  display : {
                    key : `Node ${i + 1}`,
                    value : [
                      {
                        display : {
                          key : "Hostname",
                          value : node?.hostname,
                        }
                      },
                      {
                        display : {
                          key : "CPU",
                          value : node?.allocatable_cpu,
                        }
                      },
                      {
                        display : {
                          key : "Memory",
                          value : node?.allocatable_memory,
                        }
                      },
                      {
                        display : {
                          key : "Arch",
                          value : node?.architecture,
                        }
                      },
                      {
                        display : {
                          key : "OS",
                          value : node?.os_image,
                        }
                      },
                      {
                        display : {
                          key : "Kubelet Version",
                          value : node?.kubelet_version,
                        }
                      },
                      {
                        display : {
                          key : "Container runtime",
                          value : node?.container_runtime_version,
                        }
                      },
                    ]
                  }
                }
              })
            }
          },
        ],
      }
    }
  };
}

function makeTitle (rawdata,res) {
  var title = [];
  if (res.Labels !== '') {
    if (res.URL) { // http results
      // title.push(res.Labels + ' - ' + res.URL + ' - ' + formatDate(res.StartTime))
      // title.push(res.URL + ' - ' + formatDate(res.StartTime))
      console.log(res.Labels);
      var labels = res.Labels.split(' -_- ');
      // title.push(`Labels: ${labels.map(item => item + '\n')}`)
      title.push(`Title: ${rawdata ? rawdata.name : labels[0]}`);
      title.push(`URL: ${labels[1]}`);
      title.push(`Start Time: ${formatDate(res.StartTime)}`);
    } else { // grpc results
      title.push(`Destination: ${res.Destination}`);
      title.push(`Start Time: ${formatDate(res.StartTime)}`);
    }
  }
  title.push(`Minimum: ${myRound(1000.0 * res.DurationHistogram.Min, 3)} ms`);
  title.push(`Average: ${myRound(1000.0 * res.DurationHistogram.Avg, 3)} ms`);
  title.push(`Maximum: ${myRound(1000.0 * res.DurationHistogram.Max, 3)} ms`);
  var percStr = `Minimum: ${myRound(1000.0 * res.DurationHistogram.Min, 3)} ms \nAverage: ${myRound(1000.0 * res.DurationHistogram.Avg, 3)} ms \nMaximum: ${myRound(1000.0 * res.DurationHistogram.Max, 3)} ms\n`;
  var percStr_2 = 'Percentiles: ';
  if (res.DurationHistogram.Percentiles) {
    for (var i = 0; i < res.DurationHistogram.Percentiles.length; i++) {
      var p = res.DurationHistogram.Percentiles[i];
      percStr_2 += `p${p.Percentile}: ${myRound(1000 * p.Value, 2)} ms; `;
      percStr += `p${p.Percentile}: ${myRound(1000 * p.Value, 2)} ms; `;
    }
    percStr=percStr.slice(0,-2);
  }
  var statusOk = typeof res.RetCodes !== 'undefined' && res.RetCodes !== null?res.RetCodes[200]:0;
  if (!statusOk) { // grpc results
    statusOk = typeof res.RetCodes !== 'undefined' && res.RetCodes !== null?res.RetCodes.SERVING:0;
  }
  var total = res.DurationHistogram.Count;
  var errStr = 'No Error';
  if (statusOk !== total) {
    if (statusOk) {
      errStr = myRound(100.0 * (total - statusOk) / total, 2) + '% errors';
    } else {
      errStr = '100% errors!';
    }
  }
  title.push(`Target QPS: ${res.RequestedQPS} ( Actual QPS: ${myRound(res.ActualQPS, 1)} )`);
  title.push(`No of Connections: ${res.NumThreads}`);
  title.push(`Requested Duration: ${res.RequestedDuration} ( Actual Duration: ${myRound(res.ActualDuration / 1e9, 1)} )`);
  title.push(`Errors: ${ errStr }`);
  title.push(percStr_2);
  if(res.kubernetes){
    title.push(`Kubernetes server version: ${res.kubernetes.server_version}`);
    title.push("Nodes:");
    res.kubernetes?.nodes?.forEach((node, ind) => {
      title.push(`Node ${ind+1} - \nHostname: ${node.hostname} \nCPU: ${node.allocatable_cpu} \nMemory: ${node.allocatable_memory} \nArch: ${node.architecture} \nOS: ${node.os_image}
                    \nKubelet version: ${node.kubelet_version} \nContainer runtime: ${node.container_runtime_version}`);
    });
  }
  console.log(title)
  return title;
}


function fortioResultToJsChartData (rawdata,res) {
  var dataP = [{
    x: 0.0,
    y: 0.0
  }];
  var len = res.DurationHistogram.Data.length;
  var prevX = 0.0;
  var prevY = 0.0;
  for (var i = 0; i < len; i++) {
    var it = res.DurationHistogram.Data[i];
    var x = myRound(1000.0 * it.Start);
    if (i === 0) {
      // Extra point, 1/N at min itself
      dataP.push({
        x: x,
        // y: myRound(100.0 / res.DurationHistogram.Count, 3)
        y: myRound(100.0 / res.DurationHistogram.Count, 2)
      });
    } else {
      if (prevX !== x) {
        dataP.push({
          x: x,
          y: prevY
        });
      }
    }
    x = myRound(1000.0 * it.End);
    // var y = myRound(it.Percent, 3)
    var y = myRound(it.Percent, 2);
    dataP.push({
      x: x,
      y: y
    });
    prevX = x;
    prevY = y;
  }
  var dataH = [];
  var prev = 1000.0 * res.DurationHistogram.Data[0].Start;
  for (i = 0; i < len; i++) {
    it = res.DurationHistogram.Data[i];
    var startX = 1000.0 * it.Start;
    var endX = 1000.0 * it.End;
    if (startX !== prev) {
      dataH.push({
        x: myRound(prev),
        y: 0
      }, {
        x: myRound(startX),
        y: 0
      });
    }
    dataH.push({
      x: myRound(startX),
      y: it.Count
    }, {
      x: myRound(endX),
      y: it.Count
    });
    prev = endX;
  }
  return {
    title: makeTitle(rawdata,res),
    metadata: getMetadata(rawdata,res),
    dataP: dataP,
    dataH: dataH,
    percentiles: res.DurationHistogram.Percentiles,
  };
}

function makeChart (data) {
  return {
    percentiles: data.percentiles,
    data: {
      datasets: [{
        label: 'Cumulative %',
        data: data.dataP,
        fill: false,
        yAxisID: 'P',
        stepped: true,
        backgroundColor: 'rgba(134, 87, 167, 1)',
        borderColor: 'rgba(134, 87, 167, 1)',
        cubicInterpolationMode: 'monotone'
      },
      {
        label: 'Histogram: Count',
        data: data.dataH,
        yAxisID: 'H',
        pointStyle: 'rect',
        radius: 1,
        borderColor: 'rgba(87, 167, 134, .9)',
        backgroundColor: 'rgba(87, 167, 134, .75)',
        lineTension: 0
      }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      metadata : data?.metadata,
      title: {
        display: true,
        fontStyle: 'normal',
        text: data.title
      },
      scales: {
        xAxes: [
          linearXAxe
        ],
        yAxes: [{
          id: 'P',
          position: 'right',
          ticks: {
            beginAtZero: true,
            max: 100
          },
          scaleLabel: {
            display: true,
            labelString: '%'
          }
        },
        linearYAxe
        ]
      }
    }
  };
}

singleChart = (rawdata,data) => {
  if (typeof data === 'undefined' || typeof data.StartTime === 'undefined') {
    return {};
  }

  return makeChart(fortioResultToJsChartData(rawdata,data));
}


function processChartData(chartData) {
    if (chartData && chartData.data && chartData.options) {
      console.log("inside if")
      const xAxes = [];
      const yAxes = [];
      const colors = {};
      const types = {};
      const axes = {};
      const axis = {};
      const yAxisTracker = {};
      const xAxisTracker = {};

      if (chartData.data && chartData.data.datasets) {
        chartData.data.datasets.forEach((ds, ind) => {
          // xAxis.push('x');
          const yAxis = [ds.label];
          const xAxis = [`x${ind + 1}`];
         
          xAxisTracker[ds.label] = `x${ind + 1}`;
          yAxisTracker[ds.yAxisID] = `y${ind > 0
            ? ind + 1
            : ''}`;
          axes[ds.label] = `y${ind > 0
            ? ind + 1
            : ''}`;

          ds.data.forEach((d) => {
            // if(ind === 0){
            xAxis.push(d.x);
            // }
            yAxis.push(d.y);
          });
          yAxes.push(yAxis);
          xAxes.push(xAxis);
          if (ds.cubicInterpolationMode) {
            // types[ds.label] = "line";
          } else {
            types[ds.label] = "area-step";
          }
          colors[ds.label] = ds.borderColor; // not sure which is better border or background
        });
      }

      if (chartData.options.scales.xAxes) {
        chartData.options.scales.xAxes.forEach((ya) => {
          axis.x = { show : true,
            label : { text : ya.scaleLabel.labelString,
              position : 'outer-middle', }, };
        });
      }
      if (chartData.options.scales.yAxes) {
        chartData.options.scales.yAxes.forEach((ya) => {
          axis[yAxisTracker[ya.id]] = { show : true,
            label : { text : ya.scaleLabel.labelString,
              position : 'outer-middle', }, };
        });
      }

      const grid = {};

      if (chartData.percentiles && chartData.percentiles.length > 0) {
        // position: "middle"
        // position: "start"
        let reTrack = 0;
        const percentiles = chartData.percentiles.map(({ Percentile, Value }) => {
          const re = { value : (Value * 1000).toFixed(2),
            text : `p${Percentile}`, };
          switch (reTrack % 3) {
            case 0:
            // re.position
              break;
            case 1:
              re.position = 'middle';
              break;
            case 2:
              re.position = 'start';
              break;
          }

          reTrack++;

          return re;
        });

        grid.x = { lines : percentiles, };
      }
      console.log(xAxisTracker)

      const chartColumn = [];

      xAxes.forEach((xAxe)=>{
        chartColumn.push(xAxe);
      })
      yAxes.forEach((yAxe)=>{
        chartColumn.push(yAxe);
      })

      const chartConfig = {
        // oninit: function(args){
        //   console.log(JSON.stringify(args));
        // },
        // title: {
        //   text: chartData.options.title.text.join('\n'),
        // },
        bindto : "#chart",
        type : "line",
        data : {
          // x: 'x',
          xs : xAxisTracker,
          // xFormat: self.bbTimeFormat,
          columns : chartColumn,
          colors : {colors, "Cumulative %" : "rgb(71,126,150)" },
          axes,
          types,
          // groups,
          // type: 'area',
        },
        axis,

        grid,
        legend : { show : true, },
        point : { r : 0,
          focus : { expand : { r : 5, }, }, },
        tooltip : { show : true, },
      };
      // if (!hideTitle) {
      //   if (data.length == 4) {
      //    titleRef.innerText = chartData.options.title.text.slice(0,2).join('\n') +"\n"+ chartData.options.title.text[2].split('\n')[0];
      //     if (chartData.options.title.text[2])self.percentileRef.innerText=chartData.options.title.text[2].split('\n')[1].split('|').join('\n')
      //   } else {
      //    titleRef.innerText=chartData.options.title.text.join('\n')
      //   }
      // }
      
     chart = bb.generate(chartConfig);
    } else {
      console.log("inside else")
      chart = bb.generate({
        type : "line",
        data : { columns : [] },
        bindto : "#chart",
      });
    }
  }

function fillTittle(rawdata, tmpData){
  const titleContainer = document.getElementById("titles");
  const titles = makeTitle(rawdata,tmpData);
  titleContainer.innerHTML = `<div id="titles-holder" class="container"></div>`
  const innerTitle = document.getElementById("titles-holder")
  innerTitle.innerHTML = ""
  let titleCount = 0;
  for(let i =0;i<3;i++){
    innerTitle.innerHTML += `<div id = "row${i}" class="row"> </div>`
    const row = document.getElementById(`row${i}`)
    row.innerHTML = " ";
    for(let j =0;j<3;j++){
      row.innerHTML += `<div class="col-sm">
     ${titles[titleCount]}
    </div>`
    titleCount = titleCount+1;
    }
  }
}


let results = 
 [{"meshery_id":"f9ccd668-9d26-4f70-8a51-47de5af3c502",
 "name":"No mesh_1650983199033",
 "mesh":null,
 "performance_profile":"30c9382b-636f-4117-8205-10bac2d77944",
 "test_id":null,
 "server_metrics":null,
 "test_start_time":"2022-04-26T19:56:40.358118Z",
 "created_at":"2022-04-26T14:27:12.84392Z",
 "user_id":"c0228da7-2415-4626-9ea5-19f97147767b",
 "updated_at":"2022-04-26T14:27:12.84393Z",
 "runner_results":[
    {"AbortOn":0,
    "AccessLoggerInfo":"",
    "ActualDuration":30187978458,
    "ActualQPS":2.5838099794764338,
    "DurationHistogram":
        {"Avg":0.3866328985641026,"Count":78,"Data":[{"Count":5,"End":0.35000000000000003,"Percent":6.410256410256411,"Start":0.3349775},{"Count":51,"End":0.4,"Percent":71.7948717948718,"Start":0.35000000000000003},{"Count":19,"End":0.45,"Percent":96.15384615384616,"Start":0.4},{"Count":2,"End":0.5,"Percent":98.71794871794872,"Start":0.45},{"Count":1,"End":0.509868292,"Percent":100,"Start":0.5}],"Max":0.509868292,"Min":0.3349775,"Percentiles":[{"Percentile":50,"Value":0.38333333333333336},{"Percentile":75,"Value":0.4065789473684211},{"Percentile":90,"Value":0.4373684210526316},{"Percentile":99,"Value":0.50217102424},{"Percentile":99.9,"Value":0.509098565224}],"StdDev":0.031457000667904265,"Sum":30.157366088000003},
        "Exactly":0,"HeaderSizes":{"Avg":0,"Count":78,"Data":[{"Count":78,"End":0,"Percent":100,"Start":0}],"Max":0,"Min":0,"Percentiles":null,"StdDev":0,"Sum":0},"Jitter":false,"Labels":"No mesh_1650983199033 -_- https://www.facebook.com","NumThreads":1,"RequestedDuration":"30s","RequestedQPS":"max","RetCodes":{"200":78},"RunID":0,"RunType":"HTTP","Sizes":{"Avg":88505.5,"Count":78,"Data":[{"Count":78,"End":88666,"Percent":100,"Start":88363}],"Max":88666,"Min":88363,"Percentiles":null,"StdDev":137.89309776147758,"Sum":6903429},"SocketCount":0,"StartTime":"2022-04-26T19:56:40.358118+05:30","URL":"https://www.facebook.com","Uniform":false,"Version":"dev","kubernetes":{"nodes":[{"allocatable_cpu":"4","allocatable_memory":"3925304Ki","architecture":"arm64","capacity_cpu":"4","capacity_memory":"4027704Ki","container_runtime_version":"docker://20.10.14","hostname":"docker-desktop","internal_ip":"192.168.65.4","kubelet_version":"v1.22.4","kubeproxy_version":"v1.22.4","operating_system":"linux","os_image":"Docker Desktop"}],"server_version":"v1.22.5"},"load-generator":"fortio"}]},
        {
          "meshery_id": "7d026c32-f912-49f6-8560-89aefe4fc91b",
          "name": "linkerd_1652379422611",
          "test_start_time": "2022-05-12T23:47:05.183424Z",
          "mesh": "linkerd",
          "user_id": "a99bf5ae-10c3-44fa-bee1-af4238e2c847",
          "runner_results": [{
          "AbortOn": 0,
          "AccessLoggerInfo": "",
          "ActualDuration": 30005873812,
          "ActualQPS": 9.998042445943483,
          "DurationHistogram": {
          "Avg": 0.0018687265800000007,
          "Count": 300,
          "Data": [
          {
          "Count": 120,
          "End": 0.001,
          "Percent": 40,
          "Start": 0.000114523
          },
          {
          "Count": 70,
          "End": 0.002,
          "Percent": 63.333333333333336,
          "Start": 0.001
          },
          {
          "Count": 26,
          "End": 0.003,
          "Percent": 72,
          "Start": 0.002
          },
          {
          "Count": 39,
          "End": 0.004,
          "Percent": 85,
          "Start": 0.003
          },
          {
          "Count": 42,
          "End": 0.005,
          "Percent": 99,
          "Start": 0.004
          },
          {
          "Count": 3,
          "End": 0.005123017,
          "Percent": 100,
          "Start": 0.005
          }
          ],
          "Max": 0.005123017,
          "Min": 0.000114523,
          "Percentiles": [
          {
          "Percentile": 50,
          "Value": 0.0014285714285714286
          },
          {
          "Percentile": 75,
          "Value": 0.0032307692307692306
          },
          {
          "Percentile": 90,
          "Value": 0.004357142857142857
          },
          {
          "Percentile": 99,
          "Value": 0.005
          },
          {
          "Percentile": 99.9,
          "Value": 0.005110715300000001
          }
          ],
          "StdDev": 0.00152642942199458,
          "Sum": 0.5606179740000002
          },
          "Exactly": 0,
          "HeaderSizes": {
          "Avg": 0,
          "Count": 300,
          "Data": [
          {
          "Count": 300,
          "End": 0,
          "Percent": 100,
          "Start": 0
          }
          ],
          "Max": 0,
          "Min": 0,
          "Percentiles": null,
          "StdDev": 0,
          "Sum": 0
          },
          "Jitter": false,
          "Labels": "linkerd_1652379422611 -_- http://localhost/",
          "NumThreads": 100,
          "RequestedDuration": "30s",
          "RequestedQPS": "10",
          "RetCodes": {
          "-1": 300
          },
          "RunID": 0,
          "RunType": "HTTP",
          "Sizes": {
          "Avg": 75,
          "Count": 300,
          "Data": [
          {
          "Count": 300,
          "End": 75,
          "Percent": 100,
          "Start": 75
          }
          ],
          "Max": 75,
          "Min": 75,
          "Percentiles": null,
          "StdDev": 0,
          "Sum": 22500
          },
          "SocketCount": 0,
          "StartTime": "2022-05-12T23:47:05.183424472+05:30",
          "URL": "http://localhost/",
          "Uniform": false,
          "Version": "dev",
          "kubernetes": {
          "nodes": null,
          "server_version": ""
          },
          "load-generator": "fortio"
          }],
          "performance_profile": "73e94919-1692-41e8-8bc6-ab0ac0e505e9",
          "created_at": "2022-05-12T18:17:35.327355Z",
          "updated_at": "2022-05-12T18:17:35.327377Z"
          },
          {
          "meshery_id": "15e3581e-d7b9-421e-9db7-d7af6896310e",
          "name": "linkerd_1652362153916",
          "test_start_time": "2022-05-12T18:59:15.489318Z",
          "mesh": "linkerd",
          "user_id": "a99bf5ae-10c3-44fa-bee1-af4238e2c847",
          "runner_results": [{
          "AbortOn": 0,
          "AccessLoggerInfo": "",
          "ActualDuration": 30020784871,
          "ActualQPS": 9.993076506464,
          "DurationHistogram": {
          "Avg": 0.006578617189999999,
          "Count": 300,
          "Data": [
          {
          "Count": 84,
          "End": 0.001,
          "Percent": 28,
          "Start": 0.000165934
          },
          {
          "Count": 23,
          "End": 0.002,
          "Percent": 35.666666666666664,
          "Start": 0.001
          },
          {
          "Count": 6,
          "End": 0.003,
          "Percent": 37.666666666666664,
          "Start": 0.002
          },
          {
          "Count": 1,
          "End": 0.004,
          "Percent": 38,
          "Start": 0.003
          },
          {
          "Count": 3,
          "End": 0.005,
          "Percent": 39,
          "Start": 0.004
          },
          {
          "Count": 28,
          "End": 0.006,
          "Percent": 48.333333333333336,
          "Start": 0.005
          },
          {
          "Count": 21,
          "End": 0.007,
          "Percent": 55.333333333333336,
          "Start": 0.006
          },
          {
          "Count": 22,
          "End": 0.008,
          "Percent": 62.666666666666664,
          "Start": 0.007
          },
          {
          "Count": 19,
          "End": 0.009000000000000001,
          "Percent": 69,
          "Start": 0.008
          },
          {
          "Count": 4,
          "End": 0.01,
          "Percent": 70.33333333333333,
          "Start": 0.009000000000000001
          },
          {
          "Count": 10,
          "End": 0.011,
          "Percent": 73.66666666666667,
          "Start": 0.01
          },
          {
          "Count": 10,
          "End": 0.012,
          "Percent": 77,
          "Start": 0.011
          },
          {
          "Count": 29,
          "End": 0.014,
          "Percent": 86.66666666666667,
          "Start": 0.012
          },
          {
          "Count": 25,
          "End": 0.016,
          "Percent": 95,
          "Start": 0.014
          },
          {
          "Count": 12,
          "End": 0.018000000000000002,
          "Percent": 99,
          "Start": 0.016
          },
          {
          "Count": 3,
          "End": 0.018232664,
          "Percent": 100,
          "Start": 0.018000000000000002
          }
          ],
          "Max": 0.018232664,
          "Min": 0.000165934,
          "Percentiles": [
          {
          "Percentile": 50,
          "Value": 0.006238095238095238
          },
          {
          "Percentile": 75,
          "Value": 0.011399999999999999
          },
          {
          "Percentile": 90,
          "Value": 0.014799999999999999
          },
          {
          "Percentile": 99,
          "Value": 0.018000000000000002
          },
          {
          "Percentile": 99.9,
          "Value": 0.0182093976
          }
          ],
          "StdDev": 0.005481664789920342,
          "Sum": 1.9735851569999998
          },
          "Exactly": 0,
          "HeaderSizes": {
          "Avg": 0,
          "Count": 300,
          "Data": [
          {
          "Count": 300,
          "End": 0,
          "Percent": 100,
          "Start": 0
          }
          ],
          "Max": 0,
          "Min": 0,
          "Percentiles": null,
          "StdDev": 0,
          "Sum": 0
          },
          "Jitter": false,
          "Labels": "linkerd_1652362153916 -_- http://localhost/",
          "NumThreads": 100,
          "RequestedDuration": "30s",
          "RequestedQPS": "10",
          "RetCodes": {
          "-1": 300
          },
          "RunID": 0,
          "RunType": "HTTP",
          "Sizes": {
          "Avg": 75,
          "Count": 300,
          "Data": [
          {
          "Count": 300,
          "End": 75,
          "Percent": 100,
          "Start": 75
          }
          ],
          "Max": 75,
          "Min": 75,
          "Percentiles": null,
          "StdDev": 0,
          "Sum": 22500
          },
          "SocketCount": 0,
          "StartTime": "2022-05-12T18:59:15.48931835+05:30",
          "URL": "http://localhost/",
          "Uniform": false,
          "Version": "dev",
          "kubernetes": {
          "nodes": null,
          "server_version": ""
          },
          "load-generator": "fortio"
          }],
          "performance_profile": "73e94919-1692-41e8-8bc6-ab0ac0e505e9",
          "created_at": "2022-05-12T13:29:46.256614Z",
          "updated_at": "2022-05-12T13:29:46.256624Z"
          },  
      ]
      
    
function dropdownChange(value){

  graphHolder = document.querySelector(".graph-holder")
  testValue = parseInt(value);
  let rawdata = results[testValue-1];
  let data = results[testValue-1].runner_results;

  colWidth = document.getElementById("col-width")
  
  if(graphHolder.style["display"]=="block"){
    graphHolder.style["display"]= "none"
  }
  else{
    graphHolder.style["display"]="block"
    colWidth.className.replace("col-sm","col-sm-6")
  }

  let tmpData = (typeof data !== 'undefined')
  ? (data.length == 1
    ? data[0]
    : {})
  : {};
  
  
  let chartData = singleChart(rawdata,tmpData)
  
  processChartData(chartData)
  fillTittle(rawdata,data[0])
}

dropdownChange("1")
// results.forEach(result =>{
//   let rawdata = result;
//   let data = result.runner_results;
  
//   let tmpData = (typeof data !== 'undefined')
//   ? (data.length == 1
//     ? data[0]
//     : {})
//   : {};
  
  
//   let chartData = singleChart(rawdata,tmpData)
  
//   processChartData(chartData)
//   fillTittle(rawdata,data[0])
// })



