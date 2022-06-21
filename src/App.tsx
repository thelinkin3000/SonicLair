import React, { useEffect, useState } from "react";
import "./App.scss";
import { Route, Routes } from "react-router-dom";
import Home from "./Components/Home";
import PlayTest from "./Components/PlayTest";
import {
    AppContext,
    AppContextDefValue,
    MenuContextDefValue,
    IMenuContext,
    MenuContext,
    IStateContext,
    StateContextDefValue,
    StateContext,
} from "./AppContext";
import { IAccount } from "./Models/AppContext";
import Artists from "./Components/Artists";
import Artist from "./Components/Artist";
import Album from "./Components/Album";
import AudioControl from "./Components/AudioControl";
import { Helmet } from "react-helmet";
import { StatusBar } from "@capacitor/status-bar";
import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";
import Albums from "./Components/Albums";
import Loading from "./Components/Loading";
import CardContextMenu from "./Components/CardContextMenu";
import { Toast } from "@capacitor/toast";
import { Capacitor } from "@capacitor/core";
import Search from "./Components/Search";
import VLC from "./Plugins/VLC";
import Account from "./Components/Account";
import NowPlaying from "./Components/NowPlaying";
import AndroidTVPlugin from "./Plugins/AndroidTV";
import TVSidebar from "./Components/TVSidebar";
import {
    FocusContext,
    init,
    useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import HomeTV from "./Components/HomeTV";
import QRScan from "./Components/QRScan";
import { App as CapacitorApp } from "@capacitor/app";
import TVJukebox from "./Components/TVJukebox";
import { TVTopBar } from "./Components/TVTopBar";

function App() {
    const [context, setContext] = useState<IAccount>(AppContextDefValue);

    const [menuContext, setMenuContext] =
        useState<IMenuContext>(MenuContextDefValue);
    const [stateContext, setStateContext] =
        useState<IStateContext>(StateContextDefValue);
    const [androidTv, setAndroidTv] = useState<boolean>(false);
    const { focusKey } = useFocusable();
    const [tried, setTried] = useState<boolean>(false);

    useEffect(() => {
        VLC.addListener("ex", (info) => {
            Toast.show({ text: info.error });
        });
    }, []);

    const contextValue = React.useMemo(
        () => ({
            context,
            setContext,
        }),
        [context]
    );

    const menuContextValue = React.useMemo(
        () => ({
            menuContext,
            setMenuContext,
        }),
        [menuContext]
    );

    const stateContextValue = React.useMemo(
        () => ({
            stateContext,
            setStateContext,
        }),
        [stateContext]
    );

    useEffect(() => {
        const fetch = async () => {
            if (Capacitor.getPlatform() === "android") {
                CapacitorApp.addListener("backButton", ({ canGoBack }) => {
                    if (canGoBack) {
                        window.history.back();
                    } else {
                        CapacitorApp.exitApp();
                    }
                });
            }
            init({
                // debug: true,
                // visualDebug: true
            });
            if (Capacitor.isPluginAvailable("AndroidTV")) {
                setAndroidTv((await AndroidTVPlugin.get()).value);
            }

            const c = await VLC.getActiveAccount();

            if (c.status === "ok") {
                setContext(c.value!);
            } else {
                setContext({ username: null, password: "", url: "", type: "", usePlaintext: false });
            }

            if (Capacitor.getPlatform() === "android") {
                StatusBar.setBackgroundColor({ color: "282c34" });
            }

            setTried(true);
            document.addEventListener("contextmenu", (event) => {
                event.preventDefault();
            });
            document.addEventListener("click", () => {
                setMenuContext({ body: "", show: false, x: 0, y: 0 });
            });
        };
        if (!tried) {
            fetch();
        }
    }, [tried]);
    const [navbarCollapsed, setNavbarCollapsed] = useState<boolean>(true);

    return (
        <>
            <StateContext.Provider value={stateContextValue}>
                <AppContext.Provider value={contextValue}>
                    {!androidTv && (
                        <div className="App container-fluid d-flex flex-column justify-content-between">
                            <Helmet>
                                <title>SonicLair</title>
                            </Helmet>
                            <MenuContext.Provider value={menuContextValue}>
                                {context.username === "" && (
                                    <div className="h-100 w-100 d-flex align-items-center justify-content-center">
                                        <Loading />
                                    </div>
                                )}
                                {context.username === null && <PlayTest />}
                                {context.username !== "" &&
                                    context.username !== null && (
                                        <>
                                            <Navbar
                                                navbarCollapsed={
                                                    navbarCollapsed
                                                }
                                                setNavbarCollapsed={
                                                    setNavbarCollapsed
                                                }
                                            />
                                            <Sidebar
                                                navbarCollapsed={
                                                    navbarCollapsed
                                                }
                                                setNavbarCollapsed={
                                                    setNavbarCollapsed
                                                }
                                            />
                                            <Routes>
                                                <Route
                                                    path="/"
                                                    element={<PlayTest />}
                                                />
                                                <Route
                                                    path="/home"
                                                    element={<Home />}
                                                />
                                                <Route
                                                    path="/artists"
                                                    element={<Artists />}
                                                />
                                                <Route
                                                    path="/artist"
                                                    element={<Artist />}
                                                />
                                                <Route
                                                    path="/album"
                                                    element={<Album />}
                                                />
                                                <Route
                                                    path="/account"
                                                    element={<Account />}
                                                />
                                                <Route
                                                    path="/albums"
                                                    element={<Albums />}
                                                />
                                                <Route
                                                    path="/search"
                                                    element={<Search />}
                                                />
                                                <Route
                                                    path="/qr"
                                                    element={<QRScan />}
                                                />
                                            </Routes>
                                            <AudioControl />
                                            <CardContextMenu {...menuContext} />
                                        </>
                                    )}
                            </MenuContext.Provider>
                        </div>
                    )}
                    {androidTv && (
                        <FocusContext.Provider value={focusKey}>
                            <div className="App container-tv-100 d-flex flex-column w-100">
                                <TVTopBar />
                                <div className="d-flex flex-row h-100 w-100 no-overflow">
                                    {context.username === "" && (
                                        <div className="h-100 w-100 d-flex align-items-center justify-content-center">
                                            <Loading />
                                        </div>
                                    )}
                                    {context.username === null && <PlayTest />}
                                    {context.username !== "" &&
                                        context.username !== null && (
                                            <>
                                                <TVSidebar />
                                                <div className="container-tv d-flex flex-column justify-content-between">
                                                    <Routes>
                                                        <Route
                                                            path="/"
                                                            element={
                                                                <PlayTest />
                                                            }
                                                        />
                                                        <Route
                                                            path="/home"
                                                            element={<HomeTV />}
                                                        />
                                                        <Route
                                                            path="/tvJukebox"
                                                            element={
                                                                <TVJukebox />
                                                            }
                                                        />
                                                        <Route
                                                            path="/playing"
                                                            element={
                                                                <NowPlaying />
                                                            }
                                                        />
                                                        <Route
                                                            path="/artists"
                                                            element={
                                                                <Artists />
                                                            }
                                                        />
                                                        <Route
                                                            path="/artist"
                                                            element={<Artist />}
                                                        />
                                                        <Route
                                                            path="/album"
                                                            element={<Album />}
                                                        />
                                                        <Route
                                                            path="/account"
                                                            element={
                                                                <Account />
                                                            }
                                                        />
                                                        <Route
                                                            path="/albums"
                                                            element={<Albums />}
                                                        />
                                                        <Route
                                                            path="/search"
                                                            element={<Search />}
                                                        />
                                                    </Routes>
                                                </div>
                                            </>
                                        )}
                                </div>
                            </div>
                        </FocusContext.Provider>
                    )}
                </AppContext.Provider>
            </StateContext.Provider>
        </>
    );
}

export default App;
