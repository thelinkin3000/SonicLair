import React, { useContext, useEffect, useState } from 'react';
import './App.scss';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Home from './Components/Home';
import PlayTest from './Components/PlayTest';
import { AppContext, AppContextDefValue } from './AppContext';
import { IAppContext, IAudioContext } from './Models/AppContext';
import Artists from './Components/Artists';
import Artist from './Components/Artist';
import Album from './Components/Album';
import { CurrentTrackContext, CurrentTrackContextDefValue } from './AudioContext';
import AudioControl from './Components/AudioControl';
import { IAlbumSongResponse } from './Models/API/Responses/IArtistResponse';
import { Helmet } from 'react-helmet';


function App() {
  const [context, setContext] = useState<IAppContext>(AppContextDefValue);
  const [currentTrack, setCurrentTrack] = useState<IAlbumSongResponse>(CurrentTrackContextDefValue);
  const [playlist, setPlaylist] = useState<IAlbumSongResponse[]>([CurrentTrackContextDefValue]);
  const [backEvent, setBackEvent] = useState<boolean>(false);
  const setPlaylistAndPlay = (p: IAlbumSongResponse[], track: number) => {
    setPlaylist(p);
    setCurrentTrack(p[track]);
  };
  const [tried, setTried] = useState<boolean>(false);
  const contextValue = React.useMemo(() => ({
    context, setContext
  }), [context]);
  const navigate = useNavigate();
  const currentTrackContextValue = React.useMemo(() => ({ currentTrack, setCurrentTrack, playlist, setPlaylist, setPlaylistAndPlay }), [currentTrack]);
  useEffect(() => {
    if (!tried) {
      const storagedCreds = localStorage.getItem('serverCreds');
      if (storagedCreds) {
        setContext(JSON.parse(storagedCreds));
      }
      setTried(true);
    }
  }, [tried]);

  useEffect(() => {
    if(!backEvent){
      console.log("registered");
      setBackEvent(true);
      document.addEventListener('ionBackButton', (ev:any) => {
        ev.detail.register(10, () => {
          console.log('Back was called!');
          navigate(-1);
        });
      });
    }

  },[]);



  return (
    <div className="App container">
      <Helmet>
        <title>SonicLair</title>
      </Helmet>
      <CurrentTrackContext.Provider value={currentTrackContextValue}>
        <AppContext.Provider value={contextValue}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/playtest" element={<PlayTest />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/artist" element={<Artist />} />
            <Route path="/album" element={<Album />} />
          </Routes>
          <AudioControl />
        </AppContext.Provider>
      </CurrentTrackContext.Provider>
    </div>
  );
}

export default App;
