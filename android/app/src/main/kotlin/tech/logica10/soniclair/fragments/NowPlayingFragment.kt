package tech.logica10.soniclair.fragments

import android.annotation.SuppressLint
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.SeekBar
import android.widget.TextView
import androidx.core.content.res.ResourcesCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.getcapacitor.JSObject
import tech.logica10.soniclair.*
import tech.logica10.soniclair.adapters.SoniclairPlaylistItemAdapter
import tech.logica10.soniclair.extensions.loadUrl
import tech.logica10.soniclair.models.ICardViewModel
import kotlin.math.floor

class NowPlayingFragment(val bind: TvActivity.TvActivityBind, val client: SubsonicClient) :
    Fragment() {
    private lateinit var firstLine: TextView
    private lateinit var secondLine: TextView
    private lateinit var image: ImageView
    private lateinit var btnPlay: ImageButton
    private lateinit var btnShuffle: ImageButton
    private lateinit var sbProgress: SeekBar
    private lateinit var playlistRecyclerView: RecyclerView
    private lateinit var playlistAdapter: SoniclairPlaylistItemAdapter
    private lateinit var currentTimeText: TextView
    private lateinit var durationText: TextView


    private val observer = this.NowPlayingObserver()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Globals.RegisterObserver(observer)
    }

    override fun onDestroy() {
        super.onDestroy()
        Globals.UnregisterObserver(observer)
    }

    inner class NowPlayingObserver : IBroadcastObserver {
        override fun update(action: String?, value: String?) {
            when (action) {
                "MSplaylistUpdated" -> {
                    getCurrentState()
                }
                "MScurrentTrack" -> {
                    getCurrentState()
                }
                "MSplay" -> {
                    btnPlay.setImageDrawable(
                        ResourcesCompat.getDrawable(
                            resources,
                            R.drawable.ic_pause_icon,
                            null
                        )
                    )
                }
                "MSpaused" -> {
                    btnPlay.setImageDrawable(
                        ResourcesCompat.getDrawable(
                            resources,
                            R.drawable.ic_play,
                            null
                        )
                    )
                }
                "MSprogress" -> {
                    val time = JSObject(value)
                    val progress: Double? = try {
                        time.getDouble("time")
                    } catch (e: Exception) {
                        null
                    }
                    if (progress != null) {
                        sbProgress.progress = floor(progress * 100).toInt()
                        currentTimeText.text = secondsToHHSS(
                            floor(progress * bind.getCurrentState()!!.currentTrack.duration)
                                .toInt()
                        )
                    }
                }
            }
        }

    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_now_playing, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        btnPlay = view.findViewById(R.id.btn_play_pause)
        btnPlay.setOnClickListener {
            bind.playPause()
        }
        val btnPrev = view.findViewById<ImageButton>(R.id.btn_prev)
        btnPrev.setOnClickListener {
            bind.prev()
        }
        val btnNext = view.findViewById<ImageButton>(R.id.btn_next)
        btnNext.setOnClickListener {
            bind.next()
        }
        btnShuffle = view.findViewById<ImageButton>(R.id.btn_shuffle)
        btnShuffle.setOnClickListener {
            bind.shuffle()
        }
        firstLine = view.findViewById(R.id.tv_now_playing_first_line)
        secondLine = view.findViewById(R.id.tv_now_playing_second_line)
        image = view.findViewById(R.id.img_now_playing_album_art)
        sbProgress = view.findViewById(R.id.sb_now_playing_progress)
        currentTimeText = view.findViewById(R.id.tv_current_time)
        durationText = view.findViewById(R.id.tv_track_duration)
        val image: ImageView = view.findViewById(R.id.img_now_playing_album_art)
        image.clipToOutline = true

        playlistRecyclerView = view.findViewById(R.id.rv_now_playing_playlist) as RecyclerView
        val playlist: List<ICardViewModel> = listOf()
        val manager = LinearLayoutManager(this.context)
        manager.orientation = RecyclerView.VERTICAL

        playlistAdapter =
            SoniclairPlaylistItemAdapter(
                playlist,
                requireContext(),
                playlistRecyclerView,
                manager,
                (60 * resources.displayMetrics.density + 0.5f).toInt()
            )
        playlistRecyclerView.setHasFixedSize(true)
        playlistRecyclerView.layoutManager = manager
        playlistRecyclerView.adapter = playlistAdapter
        getCurrentState()

    }

    private fun secondsToHHSS(seconds: Int): String {
        return "${(seconds / 60).toString().padStart(2, '0')}:${
            (seconds % 60).toString().padStart(2, '0')
        }"
    }

    @SuppressLint("SetTextI18n")
    fun getCurrentState() {
        val currentState = bind.getCurrentState()
        if (currentState != null && currentState.currentTrack.id != "") {
            firstLine.text = currentState.currentTrack.title
            secondLine.text =
                "by ${currentState.currentTrack.artist} from ${currentState.currentTrack.album}"
            image.loadUrl(client.getAlbumArt(currentState.currentTrack.albumId))
            durationText.text = secondsToHHSS(currentState.currentTrack.duration)
            val currentPlaylist = bind.getCurrentPlaylist()
            if(currentState.playing){
                btnPlay.setImageDrawable(
                    ResourcesCompat.getDrawable(
                        resources,
                        R.drawable.ic_pause_icon,
                        null
                    )
                )
            }
            else{
                btnPlay.setImageDrawable(
                    ResourcesCompat.getDrawable(
                        resources,
                        R.drawable.ic_play,
                        null
                    )
                )
            }
            if(currentState.shuffling){
                btnShuffle.setImageDrawable(
                    ResourcesCompat.getDrawable(
                        resources,
                        R.drawable.ic_shuffle_fill_primary,
                        null
                    )
                )
            }
            else{
                btnShuffle.setImageDrawable(
                    ResourcesCompat.getDrawable(
                        resources,
                        R.drawable.ic_shuffle_fill,
                        null
                    )
                )
            }
            if (currentPlaylist != null && currentPlaylist.entry.any()) {
                val list = currentPlaylist.entry
                for (song in list) {
                    song.image = client.getAlbumArt(song.albumId)
                }
                playlistAdapter.setNewDataSet(currentPlaylist.entry)
                playlistAdapter.updateSelected(currentPlaylist.entry.indexOf(currentState.currentTrack))
            }
        }

    }
}