export class CreateEventDto {
    readonly name: string;
    readonly description: string;
    readonly date: Date;
    readonly time: string = '00:00';
    readonly location: string;
    readonly organizer: string;
    readonly image?: string;
  }