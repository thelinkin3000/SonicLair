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
import logo from "./logo.svg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { StatusBar, Style } from '@capacitor/status-bar';
import Sidebar from './Components/Sidebar';
import Navbar from './Components/Navbar';
import Albums from './Components/Albums';


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
      StatusBar.setBackgroundColor({color: "282c34"});
      const storagedCreds = localStorage.getItem('serverCreds');
      if (storagedCreds) {
        setContext(JSON.parse(storagedCreds));
      }
      else {
        setContext({ username: null, password: "", url: "" })
      }
      setTried(true);
    }
  }, [tried]);
  const [navbarCollapsed, setNavbarCollapsed] = useState<boolean>(false);


  return (
    <div className="App container d-flex flex-column justify-content-between">
      <Helmet>
        <title>SonicLair</title>
      </Helmet>
      <CurrentTrackContext.Provider value={currentTrackContextValue}>
        <AppContext.Provider value={contextValue}>
          <Navbar navbarCollapsed={navbarCollapsed} setNavbarCollapsed={setNavbarCollapsed}/>
          <Sidebar navbarCollapsed={navbarCollapsed} setNavbarCollapsed={setNavbarCollapsed}/>
          <Routes>
            {/* <Route path="/" element={<Home />} /> */}
            <Route path="/" element={<PlayTest />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/artist" element={<Artist />} />
            <Route path="/album" element={<Album />} />
            <Route path="/albums" element={<Albums />} />
          </Routes>
          <AudioControl />
        </AppContext.Provider>
      </CurrentTrackContext.Provider>
    </div>
  );
}

export default App;
