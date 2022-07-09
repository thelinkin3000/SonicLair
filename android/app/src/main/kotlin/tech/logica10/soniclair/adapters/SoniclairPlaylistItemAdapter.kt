package tech.logica10.soniclair.adapters

import android.annotation.SuppressLint
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import tech.logica10.soniclair.R
import tech.logica10.soniclair.extensions.loadUrl
import tech.logica10.soniclair.models.ICardViewModel


class SoniclairPlaylistItemAdapter(
    private var dataSet: List<ICardViewModel>,
    private val context: Context,
    private val recyclerView: RecyclerView,
    private val layoutManager: LinearLayoutManager,
    private val itemHeight: Int
) :
    RecyclerView.Adapter<SoniclairPlaylistItemAdapter.ViewHolder>() {
    private var selectedIndex: Int = -1

    /**
     * Provide a reference to the type of views that you are using
     * (custom ViewHolder).
     */
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val image: ImageView

        val firstLine: TextView
        val secondLine: TextView
        val container: CardView

        init {
            // Define click listener for the ViewHolder's View.
            image = view.findViewById(R.id.iv_playlist_item_image)
            firstLine = view.findViewById(R.id.tv_playlist_item_first_line)
            secondLine = view.findViewById(R.id.tv_playlist_item_second_line)
            container = view.findViewById(R.id.cv_playlist_item_container)
        }
    }

    // Create new views (invoked by the layout manager)
    override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
        // Create a new view, which defines the UI of the list item
        val view = LayoutInflater.from(viewGroup.context)
            .inflate(R.layout.playlist_item, viewGroup, false)
        return ViewHolder(view)
    }

    // Replace the contents of a view (invoked by the layout manager)
    override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {

        // Get element from your dataset at this position and replace the
        // contents of the view with that element
        viewHolder.firstLine.text = dataSet[position].firstLine()
        viewHolder.secondLine.text = dataSet[position].secondLine()
        viewHolder.image.loadUrl(dataSet[position].image)
        viewHolder.image.clipToOutline = true
        if (selectedIndex == position) {
            viewHolder.container.background =
                ContextCompat.getDrawable(context, R.drawable.round_outline_selected)
        } else {
            viewHolder.container.background =
                ContextCompat.getDrawable(context, R.drawable.round_outline)
        }
    }

    fun updateSelected(index: Int) {
        if (index >= 0 && index < dataSet.size) {
            val lastSelected = selectedIndex
            selectedIndex = index
            notifyItemChanged(index)
            notifyItemChanged(lastSelected)
            layoutManager.scrollToPositionWithOffset(
                selectedIndex,
                recyclerView.height / 2 - (itemHeight / 2)
            )
        }
    }

    @SuppressLint("NotifyDataSetChanged")
    fun setNewDataSet(newSet: List<ICardViewModel>) {
        dataSet = newSet
        notifyDataSetChanged()
    }

    // Return the size of your dataset (invoked by the layout manager)
    override fun getItemCount() = dataSet.size

}
