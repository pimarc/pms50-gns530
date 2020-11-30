# Documentation for the GNS530 MOD Package

This package corrects some bugs of the built-in GNS530 GPS.


First release features:

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
## V 1.0.17
- Added initialization screen with software version
- Bug correction: freeze or CTDs when using a POI into the flight plan.
- Initialize flight plan on GNS430 at startup
- Added MSG button management. Only few messages available for now. More will be added. 
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
# Installation

Unzip the file in your Community directory.

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

## Flight plan loading
19 flight plans can be loaded. The flight plan files must be named "flx.pln" where x is a number between 1 and 19. The files must reside in the folder named fpl530 at the root of the MOD folder. Only the PLN format is accepted. If the PLN file comes from MSFS2020 (save option in world map) the MOD will recognize SID, STARS and APPR. If your PLN file comes from another software, the result may differ from the original flight plan because the producer software may not use the same database and SID, STARS or APPROCH may be not recognized (for example little navmap doesn't save procedures).

## Messages
When there are messages available, the MSG indicator is set. It blinks if there are new messages not acknowledged. In order to view and acknowledge the messages, press the MSG button. There are 3 kind of messages: Advise in green, warning in yellow and caution in red.