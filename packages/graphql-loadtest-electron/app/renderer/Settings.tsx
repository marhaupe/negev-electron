import React from 'react';
import { Link } from 'react-router-dom';
import { useAppConfigContext } from './context';

export function Settings() {
  const [config, setConfig] = useAppConfigContext();

  function renderHeadersConfig() {
    return (
      <div className="border-t-2 border-gray-400 py-8">
        <button
          className="underline"
          onClick={() => {
            const newConfig = { ...config };
            (newConfig as any).fetchConfig.headers[''] = '';
            setConfig(newConfig);
          }}
        >
          Add header
        </button>
        <div className="my-8 p-6 container mx-auto border rounded-lg shadow-md">
          {config.fetchConfig.headers &&
            Object.keys(config.fetchConfig.headers).map(header => {
              return (
                <>
                  <div className="py-2 flex">
                    <input
                      className="bg-white mx-2 flex-1 focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4"
                      defaultValue={header}
                      placeholder="Key"
                      type="text"
                      onBlur={event => {
                        // Changing the key of an object that is being rerendered as soon as the this key changes
                        // is challenging. Making this input field controlled. e.g. providing a `value` that changes
                        // in `onChange`, does not work, because this creates a new component that doesn't have focus.
                        const newConfig = { ...config };
                        const newKey = event.target.value;
                        const oldKey = header;
                        (newConfig as any).fetchConfig.headers[newKey] = (newConfig as any).fetchConfig.headers[oldKey];
                        delete (newConfig as any).fetchConfig.headers[oldKey];
                        setConfig(newConfig);
                      }}
                    />
                    <input
                      className="bg-white mx-2 flex-1 focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4"
                      value={(config as any).fetchConfig.headers[header]}
                      placeholder="Value"
                      type="text"
                      onChange={event => {
                        const newConfig = { ...config };
                        (newConfig as any).fetchConfig.headers[header] = event.target.value;
                        setConfig(newConfig);
                      }}
                    />
                    <button
                      onClick={() => {
                        const newConfig = { ...config };
                        delete (newConfig as any).fetchConfig.headers[header];
                        setConfig(newConfig);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="flex-1 feather feather-minus-circle"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </>
              );
            })}
        </div>
      </div>
    );
  }

  function renderPhasesConfig() {
    return (
      <div className="border-t-2 border-gray-400 py-8">
        <button
          className="underline"
          onClick={() => setConfig({ ...config, phases: [...config.phases, { arrivalRate: 1, duration: 1 }] })}
        >
          Add phase
        </button>
        {config.phases.map((phase, index) => {
          return (
            <div key={index} className="my-8 p-6 container mx-auto border rounded-lg shadow-md">
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
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
      </div>
    );
  }

  return (
    <div className="container h-full mx-auto py-10">
      <Link className="block underline mb-3" to={'/'}>
        Go back
      </Link>
      <p className="block text-3xl mb-6 font-bold">Settings</p>
      {renderPhasesConfig()}
      {renderHeadersConfig()}
    </div>
  );
}
