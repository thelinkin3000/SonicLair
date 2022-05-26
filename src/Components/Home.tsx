import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import GetTopAlbums from '../Api/GetTopAlbums';
import { AppContext } from '../AppContext';
import { IAlbumArtistResponse, IAlbumSongResponse } from '../Models/API/Responses/IArtistResponse';
import AlbumCard from './AlbumCard';
import GetRandomSongs from '../Api/GetRandomSongs';
import RandomSongCard from './RandomSongCard';
import MediaBrowser from '../Plugins/MediaBrowser';

export default function Home() {
  const [albumsFetched, setAlbumsFetched] = useState<boolean>(false);
  const [albums, setAlbums] = useState<IAlbumArtistResponse[]>([]);
  const [songsFetched, setSongsFetched] = useState<boolean>(false);
  const [songs, setSongs] = useState<IAlbumSongResponse[]>([]);
  const { context } = useContext(AppContext);

  useEffect(() => {
    if (albumsFetched)
      return;
    const fetch = async () => {
      const topAlbums = await GetTopAlbums(context);
      setAlbums(topAlbums.albumList2.album);
      setAlbumsFetched(true);
    };
    fetch();

  }, [albumsFetched, context]);

  useEffect(() => {
    if (songsFetched || context.accounts.length < 1)
      return;
    const fetch = async () => {
      const randomSongs = await GetRandomSongs(context);
      setSongs(randomSongs.randomSongs.song);
      setSongsFetched(true);
      MediaBrowser.loadItems(randomSongs.randomSongs.song.map(s => {
        return {
          album: s.album,
          artist: s.artist,
          song: s.title,
          duration: s.duration,
          albumArt: "",
          id: s.id
        }
      }));
    };
    fetch();
  }, [songsFetched, context]);

  return (
    <div className="row h-100 scrollable overflow-scroll">

      <div className="col-12 text-start" style={{ height: "auto" }}>
        <span className="section-header text-white">Top Albums</span>
        <hr className="text-white w-100" />
      </div>
      <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
        <div className="d-flex flex-row">
          {albums.map(s => <div style={{ margin: "10px" }}>
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
          {songsFetched && songs.map(s => <div style={{ margin: "10px" }}>
            <RandomSongCard item={s} />
          </div>
          )}

        </div>
      </div>
      <div className="h100"></div>

    </div>

  );
}