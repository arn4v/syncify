import firebase from "firebase";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
};
firebase.initializeApp(firebaseConfig);
/**
 * @param  {Object} data
 * @param  {string|undefined=undefined} location
 */
export function updateFirebase(data, location = undefined) {
    let loc = location == undefined ? "userInfo" : location;
    firebase.database().ref(loc).update(data);
}
