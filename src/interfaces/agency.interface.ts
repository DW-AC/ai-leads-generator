import {Range} from "./range.interface";

export interface Agency {
  title: string | undefined;
  rating: number | 0;
  reviewCount: number | 0;
  services: string[];
  location: string | undefined;
  employees: Range;
  hourlyRate: Range;
  minProjectSize: number | undefined;
  url: string | undefined;
}
