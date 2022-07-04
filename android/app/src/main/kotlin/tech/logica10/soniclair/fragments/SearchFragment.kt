package tech.logica10.soniclair.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.*
import tech.logica10.soniclair.R
import tech.logica10.soniclair.SubsonicClient
import tech.logica10.soniclair.TvActivity
import tech.logica10.soniclair.adapters.SoniclairCardAdapter
import tech.logica10.soniclair.models.ICardViewModel


class SearchFragment(val client: SubsonicClient, val bind: TvActivity.TvActivityBind) : Fragment() {
    private lateinit var _searchBox: TextInputEditText
    private var _job: Job? = null
    private lateinit var albumsRecycler: RecyclerView
    private lateinit var songsRecycler: RecyclerView
    private lateinit var albumsAdapter: SoniclairCardAdapter
    private lateinit var songsAdapter: SoniclairCardAdapter
    private lateinit var albumsHeader: TextView
    private lateinit var songsHeader: TextView
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_search, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        albumsHeader = view.findViewById(R.id.header_search_albums)
        albumsHeader.visibility = View.INVISIBLE
        songsHeader = view.findViewById(R.id.header_search_songs)
        songsHeader.visibility = View.INVISIBLE
        _searchBox = view.findViewById(R.id.search_input)
        _searchBox.doOnTextChanged { text, _, _, _ ->
            if (text.isNullOrBlank()) {
                return@doOnTextChanged
            }
            if (_job != null && !_job!!.isCancelled) {
                _job!!.cancel()
            }
            _job = CoroutineScope(Dispatchers.IO).launch {
                delay(500)
                if (isActive) {
                    val searchResult = client.search(text.toString().trim())
                    if (!isActive) {
                        // Last chance, it's kinda expensive to update 80% of the screen
                        return@launch
                    }
                    this@SearchFragment.requireActivity().runOnUiThread(java.lang.Runnable {
                        if (searchResult.song != null && searchResult.song.isNotEmpty()) {
                            searchResult.song.forEach{it.image = client.getAlbumArt(it.albumId)}
                            songsAdapter.setNewDataSet(searchResult.song)
                            songsRecycler.visibility = View.VISIBLE
                            songsHeader.visibility = View.VISIBLE
                        } else {
                            songsRecycler.visibility = View.INVISIBLE
                            songsHeader.visibility = View.INVISIBLE
                        }
                        if (searchResult.album != null && searchResult.album.isNotEmpty()) {
                            searchResult.album.forEach{it.image = client.getAlbumArt(it.id)}
                            albumsAdapter.setNewDataSet(searchResult.album)
                            albumsRecycler.visibility = View.VISIBLE
                            albumsHeader.visibility = View.VISIBLE
                        } else {
                            albumsRecycler.visibility = View.INVISIBLE
                            albumsRecycler.visibility = View.INVISIBLE
                        }
                    })

                }
            }
        }

        albumsRecycler = view.findViewById(R.id.rv_search_albums) as RecyclerView
        songsRecycler = view.findViewById(R.id.rv_search_songs) as RecyclerView

        val albums: List<ICardViewModel> = listOf()
        val songs: List<ICardViewModel> = listOf()

        albumsAdapter =
            SoniclairCardAdapter(
                albums,
                albumsRecycler,
                bind,
            )
        songsAdapter =
            SoniclairCardAdapter(
                songs,
                songsRecycler,
                bind,
            )
        setUpRecyclerView(albumsRecycler, albumsAdapter)
        setUpRecyclerView(songsRecycler, songsAdapter)
    }

    private fun setUpRecyclerView(rc: RecyclerView, a: SoniclairCardAdapter) {
        rc.setHasFixedSize(true)
        val manager = LinearLayoutManager(this.context)
        manager.orientation = RecyclerView.HORIZONTAL
        rc.layoutManager = manager
        rc.adapter = a
    }


}