# Tesla Live Share

This is a sveltekit project with convex that uses the tessie API to share live position and information for your car using a link.
The project should build to a dockerfile. The Manager can add or manage links and share those to users, that can then see the car's stats for a given period. It supports only one car for now.


## ENV vars for project

- Convex
    - deployment variables
    - custom-auth OIDC variables
    - VIN Car ID
- Tessie Access Token (for convex scheduled tasks)
- deployment Domain (tesla.example.de)

## Auth

https://docs.convex.dev/auth/advanced/custom-auth
when the custom OIDC provider returns a user, he is a manager.

## Page URLs
| url | description |
| -------- | -------- |
| /        | main page to create and manage links (by manager), SSO login required to create them (using convex OIDC) |
| /[link]  | a page link that shows a map of the current car location, the current speed, ETA, and similar |

## Database Schema

The Database (convex schema) should have:
Links:
- link short (32 characters, random)
- description (some text, for manager)
- end time (timestamp, when the share is over)
- last viewed (timestamp, when the last user accessed the link)

CarData:
- vin (vin, for identification)
- car name (last_state.display_name, for showing on clients)
- last update (timestamp of the last update)
- car data:
    - gps latitude (last_state.drive_state.latitude)
    - gps longitude (last_state.drive_state.longitude)
    - gps heading (last_state.drive_state.heading)
    - speed (last_state.drive_state.speed)
    - active_route_destination (last_state.active_route.destination)
    - active_route_latitude (last_state.active_route.latitude)
    - active_route_longitude (last_state.active_route.longitude)
    - active_route_miles_to_arrival (last_state.active_route.miles_to_arrival)
    - active_route_minutes_to_arrival (last_state.active_route.minutes_to_arrival)

## (Scheduled) Convex Tasks

always running task (every 1 minute):
- check if all links are still valid (end time not reached), if not delete them
- if there are any valid links, trigger the car update task

car update task (internal action `updateCarData`):
- fetch the car data from Tessie API and update `CarData` in the database

## Convex API

- Autorized manager
    - createLink(description, endTime): creates a new link with the given description and end time, returns the link short
    - deleteLink(linkShort): deletes the link with the given short
    - getLinks(): returns all current links for management
- Public
    - getCarData(linkShort): returns the car data for the given link short if valid, otherwise throws
    - touchLink(linkShort): updates last viewed and triggers the car update task
