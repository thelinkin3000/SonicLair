import { useEffect, useState } from 'react';
import { IAlbumArtistResponse, IAlbumSongResponse } from '../Models/API/Responses/IArtistResponse';
import AlbumCard from './AlbumCard';
import RandomSongCard from './RandomSongCard';
import VLC from '../Plugins/VLC';
import { Toast } from '@capacitor/toast';

export default function Home() {
  const [fetched, setFetched] = useState<boolean>(false);
  const [albums, setAlbums] = useState<IAlbumArtistResponse[]>([]);
  const [songs, setSongs] = useState<IAlbumSongResponse[]>([]);
  const [newAlbums, setNewAlbums] = useState<IAlbumArtistResponse[]>([]);

  useEffect(() => {
    console.log("MOUNTED HOME!");
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
      const newAlbums = await VLC.getTopAlbums({ type: "newest", size: null });
      if (newAlbums.status === "ok") {
        setNewAlbums(newAlbums.value!);
      }
      setFetched(true);
    };
    fetch();
  }, [fetched]);

  return (
    <div className="row h-100 scrollable overflow-scroll">

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
      <div className="col-12 text-start" style={{ height: "auto" }}>
        <span className="section-header text-white">Recently Added</span>
        <hr className="text-white w-100" />
      </div>
      <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
        <div className="d-flex flex-row">
          {fetched && newAlbums.length > 0 && newAlbums.map(s => <div style={{ margin: "10px" }}>
            <AlbumCard item={s} forceWidth={true} />
          </div>
          )}

        </div>
      </div>
      <div className="h100"></div>

    </div>

  );
}