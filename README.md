# wp-meteogram
Weather precipitation widget

## Shortcode properties:

- **title** - Block heading 
- **type**
  - *daily* - 10 days forecast
  - *inline* - current weather
  - *at-side* - current weather at closest event location
- **lat** place latitude for weather data
- **lon** place longitude for weather data
- **detail** - detailed forecast page
- **maxwidth** - Max width of all plugin block
- **link**  - url to be navigated on mouse click
- **linktitle** - mouse over title if link present

### daily layout only:
- **barHeight** - height of temperature bars (default 100px)
- **style** - solid or gradient (default solid)

## Shortcode examples:

Common widget 

```text
[meteogram title='Kotlina Terezín' type='daily' maxwidth='480px' detail='https://www.yr.no/en/forecast/daily-table/2-3064268/Czech%20Republic/%C3%9Asteck%C3%BD%20kraj/Litom%C4%9B%C5%99ice%20District/Terez%C3%ADn' lat=50.514767 lon=14.142117]
```

### event page

Works with [Events Manager](https://wordpress.org/plugins/events-manager/) plugin 

```text
[meteogram title='#_LOCATIONNAME' type='daily' maxwidth='480px' detail='#_LATT{Place yr.no}' lat=#_LOCATIONLATITUDE lon=#_LOCATIONLONGITUDE]
```

### header

```text
[meteogram type='inline' lat=50.206891145765006 lon=14.656061569611058 link='/meteo' linktitle='Meteo']
```

```text
[meteogramtype='at-side']
```