"use strict";

// system
const fs = require("fs");
const xml2js = require('xml2js');

// local
const bxtj = require("./bookxml2json")
const mongo = require("./mongo")
const utils = require("./utils")

let parser=new xml2js.Parser();

let INSERT_CHUNK = 3
let INSERT_DELAY = 5000

let drop=(process.argv.indexOf("drop")>=0)

function readFile(relpath,callback,errcallback){
    fs.readFile(`${__dirname}/${relpath}`, function(err, data) {            
        if(!err){
            console.log(`${relpath} read , length : ${data.length}`)
            callback(data)
        }else{
            console.log(`${relpath} read , error : ${err}`)
            errcallback(err)
        }
    })
}

function writeFile(relpath,content,callback){
    fs.writeFile(`${__dirname}/${relpath}`,content,err=>{
        console.log(`${relpath} , length : ${content.length} , ${err?`error : ${err}`:`written ok`}`)
        callback(err)
    });
}

let sync={}

function saveSync(callback){
    let synctext=JSON.stringify(sync,null,2)
    writeFile("book/sync.json",synctext,callback)
}

function loadSync(callback){
    console.log("loading sync")
    readFile("book/sync.json",content=>{
        console.log("sync read")
        try{            
            sync=JSON.parse(content)
            let tfens=Object.keys(sync)            
            console.log("sync has "+tfens.length+" tfens")
            callback()
        }catch(err){
            console.log("could not parse sync")
            sync={}
            callback()
        }
    },function(){
        console.log("could not read sync")
        sync={}
        callback()
    })
}

function dropBook(){    
    mongo.dropBookCollection((error,collection)=>{        
        if(error){
            console.log(utils.handledError(error))
            process.exit()
        }else{
            console.log("book dropped")            
            sync={}
            saveSync(function(){
                process.exit()
            })
        }        
    })
}

let docs

let collection

function insertChunk(){
    if(docs.length<=0){
        console.log("docs done")
        process.exit()
    }
    let chunk=[]
    for(let i=0;i<INSERT_CHUNK;i++){
        if(docs.length>0){
            chunk.push(docs.pop())
        }
    }
    console.log("prepared chunk of size "+chunk.length)
    collection.insertMany(chunk,(error,result)=>{
        if(error){
            console.log("insert error : "+error)
            process.exit()
        }else{
            console.log("inserted ok")
            for(let doc of chunk){
                let tfen=doc.tfen
                sync[tfen]=true                
            }
            saveSync(function(){
                setTimeout(insertChunk,INSERT_DELAY)
            })
        }        
    })
}

function uploadBook(bookJson){    
    console.log(`uploading book ${bookJson}`)
    docs=[]
    mongo.getBookCollection((error,getcollection)=>{        
        if(error){
            console.log(utils.handledError(error))
        }else{
            collection=getcollection
            let i=0;          
            for(let tfen in bookJson){                                                
                let pos=bookJson[tfen];
                let movestext=JSON.stringify(pos.moves);                
                let doc={
                    tfen:tfen,
                    movestext:movestext
                }
                if(!sync[tfen]) docs.push(doc);
                /*setTimeout((e)=>{
                    collection.updateOne({tfen:tfen},{"$set":{movestext:movestext}},{upsert:true},(error,result)=>{                    
                        if(error){
                            console.log(utils.handledError(error));
                        }else{                        
                            console.log(`uploaded ${result.result.n} ${tfen} [ left : ${--i} ]`);
                            if(i<=0) process.exit()
                        }
                    })
                },i*2000);*/
            }
            insertChunk()
        }
    })
    //process.exit()
}

function readAndUploadBook(){
    readFile("book/default.xml",data=>{
        parser.parseString(data, function (err, result) {
            if(err){
                console.log(err)
            }else{
                console.log(result);
                let bookJson=bxtj.bookXmlJsonToBookJson(result);        
                let jsontext=JSON.stringify(bookJson,null,2);
                writeFile("book/default.json",jsontext,err=>{                                    
                    uploadBook(bookJson)      
                })
            }        
        });
    },err=>{})
}

mongo.startDb(function(){
    if(drop){
        dropBook()
    }else{
        loadSync(function(){
            readAndUploadBook()
        })        
    }
})