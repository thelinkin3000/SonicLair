package tech.logica10.soniclair.adapters

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.RelativeLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import tech.logica10.soniclair.R
import tech.logica10.soniclair.TvActivity
import tech.logica10.soniclair.models.Album
import tech.logica10.soniclair.models.ICardViewModel
import tech.logica10.soniclair.models.Song

class SoniclairCardAdapter(
    private var dataSet: List<ICardViewModel>,
    private val recyclerView: RecyclerView,
    private val bind: TvActivity.TvActivityBind,
) :
    RecyclerView.Adapter<SoniclairCardAdapter.ViewHolder>(), View.OnClickListener {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val image: ImageView

        val firstLine: TextView
        val secondLine: TextView
        val container: RelativeLayout

        init {
            // Define click listener for the ViewHolder's View.
            image = view.findViewById(R.id.iv_album_card_image)
            firstLine = view.findViewById(R.id.tv_album_card_first_line)
            secondLine = view.findViewById(R.id.tv_album_card_second_line)
            container = view.findViewById(R.id.rl_card_container)
        }
    }

    // Create new views (invoked by the layout manager)
    override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
        // Create a new view, which defines the UI of the list item
        val view = LayoutInflater.from(viewGroup.context)
            .inflate(R.layout.album_card, viewGroup, false)
        val ret = ViewHolder(view)
        ret.itemView.setOnClickListener(this)
        return ret
    }

    // Replace the contents of a view (invoked by the layout manager)
    override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {
        fun ImageView.loadUrl(url: String) {
            Glide.with(context).load(url).into(this)
        }
        // Get element from your dataset at this position and replace the
        // contents of the view with that element
        viewHolder.firstLine.text = dataSet[position].firstLine()
        viewHolder.secondLine.text = dataSet[position].secondLine()
        viewHolder.image.loadUrl(dataSet[position].image)
        viewHolder.image.clipToOutline = true
    }

    // Return the size of your dataset (invoked by the layout manager)
    override fun getItemCount() = dataSet.size

    override fun onClick(v: View?) {
        if (v == null) {
            return
        }
        val item = dataSet[recyclerView.getChildAdapterPosition(v)]
        if (item is Album) {
            bind.playAlbum(item.id, 0)
        } else if (item is Song) {
            bind.playRadio(item.id)
        }
    }

    @SuppressLint("NotifyDataSetChanged")
    fun setNewDataSet(newSet: List<ICardViewModel>) {
        dataSet = newSet
        notifyDataSetChanged()
    }
}
