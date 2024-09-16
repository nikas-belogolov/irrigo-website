import type { MetaFunction } from "@remix-run/node";
// import { Chart } from "chart.js/auto";
import "chart.js/auto";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "chartjs-adapter-moment"
import { Chart, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  TimeScale, //Import timescale instead of category for X axis
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

const socket = io();

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {

  const chartRef = useRef(null);

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
        {
            label: "Pressure",
            data: [],
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            fill: true,
            tension: 0.1, // Smooths the line
          },
      {
        label: "Flow rate",
        data: [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.1, // Smooths the line
      },
    ],
  });

  useEffect(() => {

    socket.on("data", (data) => {
      setChartData((prevData) => {
        const flowRate = [...prevData.datasets[0].data, data.y.f].slice(-30);
        const pressureRate = [...prevData.datasets[1].data, data.y.p].slice(-30);

        const updatedLabels = [...prevData.labels, data.x].slice(-30);
        console.log(data)
        return {
          ...prevData,
          labels: updatedLabels,
          datasets: [
            { ...prevData.datasets[0], data: flowRate },
            { ...prevData.datasets[1], data: pressureRate }
        ],
        };
      });
    })

    return () => {
      socket.off("data");
    };
  })

  

  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl">Welcome to Remix</h1>
      <canvas ref={chartRef}></canvas>
      {/* <Suspense> */}
        <Line data={chartData} options={{animation: {
      duration: 0, // Disable animations for smoother real-time updates
    },}} />

      {/* </Suspense> */}
    </div>
  );
}
