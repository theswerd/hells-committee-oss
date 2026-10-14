# Optional game media

This directory is ignored by Git except for this note. To customize the game, add media you have permission to use under these filenames:

| File | Used for |
| --- | --- |
| `background-music.m4a` | Looping host-screen music. The footer control plays or mutes it. |
| `winner-video.mp4` | Video on the final scoreboard. |
| `winner-poster.jpg` | Optional still shown while the winner video loads. |

The game runs without these files. If the audio is absent, its control disappears; if the video is absent, the finale shows a placeholder. Keep recordings out of commits and public releases unless you have redistribution rights. These files are not covered by the project’s MIT license.
