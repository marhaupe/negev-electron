import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from './context';

export function Settings() {
  const { config, setConfig } = useAppContext();

  function renderPhasesConfig() {
    return (
      <>
        {config.phases.map((phase, index) => {
          return (
            <div className="my-8 p-6 container mx-auto border rounded-lg shadow-md">
              <div className="relative">
                <p className="text-xl font-bold mb-4">Phase {index}</p>
                <button
                  onClick={() => {
                    const newConfig = { ...config };
                    newConfig.phases.splice(index, 1);
                    setConfig(newConfig);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="absolute right-0 top-0 feather feather-trash"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
              <div className="py-2">
                <label htmlFor="duration">Duration (in seconds)</label>
                <input
                  className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
                  name="duration"
                  value={phase.duration}
                  placeholder={'Duration (in seconds)'}
                  type={'number'}
                  onChange={event => {
                    const newConfig = { ...config };
                    newConfig.phases[index] = { ...phase, duration: parseInt(event.target.value) };
                    setConfig(newConfig);
                  }}
                />
              </div>
              <div className="py-2">
                <label htmlFor="arrivalRate">Arrival Rate (per second)</label>
                <input
                  className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
                  name="arrivalRate"
                  value={phase.arrivalRate}
                  placeholder={'Arrival Rate (per second)'}
                  type={'number'}
                  onChange={event => {
                    const newConfig = { ...config };
                    newConfig.phases[index] = { ...phase, arrivalRate: parseInt(event.target.value) };
                    setConfig(newConfig);
                  }}
                />
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="container h-full mx-auto py-10 relative">
      <Link className="block underline text-sm mb-3" to={'/'}>
        Go back
      </Link>
      <p className="block text-3xl mb-6 font-bold">Settings</p>
      <label htmlFor="endpoint">Endpoint</label>
      <input
        name="endpoint"
        className="bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
        value={config.url}
        placeholder={'Endpoint'}
        onChange={event => setConfig({ ...config, url: event.target.value })}
      />
      <button
        className="h-16 w-16 rounded-full items-center justify-center bg-green-500 absolute mr-5 mb-5 right-0 bottom-0"
        onClick={() => setConfig({ ...config, phases: [...config.phases, { arrivalRate: 1, duration: 1 }] })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          className="feather feather-plus"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      {renderPhasesConfig()}
    </div>
  );
}
