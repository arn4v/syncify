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
export function updateFirebase(
    data: Object,
    location: string | undefined = undefined
) {
    let loc: string = location == undefined ? "userInfo" : location;
    firebase.database().ref(location).update(data);
}
