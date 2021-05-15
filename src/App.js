import Grid from '@material-ui/core/Grid';
import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import './App.css';

const rp = require('request-promise');
const cheerio = require('cheerio')
const url = process.env.REACT_APP_URL_DRAW

console.log("URL", url)

const options = {
  scales: {
    yAxes: [
      {
        ticks: {
          beginAtZero: true,
        },
      },
    ],
  },
};

let checkObject = {}

function App() {

  const [txtHeader, setTxtHeader] = useState([]);

  const [dataChart, setDataChart] = useState([]);
  const [dataChartLine, setDataChartLine] = useState([]);
  const [dataChartLineW, setDataChartLineW] = useState([]);

  const [dataChartColorC, setDataChartColorC] = useState([]);
  const [dataChartColorP, setDataChartColorP] = useState([""]);
  const [dataChartColorW, setDataChartColorW] = useState([""]);

  const [checkValueReload, setValueReload] = useState("");

  const [nameDetail, setNameDetail] = useState("");
  const [WDetail, setWDetail] = useState("");
  const [KHDetail, setKHDetail] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      rp(url)
        .then(function (html) {
          //success!
          const $ = cheerio.load(html)
          const timeNow = new Date()

          let textResult = $($('font[color=#FF55FF]')[`${$('font[color=#FF55FF]').length - 1}`]).html()

          console.log(timeNow.toLocaleString() + " _ Crawl CPUs Infor:", textResult)

          let textSpeedCPUs = $('font[color=#55FFFF]').filter((index, data) => {
            const loadHtmlRaw = cheerio.load(data).text()
            if (/(^[G][P][U][s][:])/g.test(loadHtmlRaw)) {
              return data
            }
          })
          textSpeedCPUs = cheerio.load(textSpeedCPUs[textSpeedCPUs.length - 1]).text()

          console.log(timeNow.toLocaleString() + " _ Crawl CPUs Speed:", textSpeedCPUs)

          textSpeedCPUs = textSpeedCPUs.split(" MH/s")
          let dataObjectSpeed = [] // Chứa tổng số MH/s của CPUs theo thứ tự từ 1 -> n++
          textSpeedCPUs.forEach((data, index) => {
            data = data.slice(data.lastIndexOf(":") + 1,)
            data = data.trim()
            data = parseFloat(data)
            if (data) {
              console.log("data", data)

              dataObjectSpeed.push(data)
            }
          })

          textResult = textResult.replace(new RegExp("<br>\n", "gm"), ",")

          let converTextToArray = textResult.split(",")
          let headerList = [],
            dataResultC = [],
            dataResultP = [],
            dataResultW = [],
            dataResultColorC = [],
            dataResultColorP = [],
            dataResultColorW = [];

          converTextToArray.forEach((data, index) => {
            const dataRaw = data.trim()
            if (index === (converTextToArray.length - 1)) {
              let dataH = dataRaw.slice(0, dataRaw.indexOf(":"))
              setNameDetail(dataH)
              setWDetail(dataRaw.slice(dataRaw.indexOf(":") + 1, dataRaw.indexOf("W") + 1).trim())
              setKHDetail(dataRaw.slice(dataRaw.indexOf(";") + 1, dataRaw.indexOf("J") + 1).trim())
            } else {

              let dataH = dataRaw.slice(0, dataRaw.indexOf(":"))
              let dataC = dataRaw.slice(dataRaw.indexOf(":") + 1, dataRaw.indexOf("C"))
              let dataD = dataRaw.slice(dataRaw.indexOf("C") + 1, dataRaw.indexOf("%"))
              let dataW = dataRaw.slice(dataRaw.indexOf("%") + 1, dataRaw.indexOf("W"))

              if (!checkObject[dataH]) {
                checkObject[dataH] = {
                  ...checkObject[dataH],
                  data: [dataObjectSpeed[index]],
                  time: [timeNow.toLocaleTimeString()]
                }
              } else {
                let dataSpeed = checkObject[dataH].data
                dataSpeed.push(dataObjectSpeed[index])
                let dataTime = checkObject[dataH].time
                dataTime.push(timeNow.toLocaleTimeString())
                checkObject[dataH] = {
                  ...checkObject[dataH],
                  data: dataSpeed,
                  time: dataTime
                }
              }

              headerList.push(dataH)
              dataResultC.push(dataC.trim())
              dataResultP.push(dataD.trim())
              dataResultW.push(dataW.trim())

              const parseIntC = dataC.trim()
              if (parseIntC > 65 && parseIntC < 70)
                dataResultColorC.push("rgb(255, 191, 0)")
              if (parseIntC > 70)
                dataResultColorC.push("rgb(255, 64, 0)")

              dataResultColorC.push("rgb(0, 128, 255)")
              dataResultColorP.push("#c1c8e4")
              dataResultColorW.push("#0677a1")
            }

          })
          if (textResult !== checkValueReload) {
            setValueReload(textResult)
            setTxtHeader(headerList)
            setDataChart(dataResultC)
            setDataChartLine(dataResultP)
            setDataChartLineW(dataResultW)
            setDataChartColorC(dataResultColorC)
            setDataChartColorP(dataResultColorP)
            setDataChartColorW(dataResultColorW)
          } else {
            console.log("No change")
          }
        })
        .catch(function (err) {
          //handle error
          console.log(err)
          // alert("Error connect to server!")
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [checkValueReload]);

  console.log("checkObject", checkObject)

  return (
    <div className="App">
      <header className="App-header">
        <Grid container>
          <Grid item xs={6} md={6}>
            <div className='header'>
              <h1 className='title'>CPUs</h1>
            </div>
            <Bar data={{
              labels: txtHeader,
              datasets: [
                {
                  label: 'C',
                  data: dataChart,
                  backgroundColor: dataChartColorC
                },
                {
                  label: '%',
                  data: dataChartLine,
                  backgroundColor: dataChartColorP
                },
                {
                  label: 'W',
                  data: dataChartLineW,
                  backgroundColor: dataChartColorW
                },
              ],
            }} options={options} />
          </Grid>

          <Grid
            item
            xs={6}
            md={6}
          >
            <h1>{nameDetail}</h1>
            <h1>{WDetail}</h1>
            <h1>{KHDetail}</h1>
          </Grid>
        </Grid>
        <Grid container >
          {
            txtHeader.map((data, index) => (
              <Grid item xs={3} md={3} key={data + "_" + index}>
                <div className='header'>
                  <h1 className='title'>{data}</h1>
                </div>
                <Line
                  data={{
                    labels: checkObject[data].time,
                    datasets: [
                      {
                        label: data,
                        data: checkObject[data].data,
                        fill: false,
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgba(255, 99, 132, 0.2)',
                      },
                    ]
                  }}
                  options={{
                    scales: {
                      yAxes: [
                        {
                          ticks: {
                            beginAtZero: true,
                          },
                        },
                      ],
                    },
                  }} />
              </Grid>))
          }
        </Grid>

      </header>
    </div>
  );
}

export default App;
