import {Range} from "./range.interface";

export interface Agency {
    title : string | undefined;
    rating : number | 0;
    reviewCount : number | 0;
    services : string[];
    location : string | undefined;
    employees : Range;
    hourlyRate : Range;
    minProjectSize : number | undefined;
    url : string | undefined;
    reviewsUrl? : string;
    reviews? : string[];
<<<<<<< HEAD
    profileSummary? : string;
=======
    profile? : string;
}

export interface summary {
    name : string;
    review : string;
    profile : string;
>>>>>>> bfbab2daeaaaf2f79625550013ff5ad00d99b25a
}
