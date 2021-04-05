# ![](favicon.png) cbevins/fire-api-surface

*fire-api-surface* is a simplified API for generating wildland surface fire behavior estimates. Under the hood, it uses a pre-configured *fire-behavior-simulator* to do the heavy lifting.

*fire-api-surface* covers the most common fire behavior use case, producing the following variables:

- Fire ellipse:
  - area (ft2)
  - length-to-width ratio
  - perimeter (ft)
  - length (ft)
  - width: (ft)
  - heading, backing, and flanking fire behavior:
    - fireline intensity (Btu/ft/s)
    - flame length (ft)
    - scorch height (ft)
    - spread distance (ft)
    - spread rate (ft/min)

- Basic surface fire:
  - effective wind speed (ft/min)
  - flame residence time (min)
  - direction of maximum spread (degrees clockwise from upslope direction)
  - heat per unit area (btu/ft2)
  - reaction intensity (btu/ft2/min)

The following inputs are required:
- fuel model key
- 3 dead and 2 live fuel class moisture contents
- slope steepness
- wind speed and direction
- air temperature
- time since ignition

---

# ![](favicon.png) Installation

From your computer, enter:
```
> git clone https://github.com/cbevins/fire-api-surface.git
> cd fire-api-surface
> npm install
```
