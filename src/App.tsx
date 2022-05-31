import React, { useEffect, useState } from 'react';
import './App.scss';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Home from './Components/Home';
import PlayTest from './Components/PlayTest';
import { AppContext, AppContextDefValue, MenuContextDefValue, IMenuContext, MenuContext } from './AppContext';
import { IAccount } from './Models/AppContext';
import Artists from './Components/Artists';
import Artist from './Components/Artist';
import Album from './Components/Album';
import { CurrentTrackContext, CurrentTrackContextDefValue } from './AudioContext';
import AudioControl from './Components/AudioControl';
import { IAlbumSongResponse } from './Models/API/Responses/IArtistResponse';
import { Helmet } from 'react-helmet';
import { StatusBar } from '@capacitor/status-bar';
import Sidebar from './Components/Sidebar';
import Navbar from './Components/Navbar';
import Albums from './Components/Albums';
import GetSpotifyToken from "./Api/GetSpotifyToken";
import Loading from './Components/Loading';
import CardContextMenu from './Components/CardContextMenu';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import Search from './Components/Search';
import VLC from './Plugins/VLC';
import Account from './Components/Account';
import NowPlaying from './Components/NowPlaying';
import AndroidTV from './Plugins/AndroidTV';
import classNames from 'classnames';
import TVSidebar from './Components/TVSidebar';


function App() {
  const [context, setContext] = useState<IAccount>(AppContextDefValue);
  const [currentTrack, setCurrentTrack] = useState<IAlbumSongResponse>(CurrentTrackContextDefValue);
  const [playlist, setPlaylist] = useState<IAlbumSongResponse[]>([CurrentTrackContextDefValue]);
  const [menuContext, setMenuContext] = useState<IMenuContext>(MenuContextDefValue);
  const [androidTv, setAndroidTv] = useState<boolean>(false);
  const setPlaylistAndPlay = (p: IAlbumSongResponse[], track: number) => {
    setPlaylist(p);
    setCurrentTrack(p[track]);
  };
  const navigate = useNavigate();
  const [tried, setTried] = useState<boolean>(false);
  const contextValue = React.useMemo(() => ({
    context, setContext
  }), [context]);

  const menuContextValue = React.useMemo(() => ({
    menuContext, setMenuContext
  }), [menuContext]);
  const currentTrackContextValue = React.useMemo(() => ({ currentTrack, setCurrentTrack, playlist, setPlaylist, setPlaylistAndPlay }), [currentTrack]);
  useEffect(() => {
    const fetch = async () => {
      let token = "";
      try {
        token = await GetSpotifyToken();
      }
      catch (e) {
        await Toast.show({
          text: 'There was an error obtaining a token from spotify. Artist images may look off.',
        });
      }
      if (Capacitor.isPluginAvailable("AndroidTV")) {
        setAndroidTv((await AndroidTV.get()).value);
      }

      const c = await VLC.getActiveAccount();

      if (c.status === "ok") {
        setContext(c.value!);
      }
      else {
        setContext({ username: null, password: "", url: "", type: "" });
      }

      if (Capacitor.getPlatform() == "android") {
        StatusBar.setBackgroundColor({ color: "282c34" });
      }

      setTried(true);
      document.addEventListener("contextmenu", (event) => {
        event.preventDefault();
      });
      document.addEventListener("click", () => { setMenuContext({ body: "", show: false, x: 0, y: 0 }) });
    }
    if (!tried) {
      fetch();
    }
  }, [tried]);
  const [navbarCollapsed, setNavbarCollapsed] = useState<boolean>(true);


  return (<>
    {androidTv && <div className="App"><TVSidebar></TVSidebar></div>}

    <div className={classNames("App", androidTv ? "container-tv" : "container-fluid", "d-flex", "flex-column", "justify-content-between")}>
      <Helmet>
        <title>SonicLair</title>
      </Helmet>
      <MenuContext.Provider value={menuContextValue}>
        <CurrentTrackContext.Provider value={currentTrackContextValue}>
          <AppContext.Provider value={contextValue}>
            {!androidTv && <>
              <Navbar navbarCollapsed={navbarCollapsed} setNavbarCollapsed={setNavbarCollapsed} />
              <Sidebar navbarCollapsed={navbarCollapsed} setNavbarCollapsed={setNavbarCollapsed} /></>}

            {
              context.username === "" &&
              <div className="h-100 w-100 d-flex align-items-center justify-content-center">
                <Loading />
              </div>
            }
            {
              context.username === null && <PlayTest />
            }
            {context.username !== "" && context.username !== null &&
              <>
                <Routes>
                  <Route path="/" element={<PlayTest />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/artists" element={<Artists />} />
                  <Route path="/artist" element={<Artist />} />
                  <Route path="/album" element={<Album />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/albums" element={<Albums />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/playing" element={<NowPlaying />} />
                </Routes>
                {
                  !androidTv && <>
                  <AudioControl />

                    <CardContextMenu {...menuContext} />
                  </>
                }
              </>
            }
          </AppContext.Provider>
        </CurrentTrackContext.Provider>
      </MenuContext.Provider>
    </div>
  </>
  );
}

export default App;
