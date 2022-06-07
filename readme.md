
# GNS530 MOD

This package is an enhancement of the built-in GNS530 GPS. The goal is to offer an instrument that comes as close as possible to the original.

# Latest release
https://pms50.com/fs2020/gns530/pms50-gns530.zip

See Installation section below.

# Support
The support is only on discord: https://discord.gg/TNv9jeaWKn

We'll not answer to any issue on GitHub.

# Main features
- MSFS U-turn bug workaround
- North Up / Track up map modes
- Terrain Map
- Map cursor with waypoint selection
- TCAS (anti collision system)
- NEXTRAD weather data
- Better DirectTo management
- Weather radar
- Wind indicator
- VNAV page
- Dynamic flight plan distances
- Flight plan catalog and flight plan import
- Procedure maps
- METAR (with decoded option)
- GNS430 included
- State saved between sessions
- Message management
- Configuration file
- Startup screen
- Many graphical enhancements
- Night/day lighting


# Installation

Get the latest release from  https://pms50.com/fs2020/gns530/pms50-gns530.zip

Unzip the file in your Community folder and restart the sim.

If you download from GitHub, BE CAREFUL to download only the releases (button release at the right of the GitHub screen). DON'T USE THE "CODE" button. GitHub sources may be not stable.

Sometimes users reported that it was necessary to reboot the machine (maybe after a MSFS patch?).

If you have set a config file and/or loadable flight plans, be careful to save them before the update and to restore them after.

You can also use the alternate data MOD to fix this situation (see note below).

# Bug reporting
The support is exclusively on the discord server: https://discord.gg/TNv9jeaWKn
I'll not answer to any support request on GitHub.

Before reporting a bug:
- Read the readme file (maybe not a real bug but a normal behavior)
- Install the latest release of the MOD 
- Remove any other MOD or livery
- Remove any external hardware or software involved with MSFS
- Take some time to search for the fastest sequence that reproduces the bug
- Re-install the MOD
- Restart the sim
- Reboot the computer
- Set the weather to clear sky at midday.
- Try with another aircraft having a different GPS if this is a flight plan issue

When reporting please provide:
- All the information necessary to reproduce the bug. Be very precise
- The exact flight plan (textual)
- The version number as displayed when you start the GPS
- The aircraft type
- The list of installed Mods and liveries.

If I'm not able to reproduce the issue, it will be very difficult to fix.
Messages just like "I got a froze" or "I got a CTD" without further information will not be taken into care.
I can spend all the necessary time to help but I need real information to do that.
I cannot support here external hardware, software nor liveries. Please try without them before requesting support.
Thank you for your understanding.

# Details
## Approach loading and activation
The original logic for the loading and activating of an approach has been changed. Here is how it works now:

Loading

If you choose an approach and just load it, it's then added to the flight plan but not activated. It's up to the pilot to activate it or not (activate approach in procs menu).

Activating

If you activate the approach the autopilot goes directly to the first approach waypoint by a direct To.

Note: If you set a Direct To, this automatically de-activates the approach. It will be re-activated automatically if your target waypoint is part of your approach, 2nm before reaching the target.

## Activate leg
Activate leg now works also in approach.

## Direct to
The Direct To now works correctly and you can direct to an approach icao waypoint. The flight plan waypoints are available in the DirectTo FPL element list without having to manually type them.

A DirectTo automatically de-activates the approach if there is one loaded. This one will be reactivated automatically if the directTO target waypoint is part of your approach.

A direct to an airport removes all the waypoints of the flight plan except origin and (new) destination. When doing that, it's possible to select an approach for the new destination.

## Remove approach
This feature was not working in the original fs2020 GNS530. Now it does.

## Graphical enhancements
The display screen is more readable. The font weight has been turned to "normal" instead of "bold".

There is an automatic day/night brightness

The nearest airport list doesn't flick any more and a separation line has been added between airports for better reading like in the real GNS530.

Activate approach is not selectable if not relevant (ex already activated or no approach).

## Maps
There are 3 maps available (1 for GNS430). You can use the CLR button to declutter map information. The first declutter level hides roads and airspaces. The third map is a terrain map using 4 colors:  red below 500AGL, yellow between 500AGL and 1000AGL, green between 1000AGL and 1500AGL, black above 1500AGL.

All procedures have now an associated map that displays the procedure waypoints.

## Flight plan loading
19 flight plans can be loaded.

The flight plan files must be named "fplx.pln" where x is a number between 1 and 19.

The files must reside in the folder named fpl530 at the root of the MOD folder.

Only the PLN format is accepted.

If the PLN file comes from MSFS2020 (save option in world map) the MOD will recognize SID, STARS and APPR.

If your PLN file comes from another software, the result may differ from the original flight plan because the producer software may not use the same database so SID, STAR or APPROACH may be not recognized.

## Messages
When there are messages available, the MSG indicator is set. It blinks if there are new messages not acknowledged. In order to view and acknowledge the messages, press the MSG button. There are 3 kind of messages: Advise in green, warning in yellow and caution in red.

## Config file
The config file is named config.json and is located in the directory Config/pms50-gns530 directory of the MOD. This file is not distributed but a file named example_config.json is available in this same directory. You can copy it or rename it to be your current config.json file. All entries of config file are separated by a comma except the last one (think as a comma separated collection).

## Weather radar
This is a not standard feature (not available in original GNS530) so by default it's not activated.

In order to activate it, you must set the entry "weather_radar: on" into the config.json file.

When the weather radar is activated, you can display a legend by setting the entry "weather_legend: on" into the config.json file.

The weather radar is then available in the GNS530 from the map NAV page (second NAV page).

Push the "ENT" button to toggle between map, radar horizontal and radar vertical modes. While in radar mode, and if you have activated the legend, you can toggle its display with the "CLR" button.

## data MOD
I publish releases very often because I think it's important to be reactive.

When you override a previous installation by a new release, you loose your config file and the flight plans available in dedicated folders.

To overcome this situation there is a second MOD used only for this data.

It's available at : https://pms50.com/fs2020/gns530/pms50-gns530-data.zip

Just install it in your community folder and set the config files and flight plan files in this directory instead of the main MOD directory.

What is inside this data MOD has priority against main MOD.

This data MOD will not be affected by an update of the main MOD.

## Cursor mode
When in MAP NAV page (second NAV page) you can toggle the cursor mode by pressing the right navigation knob.

Using this knob you can move the cursor. While in cursor mode, pressing the "ENT" button centers the map on the cursor position. The declutter and range buttons are available in cursor mode. Any other button closes the cursor mode and centers the map on the plane.

In cursor mode the MOD automatically selects the nearest Waypoint to be the direct TO target. So if you then press the "direct To" button, the nearest waypoint is preselected. It's a convenient way to do a DirectTO from the map.

## OBS
OBS angle can be set from the GNS530 Main NAV page (first NAV page) by pressing the right knob. You then enter in the "OBS angle set mode" and you can set the value with the right knob (by 10 degrees or 1 degree step ). The "OBS angle set mode" turns off automatically after 5 seconds of inactivity or if you press again the right knob.
The initial value of the OBS is taken from the HSI or CDI (depends of the aircraft). While in "OBS angle set mode", pressing the ENT key set the OBS to your target DTK.
When leaving the OBS Mode, the GPS issues a direct To the target waypoint. 

## Adding and deleting waypoints
There are set some limitations in order to avoid bugs. For example, you cannot insert a waypoint in a procedure. This makes sense since a procedure is a whole. If you want to bypass some waypoints of a procedure and/or fly somewhere else you can use direct To and activate leg.

There are also some limitations on removing waypoints. You cannot remove a procedure waypoint. The current leg waypoint can be removed only if you are not in autopilot NAV mode.

## METAR
The METAR data is available as second AUX page.

Before using it, you must configure it:
- Please first subscribe to https://account.avwx.rest/ (it's free) and get an API token.
- Copy this token in the "metar_avwx_token" entry of your config.json file (see above).

The METAR page provides a menu to get your origin or destination METARs in a fast way.

For refreshing, press the ENT button.

Optionally, the METAR data can be decoded. In order to activate this feature, you must set the "metar_decode" entry to "on" in the config file.

You can select any airport.
Selecting an airport can be done directly from the METAR page but also from the map page in cursor mode or from the flight plan (ENT key).

The METAR data is a real information taken from METAR stations. The result may differ from the in game weather following your configuration. This is relevant only if you play in live weather.

## TCAS
TCAS (anti collision system) information is available from the menu of the second NAV page (Map page). When activated, the word "TCAS" is displayed in the upper left corner of the screen. The TCAS mode state is saved across game sessions.

If TCAS is not activated, all the aircrafts are represented by a small airplane pictogram whatever their distance and relative altitude.

In TCAS mode aircrafts near your position are represented by the usual TCAS symbols with the following range:
- Red square if relative distance < 2nm and relative altitude < 800ft.
- Orange circle if relative distance < 4nm and relative altitude < 1000ft.
- Filled blank diamond if relative distance < 6nm and relative altitude < 1200ft.
- Un-filled blank diamond if relative distance < 30nm and relative altitude < 2700ft.

Altitude deviation from own aircraft altitude is displayed (in hundreds of feet) for each target symbol.
An arrow near the symbol tells if the aircraft is climbing or descending (altitude trend).

In TCAS mode, the declutter level 3 only displays TCAS data and the flight plan. TCAS data is available only to ranges <= 35nm. On the ground aircrafts (not moving) are excluded from display.

TCAS algorithms used in the mod are very simple and based only on the proximity. There is no calculation about any projected collision like in real instruments.

TCAS data is disabled if your own aircraft is below 500ft AGL.

TCAS is also available in a dedicated Traffic page (4th NAV page).

# Change log

## V 1.0.50
- Few changes for the 172X mod requirements.

## V 1.0.49
- SU9 Beta compatibility.

## V 1.0.48
- SU8 Beta compatibility.

## V 1.0.47
- Bugfix: the region code preset may be bad when entering a new waypoint in the flight plan.
- Bugfix: the nearest airspace list is empty. 

## V 1.0.46
- SU7 compatibility.

## V 1.0.45
- Bugfix: Flight plan was not correctly updated from sim.

## V 1.0.44
- Bugfix: The sim may change the current leg while loading or removing an approach.
- Bugfix: The sim may change the autopilot NAV mode after canceling a direct TO.

## V 1.0.43
- Bugfix: FP is sometimes deleted when it has less than 3 waypoints.
- Bugfix: The approach frequency was not set when activating the approach.

## V 1.0.42
- su6 compatibility (final step)
- Added auto brightness
- Default value for the U-turn bug workaround is now unset since the bug had been fixed in SU6.
- Default value for the add waypoint bug workaround is now unset since the bug had been fixed in SU6.
- Leaving OBS mode now switches to directTo (except for a user waypoint).
- Activating the approach sets a direct To the IAF

## V 1.0.41
- su6 compatibility (second step)
- bugfix: config file was not loaded

## V 1.0.40
- bugfix: airport altitude converted from meters to feet
- su6 compatibility (first step)

## V 1.0.39
- bugfix: the CDI was sometimes inverted
- bugfix: switch NorthUp/TrkUp was not resizing correctly the maps
- the OBS angle initial value is now taken from the HSI/CDI (depends of the aircraft)
- pressing the ENT button while displaying the OBS angle changes it to the current DTK

## V 1.0.38
- bugfix: the messages were not refreshed correctly
- bugfix: the correct leg was not reactivated after a direct to an approach WP
- bugfix: the OBS path was not displayed in directTo if there was an empty flight plan.
- bugfix: the directTo was not working correctly.

## V 1.0.37
- Display OBS angle in CDI if OBS active
- bugfix: images not displayed or flicking in nearest pages
- bugfix: the from/to arrow in CDI was flicking or was not displayed
- bugfix: direcTo an approach waypoint removes the flight plan when reaching the target
## V 1.0.36
- SU5 compatibility
- bugfix: bad LOC runway name
## V 1.0.35
- bugfix: DirectTo waypoint was not preselected from waypoint pages
- bugfix: Bad Nexrad display after weather radar view
- added VNAV page to GNS430
- added NEXRAD indicator
## V 1.0.34
- Compatibility with sim update 4
- Weather radar calibration
- Airspace message option disabled by default
## V 1.0.33
- bugfix: VSR (Vertical Speed Required) field was set to VS instead of VSR
- bugfix: procedure map legs not well displayed when OBS is active
- bugfix: frequency selection: missing last digit
- bugfix: traffic display: bad altitude
- bugfix: waypoint info symbol flickering
- bugfix: Airport symbol orientation to the main runway
- Added VS as a field
- Added MSFSTrafficService compatibility (https://github.com/laurinius/MSFSTrafficService)
- Added config options to help debugging
## V 1.0.32
- bugfix OBS angle selection
## V 1.0.31
- bugfix in spacing mode state saving
## V 1.0.30
- Changed navigation group order (last is now nearest pages)
- Group navigation do not loop any more
- Adding OBS angle setting
- Bug fixing in spacing mode state saving
## V 1.0.29
- compatibility sim update 3
## V 1.0.28
- compatibility sim update 3: temporary release before checking if all features are compatible
- enabled the OBS button as experimental feature (not tested)
- bugfix: Procedure maps not displaying path between waypoints when an approach is activated.
- bugfix: The GNS430 may fail to start from cold and start state.
## V 1.0.27
- bugfix: Bug correction: freeze if menu items all inactive
- bugfix: Channel spacing was not responding to an external change
- bugfix: Flight plan import was producing CTDs with some waypoints linked to an airport
## V 1.0.26
- bugfix: procedure map now updated only when needed (save fps)
- bugfix: weather radar and/or NEXRAD modes not updated correctly when switching between maps.
- bugfix: METAR menu may freeze the game.
## V 1.0.25
- Fixed the CTD map issue when more than 4 maps
- GNS430 map is back in dual configuration (Cessna 172)
- Added a terrain map to the GNS430
- Added specific traffic NAV page to GNS530 and GNS430
- Changed word "TRAFFIC" to "TCAS" in map page
- Turning TCAS mode now automatically sets the range to 20nm if it was greater
- Bugfix: VNAV not working above 10000ft MSL
- Bugfix: Adding a waypoint at the last displayed position of the Flight plan was disabling the cursor
## V 1.0.24
- Changed add waypoint and load flight plan code
- Load flight plan: the approach transition is now the best one instead of the first one
- Nearest airport frequencies always have 3 digits and the name is lowercase
- Nearest pages bearings are now displayed in magnetic north instead of true north
- Nearest airspaces: long airspace names were not displayed correctly
- Current loaded procedures now displayed in the procedure menu
- WPT pages: added duplicates management for VOR, NDB and intersections
- Added decoded METAR feature
- Map pages: adjusted waypoint label position
- Map NAV page: added traffic (TCAS) mode  (see note below)
## V 1.0.23
- Approach frequency automatically set to standby only if the current active frequency is different
- Official embedded and not modified 1.12.13.0 MSFS files
- Saving some GPS states between sessions: Northup/TrackUp, Data display in Map page and Channel spacing
- Bugfix: auto reactivation of approach after a directTO was not always working after update 1.12.13.0
## V 1.0.22
- Added real-time METAR data (see note below)
- Added a menu item in the default NAV page for restarting the GPS.
- VOR/LOC standby frequency automatically set to ILS/VOR frequency when loading or activating approach
- Added messages about airspaces (4 types of messages as described in the GNS530 documentation)
- Added messages for missing departure and/or arrival airports
- Last selected waypoint in the map available for the waypoint pages
- Changing some distance display in nearest pages (rounded)
- Bugfix: selection mode blocked after activating an approach from the procedure menu
- Bugfix: incorrect database information may freeze the GPS when displaying a procedure map
## V 1.0.21
- Workaround for the MSFS issue with adding waypoints (see note below)
- Prevent removing and adding procedure waypoints
- Bugfix: distance for DME-only station was not displayed
- Added a dedicated second MOD for managing config and loadable flight plans (see note below)
- Last selected waypoint in the map  page is available as the default waypoint to insert in the flight plan (insert from the map)
- Current leg can be removed from the flight plan if not in NAV mode (blocked before)
- Added a message if an approach is loaded but not activated less than 30nm from the destination
- Bugfix: distance calculation on the flight plan for some waypoints
- More waypoints displayed on the nearest intersection page
## V 1.0.20
- Radar mode: switch now made by the ENT button
- Added a cursor mode in MAP NAV page
- Waypoint page frequencies: more space to display ILS runway
- Message "Invalid waypoint index" not displayed any more in case of direct TO
## V 1.0.19
- Bug in init screen fixed
- Added flight plan load in GNS430
- Engine alert messages no more displayed (the GPS is not the place to display them)
## V 1.0.18
- Added NEXRAD in map NAV page menu
- Added a config file
- Added weather radar as an option in the config file. See notes.
- Bug correction on procedures maps display
## V 1.0.17
- Added initialization screen with software version
- Bug correction: freeze or CTDs when using a POI into the flight plan
- Initialize flight plan on GNS430 at startup
- Added MSG button management. Only a few messages are available for now. More will be added
## V 1.0.16
- Bug correction on automatic detection of the GNS530 by the GNS4330 in cold and start mode
## V 1.0.15
- Code cleanup and reorganization
- Added thumbnail for content manager
- Rebuilding of the selection waypoint page
- Added missing images for GNS430
## V 1.0.14
- Compatibility with update 1.11.16.0 code
- Bug correction in airport WP pages: the GNS freeze if selecting an empty menu (ex NONE in arrival transition)
- Bug correction: airspace status was not displayed correctly on the near airspace page
- Bug correction: ILS name display overflow in VOR/COM part
- Near airspace list extended to 4 items
- Automatically disabling of GNS430 maps in dual 530/430 configuration (Cessna 172). This is because a MSFS bug causes a CTD if using more than 4 maps for the same aircraft.
## V 1.0.13
- Disabled maps in gns430 since the sim only accepts a total of 4 maps by aircraft and crashes if there are more.
## V 1.0.12
- Wind indicator in map page not displayed at the correct place when data was displayed
- Pushing ENT button on selected FPL waypoint displays the corresponding waypoint page
- Coordinates displayed with leading and trailing zeros
- While in direct To mode, another direct To target can be selected from FPL
- Waypoint selection: the CLR button displays the previous value
- Added Maps for approaches, STARs, SIDs and runways
- Waypoint pages rebuilt
## V 1.0.11
- Better management of direct to an approach WP (manual approach reactivation not needed any more)
- Correcting some flight plan distances
- Few bug corrections
## V 1.0.10
- Adding flight plan loading (see details)
- Adding wind indicator
- Correcting some flight plan distances
## V 1.0.9
- Adding VNAV page
- Adding night/day lighting in default NAV page menu
- Dynamic flight plan page
- DirectTo map leg larger
- Airspace lines thinner
- Adding a "cancel directTo" item menu in DirectTo page
## V 1.0.8
- Compatibility with MSFS update 1.10.7.0
## V 1.0.7
- The CDI look and behavior conform to the original
- Added a BRG mark to the default NAV page compass
- Added a terrain map NAV page
- Always one decimal on DIS and XTK displays
- Radio part look conform to the original
- Changed colors
- Bug fixing: activate approach not always working
- Bug fixing: FPL leg updated after activating approach
- Some minor corrections
## V 1.0.6
- First declutter level hides roads and airspaces
- DME distance correctly rounded
- LOC Radial not any more displayed as in the original GNS530. LOC name displayed instead (ex ILS RW 31).
- Adding compass in track up map mode
- Default NAV page is in track up mode by default
- Adding range levels to 2000nm
- Prevent changing the TRK field (like original GNS530) in default NAV
- Better management of the CLR button in NAV pages
- Map page completely rebuilt
- Frequency NAV page works now nearly like original GNS530
- Flight plan has now 7 lines instead of 4 (5 vs 4 in GNS430)
- Depart and destination now displayed in flight plan
- Flight plan columns conform to the original GNS530 (added DTK and changed order)
## V 1.0.5
- Fixing the conflict when using 2 or more GPS in an aircraft
- Works now with Cessna 172
- Some small enhancements and bug corrections
- Modified GNS430 now included 
## V 1.0.4
- Bug in v1.0.3 with the track up mode half working 
## V 1.0.3
- The DirectTo behavior is now nearly similar to that of the native GNS530
- Adding toggle of map orientation in map menu (North up or Track up)
- Better management of the CLR button when inserting a waypoint
- Prevent add/removing of waypoints in approach sequence (for now)
- Bug correction: crash in load approach page when loading and there is no approach available
- Adding confirmation window when removing approach, SID, STAR or waypoint
- Removing approach, SID and STAR works by selecting the corresponding line on flight plan
- Less dependency from other Mods
## V 1.0.2
- LOC/VOR correctly displayed in the VOR field following the captured frequency
- Setting 4 levels of declutter as the original GNS530
- Adding the range and declutter level in the NAV map (left bottom corner)
- Adding missing symbol files associated to waypoint, airports, etc...
- No more flicking pages (I hope)
- The NAV/COM page now works
## V 1.0.1
- World4Fly Mod integration (Wrong radial and Rounded DME)
- NAV page now displays ETE to next waypoint instead of ETE to destination
# First release features
- Better logic for approach loading and activation
- Correcting the crazy U-turn bug
- Activate leg now works on approach waypoints
- Better DirectTo management and possibility to Direct to an approach icao waypoint
- Bug correction when direct to an airport: it was then impossible to select an approach
- Remove approach works now
- Activate approach is not selectable if not relevant (ex already activated or no approach)
- Display screen more readable
- Airport list: Correcting flicking bug and enhancing the view
- Adding a declutter level

