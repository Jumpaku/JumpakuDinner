

import * as database from "../database/database.json";

export type DishRecord = {
    "name": string,
    "comment": string,
    "images": Array<string>,
    "ingredients": {
        "must": Array<string>,
        "should": Array<string>,
        "may":Array<string>
    }
}

export type DishTable = ReadonlyArray<Readonly<DishRecord>>

export function getDishes(): DishTable {
    return database.dishes;
}

