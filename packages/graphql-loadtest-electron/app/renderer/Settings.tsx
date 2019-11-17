import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from './context';

export function Settings() {
  const { config, setConfig } = useAppContext();

  function renderPhasesConfig() {
    return (
      <div>
        {config.phases.map((phase, index) => {
          return (
            <>
              <label htmlFor="duration">Duration (in seconds):</label>
              <input
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
              <label htmlFor="arrivalRate">Arrival Rate (per second):</label>
              <input
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
            </>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <Link to={'/'}>Back</Link>
      <input
        value={config.url}
        placeholder={'Endpoint'}
        onChange={event => setConfig({ ...config, url: event.target.value })}
      />
      <button onClick={() => setConfig({ ...config, phases: [...config.phases, { arrivalRate: 1, duration: 1 }] })}>
        Add phase
      </button>
      {renderPhasesConfig()}
    </div>
  );
}
