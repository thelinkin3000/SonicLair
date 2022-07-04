package tech.logica10.soniclair.fragments

import android.content.Context
import android.os.Bundle
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.marginLeft
import androidx.core.view.marginRight
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import tech.logica10.soniclair.R
import tech.logica10.soniclair.SubsonicClient
import tech.logica10.soniclair.TvActivity
import tech.logica10.soniclair.adapters.SoniclairCardAdapter
import tech.logica10.soniclair.models.ICardViewModel
import kotlin.math.ceil

class PlaylistsFragment(val client: SubsonicClient, val bind: TvActivity.TvActivityBind) :
    Fragment() {
    private lateinit var _playlistsRecycler: RecyclerView
    private lateinit var _playlistsAdapter: SoniclairCardAdapter
    private var density: Float = 0f
    private var width: Int = 0

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_playlists, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _playlistsRecycler = view.findViewById(R.id.rv_playlists) as RecyclerView
        view.post {
            // Get the screen's density scale
            density = resources.displayMetrics.density
            width = view.width
            val playlists: List<ICardViewModel>
            runBlocking(Dispatchers.IO) {
                playlists = client.getPlaylists()
            }
            playlists.forEach {
                it.image = client.getAlbumArt("")
            }
            _playlistsAdapter =
                SoniclairCardAdapter(
                    playlists,
                    _playlistsRecycler,
                    bind,
                )
            setUpRecyclerView(_playlistsRecycler, _playlistsAdapter)
            _playlistsRecycler.layoutManager!!.getChildAt(0)?.post{
                val v = _playlistsRecycler.layoutManager!!.getChildAt(0)!!
                val w = v.width + v.marginLeft + v.marginRight
                val columns = ceil(width / w.toFloat()).toInt()
                (_playlistsRecycler.layoutManager as GridLayoutManager).spanCount = columns
            }
        }

    }

    private fun setUpRecyclerView(rc: RecyclerView, a: SoniclairCardAdapter) {
        rc.setHasFixedSize(true)
        val columns = ceil(width / (170 * density + 0.5f)).toInt()

        val manager = GridLayoutManager(this.context, columns)
        rc.layoutManager = manager
        rc.adapter = a
    }

}