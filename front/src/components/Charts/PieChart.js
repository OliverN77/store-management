import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ title, data, colors }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: colors || [
          '#4A90E2', // Azul
          '#50E3C2', // Verde
          '#B266D9', // Púrpura
          '#F5A623', // Naranja
          '#D0021B', // Rojo
          '#7ED321', // Verde lima
          '#9013FE', // Púrpura oscuro
          '#FF6900'  // Naranja oscuro
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#4A90E2',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    }
  };

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <div className="chart-wrapper">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PieChart;