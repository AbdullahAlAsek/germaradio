# Germalingo Radio (radio.germalingo.com)

## Upload (GitHub Pages)
1. New GitHub repository, e.g. `germalingo-radio`. Upload everything in this folder (keep `CNAME` and `.nojekyll`).
2. Settings → Pages → Branch `main`, folder `/ (root)` → Save.
3. At your domain provider add a DNS record: `CNAME`, name `radio`, value `<your-github-name>.github.io`.
4. Back in Settings → Pages: custom domain `radio.germalingo.com`, then tick "Enforce HTTPS" once it is offered.

## Add a song
1. Put the MP3 into `tracks/`.
2. In `playlist.json`, copy one song block inside `"items"` and change it. Only `file` and `title` are needed:

```json
{"type": "song", "file": "tracks/my-song.mp3", "title": {"bn": "আমার গান", "en": "My Song", "de": "Mein Lied"}, "artist": "Germalingo"}
```

`title` may also be plain text: `"title": "My Song"`.
Optional: `"style"`, `"instruments"`, `"dur"` (seconds),
`"cover"` (a picture name from `covers/` without `.jpg`, or your own path such as `"covers/my-song.jpg"`; without it one of the village pictures is used),
`"scene"`: `"rain"` (rain falls while the song plays) or `"fireflies"` (more fireflies).

## Speech (announcements)
Put a spoken MP3 into `tracks/` and add:

```json
{"type": "talk", "file": "tracks/hello.mp3", "title": {"de": "Grüße", "en": "Greetings"}, "cover": "talk"}
```

`"talkEvery": 3` plays one announcement after every 3 songs (0 = never). Add `"first": true` to a talk item to play it once when a listener presses play.

## The living village
The background follows the real daylight of the listener's time zone: night, dawn, sunrise, morning, midday, afternoon, golden hour, evening. Birds, bats, owls, stars and fireflies change with it. Tap the time at the top to see the day and drag across it to preview any hour. For a quick check you can also open `…/?t=18:30`.

Every change: upload the changed files to the repository. GitHub needs a few minutes.
