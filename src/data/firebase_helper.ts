import firebase from "firebase";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
};

export default class FirebaseHelper {
    private _instance: any;

    public get instance() {
        if (this._instance != null) return this._instance;
        this._instance = firebase.initializeApp(firebaseConfig);
    }

    /**
     * @param  {Object} data
     * @param  {string|undefined=undefined} location
     */
    updateFirebase(data: any, location: any = undefined): any {
        let loc: any = location == undefined ? "userInfo" : location;
        firebase.database().ref(loc).update(data);
    }
}
