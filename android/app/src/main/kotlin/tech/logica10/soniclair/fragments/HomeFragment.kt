package tech.logica10.soniclair.fragments

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import tech.logica10.soniclair.R
import tech.logica10.soniclair.SubsonicClient
import tech.logica10.soniclair.TvActivity
import tech.logica10.soniclair.adapters.SoniclairCardAdapter
import tech.logica10.soniclair.models.Album
import tech.logica10.soniclair.models.ICardViewModel
import tech.logica10.soniclair.models.Song

class HomeFragment(val bind: TvActivity.TvActivityBind, val client: SubsonicClient) : Fragment() {

    private fun setUpRecyclerView(rc: RecyclerView, a: SoniclairCardAdapter) {
        rc.setHasFixedSize(true)
        val manager = LinearLayoutManager(this.context)
        manager.orientation = RecyclerView.HORIZONTAL
        rc.layoutManager = manager
        rc.adapter = a
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        val v = inflater.inflate(R.layout.fragment_home, container, false)
        val topAlbumsAdapter: SoniclairCardAdapter
        val recentAlbumsAdapter: SoniclairCardAdapter
        val newAlbumsAdapter: SoniclairCardAdapter
        val randomSongsAdapter: SoniclairCardAdapter
        val topAlbumsRecycler = v.findViewById(R.id.rv_topAlbums) as RecyclerView
        val randomSongsRecycler = v.findViewById(R.id.rv_randomSongs) as RecyclerView
        val recentAlbumsRecycler = v.findViewById(R.id.rv_recentAlbums) as RecyclerView
        val newAlbumsRecycler = v.findViewById(R.id.rv_newAlbums) as RecyclerView
        val topAlbums: List<ICardViewModel>
        val randomSongs: List<ICardViewModel>
        val recentAlbums: List<ICardViewModel>
        val newAlbums: List<ICardViewModel>
        // Load items
        runBlocking(Dispatchers.IO) {
            topAlbums = client.getTopAlbums()
            randomSongs = client.getRandomSongs()
            recentAlbums = client.getTopAlbums("recent")
            newAlbums = client.getTopAlbums("newest")
        }
        // Load
        topAlbums.forEach {
            it.image = client.getAlbumArt((it as Album).id)
        }
        randomSongs.forEach {
            it.image = client.getAlbumArt((it as Song).albumId)
        }
        recentAlbums.forEach {
            it.image = client.getAlbumArt((it as Album).id)
        }
        newAlbums.forEach {
            it.image = client.getAlbumArt((it as Album).id)
        }
        topAlbumsAdapter =
            SoniclairCardAdapter(
                topAlbums,
                topAlbumsRecycler,
                bind,
            )
        randomSongsAdapter =
            SoniclairCardAdapter(
                randomSongs,
                randomSongsRecycler,
                bind,
            )
        recentAlbumsAdapter =
            SoniclairCardAdapter(
                recentAlbums,
                recentAlbumsRecycler,
                bind,
            )
        newAlbumsAdapter =
            SoniclairCardAdapter(
                newAlbums,
                newAlbumsRecycler,
                bind,
            )
        setUpRecyclerView(topAlbumsRecycler, topAlbumsAdapter)
        setUpRecyclerView(randomSongsRecycler, randomSongsAdapter)
        setUpRecyclerView(recentAlbumsRecycler, recentAlbumsAdapter)
        setUpRecyclerView(newAlbumsRecycler, newAlbumsAdapter)
        //topAlbumsRecycler.children.first().requestFocus()
        return v
    }

}