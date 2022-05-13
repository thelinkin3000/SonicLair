import React, { useContext, useEffect, useState } from 'react';
import './App.scss';
import { Route, Routes } from 'react-router-dom';
import Home from './Components/Home';
import PlayTest from './Components/PlayTest';
import { AppContext, AppContextDefValue } from './AppContext';
import { IAppContext, IAudioContext } from './Models/AppContext';
import Artists from './Components/Artists';
import Artist from './Components/Artist';
import Album from './Components/Album';
import { AudioContext, AudioContextDefValue } from './AudioContext';



function App() {
  const [context, setContext] = useState<IAppContext>(AppContextDefValue);
  const [audioContext, setAudioContext] = useState<IAudioContext>(AudioContextDefValue);
  const [tried, setTried] = useState<boolean>(false);
  const contextValue = React.useMemo(() => ({
    context, setContext
  }), [context]);
  const audioContextValue = React.useMemo(() => ({ audioContext, setAudioContext }), [audioContext]);
  useEffect(() => {
    if (!tried) {
      const storagedCreds = localStorage.getItem('serverCreds');
      if (storagedCreds) {
        setContext(JSON.parse(storagedCreds));
      }
      setTried(true);
    }

  }, [tried]);

  return (
    <div className="App container">
      <AppContext.Provider value={contextValue}>
        <AudioContext.Provider value={audioContextValue}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/playtest" element={<PlayTest />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/artist" element={<Artist />} />
            <Route path="/album" element={<Album />} />
          </Routes>
        </AudioContext.Provider>
      </AppContext.Provider>
    </div>
  );
}

export default App;
