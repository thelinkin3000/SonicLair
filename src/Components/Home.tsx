import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../AppContext';
import { IAlbumArtistResponse, IAlbumSongResponse } from '../Models/API/Responses/IArtistResponse';
import AlbumCard from './AlbumCard';
import RandomSongCard from './RandomSongCard';
import VLC from '../Plugins/VLC';
import { Toast } from '@capacitor/toast';
import classNames from 'classnames';
import AndroidTV from '../Plugins/AndroidTV';
import { useForm } from 'react-hook-form';
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';

export default function Home() {
  const [fetched, setFetched] = useState<boolean>(false);
  const [albums, setAlbums] = useState<IAlbumArtistResponse[]>([]);
  const [songs, setSongs] = useState<IAlbumSongResponse[]>([]);
  const [androidTv, setAndroidTv] = useState<boolean>(false);
  const { focusKey, ref } = useFocusable();

  useEffect(() => {
    if (fetched)
      return;
    const fetch = async () => {
      const topAlbums = await VLC.getTopAlbums();
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
      setAndroidTv((await AndroidTV.get()).value);
      setFetched(true);
    };
    fetch();
  }, [fetched]);

  return (
    <FocusContext.Provider value={focusKey}>

      <div className={classNames("row", "scrollable", "overflow-scroll", androidTv ? "w-100" : "h-100")}>
        <div className="col-12 text-start" style={{ height: "auto" }}>
          <span className="section-header text-white">Top Albums</span>
          <hr className="text-white w-100" />
        </div>
        <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
          <div className="d-flex flex-row">
            {fetched && albums.length > 0 && albums.map(s => <div style={{ margin: "10px" }}>
              <AlbumCard item={s} forceWidth={true} />
            </div>
            )}

          </div>
        </div>
        <div className="col-12 text-start">
          <span className="section-header text-white">Random Songs</span>
          <hr className="text-white w-100" />
        </div>
        <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
          <div className="d-flex flex-row">
            {fetched && songs.map(s => <div style={{ margin: "10px" }}>
              <RandomSongCard item={s} />
            </div>
            )}

          </div>
        </div>
        <div className="h100"></div>
      </div>
    </FocusContext.Provider>

  );
}