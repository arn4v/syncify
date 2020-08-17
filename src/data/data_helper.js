import { updateFirebase } from "./firebase_helper";

// TODO: Assign types of databases a number. For example:
// 1: Firebase
// 2: MongoDB
// 3: SQLite
// 4: Postgres
// Etc
// TODO: Add functions for more databases in separate files
const databaseType = parseInt(process.env["DATABASE_TYPE"]) || 1;

/**
 * @param  {Object} data
 * @param  {string|undefined=undefined} location
 * @param  {string|undefined=undefined} firebaseLocation
 */
export function updateDatabase(data, firebaseLocation = undefined) {
    if (databaseType == 1) {
        firebaseLocation != undefined
            ? updateFirebase((data = data), (location = firebaseLocation))
            : updateFirebase((data = data));
    }
}
