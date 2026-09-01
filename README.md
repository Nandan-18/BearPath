<p align="center">
  <img src="app/public/favicon.svg" alt="" width="96" height="96">
</p>

<h1 align="center">BearPath - Your Trusty Campus Map</h1>

BearPath is a live, responsive campus map for the University of Alberta North Campus. It finds walking routes through pedways and outdoor paths, so you can get between classes without taking the long way outside, especially during Edmonton's long, unforgiving winters.

Pick a start and destination, slide the indoor/outdoor preference, and BearPath draws the route on a 3D map with distance, walk time, and pedway stops along the way.

<p align="center">
  <a href="https://mybearpath.vercel.app" rel="noopener noreferrer" style="display: inline-block; padding: 12px 28px; font-size: 16px; font-weight: 600; line-height: 1; color: #140f0c; background-color: #7dcc9a; border-radius: 8px; text-decoration: none;">
    Try it live
  </a>
</p>

## Inspiration

The idea for BearPath came from a gap in campus navigation: most maps ignore the indoor pedway network that keeps you warm when it is -30°C outside. After hearing that frustration in the UAlberta community, we built a tool to make getting across North Campus smoother, faster, and a little less miserable in winter.

## How it works

Everything runs in the browser. There is no backend, no API key, and no install step.

Routing builds a campus graph from files in [`data/`](data/), then searches it in real time with a configurable indoor weight (default `0.35`; lower stays inside longer). The UI is Vite and React in [`app/`](app/). The map uses MapLibre GL with OpenFreeMap 3D buildings.

Share a route with query params, for example [mybearpath.vercel.app/?from=CCIS&to=SUB&w=0.35](https://mybearpath.vercel.app/?from=CCIS&to=SUB&w=0.35).

## Development

Requires Node 22.13+.

```bash
make dev    # local app at http://localhost:5173
make        # lint, test, and build
```

Tests live in [`app/test/`](app/test). You can also run `make lint`, `make test`, or `make build` on their own.
