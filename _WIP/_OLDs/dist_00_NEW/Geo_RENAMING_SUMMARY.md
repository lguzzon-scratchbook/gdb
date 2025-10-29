# Geo Module Variable Renaming Audit

This document tracks the systematic refactor of `Geo.min.js`, ensuring every function receives descriptive variable names and that the rationale behind each change is recorded.

## Function Task List

| Function Context | Original Identifier | Planned Identifier Update | Purpose | Status |
| --- | --- | --- | --- | --- |
| Module wrapper | `K` | `extendWithGeoOperators` | Injects geo operators into the provided GDB instance | Completed |
| Module initializer | `N` | `initializeGeoModule` | Convenience initializer that delegates to the wrapper | Completed |
| Geo operator | `H.$near` | (retain `$near` key) | Matches nodes near a target latitude/longitude within a radius | Completed |
| Geo operator | `H.$bbox` | (retain `$bbox` key) | Matches nodes within a bounding box | Completed |
| Utility | `I` | `calculateHaversineDistanceInKm` | Computes the distance between two geo points | Completed |

## Detailed Renaming Audit

### Function: `extendWithGeoOperators` (formerly `K`)

*Context:* Top-level module wrapper responsible for injecting geolocation operators into an incoming GDB instance.

| Scope | Original Identifier | New Identifier | Rationale |
| --- | --- | --- | --- |
| Function name | `K` | `extendWithGeoOperators` | Clarifies the function’s responsibility for augmenting the module with geo capabilities. |
| Parameter | `C` | `gdbInstance` | Communicates that the argument represents the mutable GDB instance being extended. |
| Internal constant | `H` | `geoOperators` | Highlights that the object contains geolocation-specific operators. |

### Function: `$near` operator callback

*Context:* Evaluates whether a record falls within a radius of a target location.

| Original Identifier | New Identifier | Rationale |
| --- | --- | --- |
| `p` | `recordData` | Conveys that the input represents the current node/document under evaluation. |
| `j` | `nearQuery` | Indicates the structure belongs to the `$near` query payload. |
| `b` | `targetLatitude` | Describes the comparison latitude supplied by the query. |
| `k` | `targetLongitude` | Describes the comparison longitude supplied by the query. |
| `f` | `searchRadius` | States that the numeric value represents the search radius. |
| `A` | `recordLatitude` | Communicates the latitude extracted from the record. |
| `E` | `recordLongitude` | Communicates the longitude extracted from the record. |
| `I(...)` | `calculateHaversineDistanceInKm(...)` | Aligns the distance helper name with its implementation for readability. |

### Function: `$bbox` operator callback

*Context:* Validates whether a record is enclosed within a bounding box.

| Original Identifier | New Identifier | Rationale |
| --- | --- | --- |
| `p` | `recordData` | Denotes the record currently under evaluation. |
| `j` | `bboxQuery` | Describes the query configuration for the bounding box. |
| `b` | `minLatitude` | Specifies that the value is the minimum allowed latitude. |
| `k` | `maxLatitude` | Specifies that the value is the maximum allowed latitude. |
| `f` | `minLongitude` | Specifies that the value is the minimum allowed longitude. |
| `A` | `maxLongitude` | Specifies that the value is the maximum allowed longitude. |
| `E` | `recordLatitude` | Identifies the latitude sourced from the record for comparison. |
| `z` | `recordLongitude` | Identifies the longitude sourced from the record for comparison. |

### Function: `calculateHaversineDistanceInKm` (formerly `I`)

*Context:* Computes the Haversine distance in kilometers between two latitude/longitude pairs.

| Original Identifier | New Identifier | Rationale |
| --- | --- | --- |
| `I` | `calculateHaversineDistanceInKm` | Explicitly communicates the mathematical operation performed. |
| `p` | `recordLatitude` | Labels the first latitude parameter as belonging to the record. |
| `j` | `recordLongitude` | Labels the first longitude parameter as belonging to the record. |
| `b` | `targetLatitude` | Labels the second latitude parameter as belonging to the query target. |
| `k` | `targetLongitude` | Labels the second longitude parameter as belonging to the query target. |
| `f` | `convertToRadians` | Conveys that the helper converts degree measurements to radians. |
| `E` | `latitudeDifferenceRadians` | Describes the computed latitude delta in radians. |
| `z` | `longitudeDifferenceRadians` | Describes the computed longitude delta in radians. |
| `F` | `haversineCalculation` | Communicates that the value represents the aggregated Haversine formula component. |
| Literal `6371` | `EARTH_RADIUS_KM` | Extracted into a named constant to clarify the meaning of the Earth radius in kilometers. |

### Function: `initializeGeoModule` (formerly `N`)

*Context:* Convenience initializer invoking the wrapper to attach geolocation operators while logging success.

| Original Identifier | New Identifier | Rationale |
| --- | --- | --- |
| `N` | `initializeGeoModule` | Describes that the function handles module initialization. |
| `C` | `gdbInstance` | Matches the wrapper’s parameter naming for consistency. |
| `K` | `extendWithGeoOperators` | Uses the new wrapper name to maintain clarity between function references. |
