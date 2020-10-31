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
## V 1.0.9
- Adding VNAV page
- Adding night/day lighting in default NAV page menu
- Dynamic flight plan page
- DirectTo map leg larger
- Airspace lines thinner
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

If you activate the approach before the last enroute waypoint, the autopilot goes directly to the first approach waypoint. This may remove your enroute waypoints.

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

The nearest airport list doesn't flick any more and a separation line has been added between airports for better reading like in the real GNS530.

A third declutter level has been added (declutter works by clicking the CLR button while in map view). I'm not sure to understand how the declutter works in fs2020 but it seems that there are 3 declutter levels depending on the zoom level. Sometimes it works, sometimes not.

Activate approach is not selectable if not relevant (ex already activated or no approach).