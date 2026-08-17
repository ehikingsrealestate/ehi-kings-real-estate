# Hero 3D-scroll assets

Drop the Higgsfield exports here with these exact names — the hero picks them up
automatically and falls back gracefully while they're missing.

| File | What it is |
| --- | --- |
| `building.mp4` (+ optional `building.webm`) | Camera move over the Audacious photo: slow dolly-in + slight upward crane, ~6–10s, **ending framed on sky**. |
| `building-poster.jpg` | First frame of that clip (static/mobile fallback). |
| `clouds.mp4` (+ optional `clouds.webm`) | 3–5s cloud fly-through that ends on a **fully white** frame. |

## Encoding for silky scrubbing (important)

Scroll-scrubbing seeks the video every frame, so it needs dense keyframes.
Re-encode Higgsfield's export with all-intra keyframes:

```
ffmpeg -i input.mp4 -vf scale=1920:-2 -an -c:v libx264 -g 1 -crf 23 -movflags +faststart building.mp4
```

(`-g 1` = every frame is a keyframe → instant seeks. File gets bigger; keep ≤ ~10s.)

Optional webm for smaller size on Chrome/Firefox:

```
ffmpeg -i input.mp4 -vf scale=1920:-2 -an -c:v libvpx-vp9 -crf 34 -b:v 0 -g 1 building.webm
```

Poster frame:

```
ffmpeg -i building.mp4 -frames:v 1 -q:v 2 building-poster.jpg
```

Preview at **/scroll-demo**.
