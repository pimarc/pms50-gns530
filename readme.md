# Documentation for the GNS530 MOD Package

This package is an enhancement of the built-in GNS530 GPS.

If you enjoyed this software, you can participate in the development effort by clicking on the following link:

https://pms50.com/fs2020/donateGNS530mod.html

I cannot thank each of you individually so thank you to everyone who supports me.

# Installation

Unzip the file in your Community folder and restart the sim.

Sometimes users reported that it was necessary to reboot the machine (maybe after a MSFS patch?).

If you have set a config file and/or loadable flight plans, be careful to save them before the update and to restore them after.

You can also use the alternate data MOD to fix this situation (see note below).

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

# Change log
## V 1.0.21
- Workaround for the MSFS issue with adding waypoints (see note below)
- Prevent removing and adding procedure waypoints
- Bug fix: distance for DME-only station was not displayed
- Added a dedicated second MOD for managing config and loadable flight plans (see note below)
- Last selected waypoint in map is available as default waypoint to insert in flight plan (insert from map)
- Current leg can be removed from flight plan if not in NAV mode (blocked before)
- Added a message if an approach is loaded but not activated less than 30nm from destination.
- Bug fix: distance calculation on flight plan for some waypoints
- More waypoints displayed in nearest intersection page
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

# Current MSFS bugs
- Waypoint insertion is broken since November update especially if there is an approach loaded. I cannot do anything here since it's in the sim's kernel.
- U-turn bug: The airplane operates a 180° turn to come back to the last enroute waypoint if you activate an approach after the last enroute waypoint. I implemented a workaround in this MOD that consists of removing all enroute waypoints before activating the approach.
- Fancy approaches. Sometimes the approach route is very strange. This is a sim's issue and I cannot do anything here. The GPS just displays what the sim's does.
- Remove an approach waypoint doesn't work so I had to disable it until ASOBO fixes that.

# Details
## Approach loading and activation
The original logic for the loading and activating of an approach has been changed. Here is how it works now:

Loading

If you choose an approach and just load it, it's then added to the flight plan but not activated. It's up to the pilot to activate it or not (activate approach in procs menu).

Activating

If you activate the approach before the last enroute waypoint, the autopilot goes directly to the first approach waypoint. This removes your enroute waypoints.

If you activate the approach after the last enroute waypoint, the autopilot goes directly to the first approach waypoint (without U-turn!!!). This removes all the enroute waypoints.

Note: If you set a Direct To, this automatically de-activates the approach. You will have to reactivate it if needed.

## U-turn bug
This FS2020 bug probably made many of us crazy. It occurs when you select/activate an approach after the last enroute waypoint. Then the autopilot comes back to the last enroute waypoint before reaching the first approach waypoint.

The workaround to this bug implemented here is to remove all enroute waypoints in this situation. This is not a real problem since you already flew these waypoints.

## Activate leg
Activate leg now works also in approach.

## Direct to
The Direct To now works correctly and you can direct to an approach icao waypoint. These lasts are available in the DirectTo FPL element list without having to manually type them.

A DirectTo automatically de-activates the approach if there is one loaded.

A direct to an airport removes all the waypoints of the flight plan except origin and (new) destination. When doing that, it's now possible to select an approach for the new destination (bug correction).

## Remove approach
This feature was not working in the original fs2020 GNS530. Now it does.

## Graphical enhancements
The display screen is more readable. The font weight has been turned to "normal" instead of "bold".

There is a menu option for day / night brightness

The nearest airport list doesn't flick any more and a separation line has been added between airports for better reading like in the real GNS530.

Activate approach is not selectable if not relevant (ex already activated or no approach).

## Maps
There are 3 maps available (1 for GNS430). You can use the CLR button to declutter map information. The first declutter level hides roads and airspaces. The third map is a terrain map using 4 colors:  red below 500AGL, yellow between 500AGL and 1000AGL, green between 1000AGL and 1500AGL, black above 1500AGL.

All procedures have now an associated map that displays all the procedure waypoints.

Note: there is a bug in the sim if the airplane has more than 4 maps (CTD). So in case of dual combination GNS530/GNS430, I had to remove the GNS430 maps from display.

## Flight plan loading
19 flight plans can be loaded.

The flight plan files must be named "fplx.pln" where x is a number between 1 and 19.

The files must reside in the folder named fpl530 at the root of the MOD folder.

Only the PLN format is accepted.

If the PLN file comes from MSFS2020 (save option in world map) the MOD will recognize SID, STARS and APPR.

If your PLN file comes from another software, the result may differ from the original flight plan because the producer software may not use the same database so SID, STAR or APPROACH may be not recognized (for example little navmap doesn't save procedures).

## Messages
When there are messages available, the MSG indicator is set. It blinks if there are new messages not acknowledged. In order to view and acknowledge the messages, press the MSG button. There are 3 kind of messages: Advise in green, warning in yellow and caution in red.

## Config file
The config file is named config.json and is located in the directory Config/pms50-gns530 directory of the MOD. This file is not distributed but a file named example_config.json is available in this same directory. You can copy it or rename it to be your current config.json file.

## Weather radar
This is a not standard feature (not available in original GNS530) so by default it's not activated.

In order to activate it, you must set the entry "weather_radar: on" into the config.json file.

When the weather radar is activated, you can display a legend by setting the entry "weather_legend: on" into the config.json file.

The weather radar is then available in the GNS530 from the map NAV page (second NAV page).

Push the "ENT" button to toggle between map, radar horizontal and radar vertical modes. While in radar mode, and if you have activated the legend, you can toggle its display with the "CLR" button.

## data MOD
I publish releases very often because I think it's important to be reactive.

When you override a previous installation by a new release, you loose your config file and the flight plans available in dedicated folders.

To overcome this situation there is second MOD used only for this data.

It's available at : https://pms50.com/fs2020/gns530/pms50-gns530-data.zip

Just install it in your community folder and set the config files and flight plan files in this directory instead of the main MOD directory.

What is inside this data MOD has priority against main MOD.

This data MOD will not be affected by an update of the main MOD.

## Cursor mode
When in MAP NAV page (second NAV page) you can toggle the cursor mode by pressing the right navigation knob.

Using this knob you can move the cursor. While in cursor mode, pressing the "ENT" button centers the map on the cursor position. The declutter and range buttons are available in cursor mode. Any other button closes the cursor mode and centers the map on the plane.

In cursor mode the MOD automatically selects the nearest Waypoint to be the direct TO target. So if you then press the "direct To" button, the nearest waypoint is preselected. It's a convenient way to do a DirectTO from the map.

## Adding and deleting waypoints
Adding a waypoint in the flight plan is currently broken in the sim when there is an approach loaded. I found a workaround to this situation so inserting a waypoint should just work now.

However I've set some limitations in order to avoid bugs. For example, you cannot insert a waypoint in a procedure. This makes sense since a procedure is a whole. If you want to bypass some waypoints of a procedure and/or fly somewhere else you can use direct To and activate leg.

There are also some limitations on removing waypoints. You cannot remove a procedure waypoint. The current leg waypoint can be removed only if you are not in autopilot NAV mode.

For this workaround, I'm completely rebuilding the flight plan while inserting a waypoint. Although not necessary, I recommend to switch to HDG mode before inserting a waypoint.