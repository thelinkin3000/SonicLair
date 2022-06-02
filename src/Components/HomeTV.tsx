import { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../AppContext';
import { IAlbumArtistResponse, IAlbumSongResponse } from '../Models/API/Responses/IArtistResponse';
import AlbumCard from './AlbumCard';
import RandomSongCard from './RandomSongCard';
import VLC from '../Plugins/VLC';
import { Toast } from '@capacitor/toast';
import classNames from 'classnames';
import AndroidTVPlugin from '../Plugins/AndroidTV';
import { useForm } from 'react-hook-form';
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';

export default function HomeTV() {
  const [fetched, setFetched] = useState<boolean>(false);
  const [albums, setAlbums] = useState<IAlbumArtistResponse[]>([]);
  const [newAlbums, setNewAlbums] = useState<IAlbumArtistResponse[]>([]);
  const [songs, setSongs] = useState<IAlbumSongResponse[]>([]);
  const [androidTv, setAndroidTv] = useState<boolean>(false);
  const { focusKey, ref, focusSelf} = useFocusable();
  const topAlbumsRef = useRef(null);
  const randomSongsRef = useRef(null);
  const newAlbumsRef = useRef(null);


  useEffect(() => {
    if (fetched)
      return;
    const fetch = async () => {
      const topAlbums = await VLC.getTopAlbums({ type: null, size: null });
      if (topAlbums.status === "ok") {
        setAlbums(topAlbums.value!);
      }
      else {
        await Toast.show({ text: topAlbums.error });
      }
      const randomSongs = await VLC.getRandomSongs();
      if (randomSongs.status === "ok") {
        setSongs(randomSongs.value!);
      }
      const newAlbums = await VLC.getTopAlbums({type: "newest", size:null});
      if (newAlbums.status === "ok") {
        setNewAlbums(newAlbums.value!);
      }
      if((await AndroidTVPlugin.get()).value){
        setAndroidTv(true);
        focusSelf();
      }
      setFetched(true);
    };
    fetch();
  }, [fetched]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="h-100 w-100">
        <div className={classNames("d-flex", "flex-column", "scrollable", "overflow-scroll", androidTv ? "w-100" : "h-100")}>
          <div className="text-start" style={{ height: "auto" }} ref={topAlbumsRef}>
            <span className="section-header text-white">Top Albums</span>
            <hr className="text-white w-100" />
          </div>
          <div className="overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
            <div className="d-flex flex-row">
              {fetched && albums.length > 0 && albums.map(s => <div style={{ margin: "10px" }}>
                <AlbumCard item={s} forceWidth={true} parentRef={topAlbumsRef}/>
              </div>
              )}

            </div>
          </div>
          <div className="text-start" ref={randomSongsRef}>
            <span className="section-header text-white">Random Songs</span>
            <hr className="text-white w-100" />
          </div>
          <div className="overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
            <div className="d-flex flex-row">
              {fetched && songs.map(s => <div style={{ margin: "10px" }}>
                <RandomSongCard item={s} parentRef={randomSongsRef} />
              </div>
              )}

            </div>
          </div>
          <div className="text-start" style={{ height: "auto" }} ref={newAlbumsRef}>
            <span className="section-header text-white">Recently Added</span>
            <hr className="text-white w-100" />
          </div>
          <div className="overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
            <div className="d-flex flex-row">
              {fetched && newAlbums.length > 0 && newAlbums.map(s => <div style={{ margin: "10px" }}>
                <AlbumCard item={s} forceWidth={true} parentRef={newAlbumsRef}/>
              </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </FocusContext.Provider>

  );
}