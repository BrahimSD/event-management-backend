export interface DriverResponse {
  _id?: string;
  username: string;
  avatar: string;
  departure: string;
  departureCoords?: {
    lat: number;
    lng: number;
  };
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventDate: Date;
  eventCoords?: {
    lat: number;
    lng: number;
  };
  seats: number;
  availableSeats?: number;
  departureTime: Date;
  available: boolean;
  passengers?: {
    username: string;
    avatar: string;
  }[];
  driver?: {
    username: string;
    avatar: string;
  };
}