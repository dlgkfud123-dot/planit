import {readSavedTrips,removeSavedTrip,saveTrip,type TripSnapshot} from "./tripStorage.ts";
import type {TripRepository} from "./tripRepository";

export class LocalTripRepository implements TripRepository{
  async list(){return readSavedTrips()}
  async find(id:string){return readSavedTrips().find(trip=>trip.id===id)??null}
  async save(snapshot:TripSnapshot){return saveTrip(snapshot)}
  async remove(id:string){removeSavedTrip(id)}
}
