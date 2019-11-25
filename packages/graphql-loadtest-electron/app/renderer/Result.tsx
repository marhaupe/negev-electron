import React from 'react';
import { useAppStatsContext } from './context';
import { Chart } from 'react-charts';
import { Stats } from 'graphql-loadtest-core';
import { Link } from 'react-router-dom';

export function Result() {
  const [stats] = useAppStatsContext();

  if (!stats || stats.length === 0) {
    return (
      <div className="container h-full mx-auto py-10">
        <Link className="block underline mb-3" to={'/'}>
          Go back
        </Link>
        <p className="block text-3xl mb-10 font-bold">Result</p>
        <p className="block text ">
          Run a loadtest to see results. To run a loadtest, you simply have to configure at least one phase, an endpoint
          and the query to test.
        </p>
        <div className="flex justify-center mt-16">
          <img
            style={{
              maxWidth: '600px',
              maxHeight: '430px',
              width: 'auto',
              height: 'auto'
            }}
            alt="data-visualisation"
            src={require('../../assets/undraw_visual_data_b1wx.png')}
          />
        </div>
      </div>
    );
  }
  const data = [
    {
      label: 'Duration (ms)',
      data: generateData(stats)
    }
  ];

  const axes = [
    { primary: true, type: 'linear', position: 'bottom' },
    { type: 'linear', position: 'left' }
  ];

  return (
    <div className="container h-full mx-auto py-10">
      <Link className="block underline mb-3" to={'/'}>
        Go back
      </Link>
      <p className="block text-3xl mb-10 font-bold">Result</p>
      {renderChart()}
      <br />
      <br />
      {renderDetailedStats()}
    </div>
  );

  function renderChart() {
    return (
      <div
        style={{
          margin: 'auto',
          width: '800px',
          height: '400px'
        }}
      >
        <Chart data={data} primaryCursor secondaryCursor axes={axes} />
      </div>
    );
  }

  function renderDetailedStats() {
    return (
      <div className="justify-center flex flex-row flex-wrap">
        {stats.map((stat, index) => {
          return (
            <div className="m-8">
              <p className="text-xl mb-2 font-bold">Phase {index}</p>
              <table className="table-auto">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Metric</th>
                    <th className="px-4 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-4 py-2">Average</td>
                    <td className="border px-4 py-2">{stat.averageDurationPerRequest} ms</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="border px-4 py-2">Min</td>
                    <td className="border px-4 py-2">{stat.minDurationPerRequest} ms</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2">Max</td>
                    <td className="border px-4 py-2">{stat.maxDurationPerRequest} ms</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="border px-4 py-2">Jitter</td>
                    <td className="border px-4 py-2">{stat.jitter} ms</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2">Total requests</td>
                    <td className="border px-4 py-2">{stat.totalRequests}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  }
}

function generateData(stats: Stats[]) {
  const durations = stats.flatMap(stat => stat.responses);
  return durations.map((duration, index) => {
    return [index, duration.duration];
  });
}
