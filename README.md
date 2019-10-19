# RADI
Drought indices calculation using Google Earth Engine

The code is to calculate the GRACE drought severity index (GDSI), self-calibrated Palmer Drought Severity Index (sc-PDSI), and the newly developed Reservoir Area Drought Index (RADI).

The code can be directly accessed by this link: https://code.earthengine.google.com/77bd5641fdb18c119cf58c24fdb4dae5

Note: This GEE code is used to generate the time series of each variable.
      Normalization step needs to implemented offline (e.g., using SciPy)
      (https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.norm.html)
