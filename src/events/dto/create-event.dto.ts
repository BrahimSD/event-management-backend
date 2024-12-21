export class CreateEventDto {
    readonly name: string;
    readonly description: string;
    readonly date: Date;
    readonly location: string;
    readonly organizer: string;
    readonly image?: string;
  }