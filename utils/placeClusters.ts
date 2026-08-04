import type { Place } from "../data/places.ts";
import { distanceKm } from "./distance.ts";

export type PlaceCluster = {
  id: number;
  latitude: number;
  longitude: number;
  places: Place[];
};

const centroid = (places: Place[]) => ({
  latitude: places.reduce((sum, place) => sum + place.latitude, 0) / places.length,
  longitude: places.reduce((sum, place) => sum + place.longitude, 0) / places.length,
});

export function clusterPlacesByCoordinates(places: Place[], radiusKm = 3, minimumSize = 2): PlaceCluster[] {
  const clusters: PlaceCluster[] = [];
  for (const place of places) {
    const nearest = clusters
      .map((cluster) => ({ cluster, distance: distanceKm(place, cluster) }))
      .filter((entry) => entry.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)[0]?.cluster;
    if (nearest) {
      nearest.places.push(place);
      Object.assign(nearest, centroid(nearest.places));
    } else {
      clusters.push({ id: clusters.length, latitude: place.latitude, longitude: place.longitude, places: [place] });
    }
  }

  for (const small of [...clusters].filter((cluster) => cluster.places.length < minimumSize)) {
    const nearest = clusters
      .filter((cluster) => cluster !== small && cluster.places.length >= minimumSize)
      .map((cluster) => ({ cluster, distance: distanceKm(small, cluster) }))
      .sort((a, b) => a.distance - b.distance)[0]?.cluster;
    if (!nearest) continue;
    nearest.places.push(...small.places);
    Object.assign(nearest, centroid(nearest.places));
    clusters.splice(clusters.indexOf(small), 1);
  }
  return clusters.map((cluster, id) => ({ ...cluster, id }));
}

export function createPlaceClusterLookup(clusters: PlaceCluster[]): Map<string, number> {
  return new Map(clusters.flatMap((cluster) => cluster.places.map((place) => [place.id, cluster.id] as const)));
}
