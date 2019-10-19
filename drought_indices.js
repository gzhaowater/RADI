// Drought indices: GDSI, sc-PDSI, RADI
// Author: Gang Zhao, Huilin Gao
// Department of Civil and Environmental Engineering
// Texas A&M University

// Important notes: 
// 1. The region shapefile is an example, change it to your ROI before calculation
// 2. This GEE code is used to generate the time series of each variable.
//    Normalization step needs to implemented offline (e.g., using SciPy)
//    (https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.norm.html)

var region = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-122.69146551685435, 37.50820174131671],
          [-121.96636786060435, 36.631620275199175],
          [-121.48296942310435, 35.994230908538455],
          [-120.75787176685435, 35.10036215301584],
          [-119.30767645435435, 34.74003367780208],
          [-118.05523504810435, 35.17223780092707],
          [-117.68169989185435, 36.154066511996064],
          [-117.94537176685435, 36.930794248106906],
          [-118.86822332935435, 38.11576004711284],
          [-119.81304754810435, 38.7183056866944],
          [-121.24127020435435, 38.87243272151572],
          [-122.42779364185435, 38.87243272151572],
          [-122.99908270435435, 38.08117721810249]]]);

////////////////////////////////////////////////////////////////////////////////////////
// Calculate sc-PDSI time series 
////////////////////////////////////////////////////////////////////////////////////////
var grace = ee.ImageCollection("NASA/GRACE/MASS_GRIDS/LAND")
              .filterDate('2002-4-1','2018-12-31')
              .map(function(image){
                return image.expression("(b(0)+b(1)+b(2))/3")
                            .select(['lwe_thickness_csr'],['GRACE'])
                            .copyProperties(image,['system:time_start']);
              });

print(ui.Chart.image.series(grace, region, ee.Reducer.mean(), 100000, 'system:time_start')
      .setOptions({
                      title: 'GRACE time series',
                      vAxis: {title: 'Water thickness (cm)'},
                      hAxis: {title: null},
                      interpolateNulls: true,
                      pointSize: 0,
                      lineWidth: 2
                  }
        ));

////////////////////////////////////////////////////////////////////////////////////////
// Calculate sc-PDSI time series 
////////////////////////////////////////////////////////////////////////////////////////

var scPDSI = ee.ImageCollection("users/zeternity/Drought_index/scPDSI")
               .select(['b1'],['sc-PDSI']);
// van der Schrier, Gerard, et al. "A scPDSI‐based global data set of dry and wet spells 
// for 1901–2009." Journal of Geophysical Research: Atmospheres 118.10 (2013): 4025-4048.

print(ui.Chart.image.series(scPDSI, region, ee.Reducer.mean(), 4000, 'system:time_start')
      .setOptions({
                      title: 'sc-PDSI time series',
                      vAxis: {title: 'sc-PDSI'},
                      hAxis: {title: null},
                      interpolateNulls: true,
                      pointSize: 0,
                      lineWidth: 2
                  }
        ));

////////////////////////////////////////////////////////////////////////////////////////
// Calculate total area time series 
////////////////////////////////////////////////////////////////////////////////////////
var start = ee.Date('1984-3-1');
var lakes = ee.FeatureCollection("users/ee_zhao/GRanD_shapefile/GRanD_v13_buf700_simp100")
              .filterMetadata('area_gee_km2','less_than',4000)
              .filterBounds(region);
var gids = lakes.aggregate_array('GRAND_ID');

var areas = ee.FeatureCollection("users/ee_zhao/GRanD_shapefile/GRanD_v13_areas")
              .filter(ee.Filter.inList('GRAND_ID', gids))
              .filterMetadata(start.format('yyyy_MM').cat('e'), 'not_equals', 'nan');
gids = areas.aggregate_array('GRAND_ID');
lakes = lakes.filter(ee.Filter.inList('GRAND_ID', gids));

var num = ee.Date('2018-12-1').difference(start, 'month');
var area_total = ee.List.sequence(0, num, 1)
                   .map(function(i){
                     var mth = start.advance(i, 'month');
                     var mth_fmt = mth.format('yyyy_MM').cat('e');
                     var value = ee.List(areas.aggregate_array(mth_fmt))
                                   .map(function(j){
                                     return ee.Number.parse(j);
                                   })
                                   .reduce(ee.Reducer.sum());
                     return ee.Feature(null, {'totalArea': value})
                              .set('system:time_start', mth.millis());
                   });

print(ui.Chart.feature.byFeature(ee.FeatureCollection(area_total), 'system:time_start', 'totalArea')
      .setOptions({
                      title: 'Area time series',
                      vAxis: {title: 'Area (km2)'},
                      hAxis: {title: null},
                      interpolateNulls: true,
                      pointSize: 0,
                      lineWidth: 2
                  }
        ));

Map.addLayer(lakes);
