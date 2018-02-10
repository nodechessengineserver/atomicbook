"use strict";

// system
const MongoClient = require('mongodb').MongoClient;

// local
const utils = require("./utils")

let MONGODB_URI = process.env.ATOMICBOOK_URI;
let DB_NAME = "atomicbookdb";
let BOOK_COLL_NAME = "atomicbook";

let db = null;

function clientConnect(){return MongoClient.connect(MONGODB_URI,{})}

function startDb(callback){
    clientConnect().then(client=>{
        db=client.db(DB_NAME)
        console.log(`connected to ${MONGODB_URI} < ${DB_NAME} >`)
        callback()
    },err=>{
        console.log(utils.handledError(err))
    })
}

function getCollection(name,options,callback){
    db.collection(name,options,callback)
}

function getBookCollection(callback){
    getCollection(BOOK_COLL_NAME,{},callback)
}

function dropCollection(name,options,callback){
    db.dropCollection(name,options,callback)
}

function dropBookCollection(callback){
    dropCollection(BOOK_COLL_NAME,{},callback)
}

module.exports.startDb=startDb
module.exports.getCollection=getCollection
module.exports.getBookCollection=getBookCollection
module.exports.dropCollection=dropCollection
module.exports.dropBookCollection=dropBookCollection
