import express from "express";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, } from 'firebase/firestore/lite';

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

const dbApp = initializeApp(firebaseConfig);
const db = getFirestore(dbApp);
const app = express()

let PORT = process.env.PORT || 4000

app.get("/", async (req, res) => {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); 
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true); 
    
    const getData = async () => {
        const docSnap = await getDoc(doc(db, "Collection", "Document"));
        const data = docSnap.data()
        return data
    }
    
    const data = await getData()
    let deserializeJson = `{\"LLD\":${data["LLD"]},\"window\":${data["window"]},\"time\":${data["time"]},\"id\":\"Project/${data["id"]}\",\"status\":${data["status"]},\"mode\":\"${data["mode"]}\"}`
    console.log(deserializeJson)
    res.send(deserializeJson)
});

app.listen(PORT, () => {
    console.log(`Listen on the port ${PORT}`);
})